
import yt_dlp
import whisper
import google.generativeai as genai
from supabase import create_client, Client
from google.colab import userdata
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import time
from dotenv import load_dotenv

# Load local env if present (ignore on Colab)
load_dotenv('.env.local')

# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------

# 👇 CONFIGURATION 👇
VIDEO_URL = "https://youtu.be/QPTwsoa47do" 
WHISPER_MODEL = "small" # Use "medium" for GPU, "small" for CPU (to be faster)

FILENAME = "episode.mp3"
CLEANING_MODEL = "gemini-1.5-flash"

# ---------------------------------------------------------
# SETUP
# ---------------------------------------------------------
try:
    SUPABASE_URL = userdata.get('SUPABASE_URL') or os.getenv('SUPABASE_URL')
    SUPABASE_KEY = userdata.get('SUPABASE_KEY') or os.getenv('SUPABASE_KEY')
    GEMINI_API_KEY = userdata.get('GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
except:
    SUPABASE_URL = ""
    SUPABASE_KEY = ""
    GEMINI_API_KEY = ""

if not SUPABASE_URL or not GEMINI_API_KEY:
    print("⚠️  MISSING SECRETS! Check Colab Keys or .env.local")

genai.configure(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------

def clean_transcript_with_gemini(text):
    """Clean text using Gemini 1.5 Flash."""
    model = genai.GenerativeModel(CLEANING_MODEL)
    prompt = f"""
    You are a professional Arabic editor. 
    Clean the following transcript from a Saudi podcast.
    Rules:
    1. Remove stutters (e.g., "أنا أنا كنت" -> "أنا كنت").
    2. Remove filler words if they add no meaning.
    3. Fix punctuation.
    4. Keep the Saudi dialect (e.g. keep "وش صار").
    5. Return ONLY the cleaned text.
    Text: "{text}"
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"  ⚠️ Cleaning Error: {e}")
        return text

def get_embedding_v2(text, retries=5):
    """Generate 768-dim embedding."""
    for attempt in range(retries):
        try:
            return genai.embed_content(
                model="models/gemini-embedding-001",
                content=text,
                output_dimensionality=768
            )['embedding']
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
            else:
                return None

# ---------------------------------------------------------
# MAIN PIPELINE
# ---------------------------------------------------------

# 1. Download
print(f"\n⬇️  Downloading: {VIDEO_URL}...")
ydl_opts = {
    'format': 'bestaudio/best',
    'postprocessors': [{'key': 'FFmpegExtractAudio','preferredcodec': 'mp3','preferredquality': '192'}],
    'outtmpl': FILENAME.replace('.mp3', ''),
    'quiet': True,
    'overwrites': True
}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(VIDEO_URL, download=True)
    video_title = info.get('title', 'Unknown Title')
    video_id = info.get('id')
    thumbnail_url = info.get('thumbnail')
print(f"✅ Downloaded: {video_title}")

# 2. Transcribe
print(f"🎙️  Transcribing (Whisper {WHISPER_MODEL})...")
whisper_model = whisper.load_model(WHISPER_MODEL)
result = whisper_model.transcribe(FILENAME, language="ar", initial_prompt="بودكاست سعودي ريادة أعمال")
segments = result['segments']
print(f"✅ Transcribed {len(segments)} segments.")

# 3. Save Metadata
print(f"💾 Saving Episode Metadata...")
# Step A: Upsert
supabase.table('episodes').upsert({
    'video_id': video_id,
    'title': video_title,
    'url': f"https://www.youtube.com/watch?v={video_id}",
    'thumbnail_url': thumbnail_url
}, on_conflict='video_id').execute()

# Step B: Select ID
response = supabase.table('episodes').select('id').eq('video_id', video_id).execute()
episode_int_id = response.data[0]['id']
print(f"✅ Episode ID: {episode_int_id}")

# 4. Parallel Processing
print("🧠 Processing Chunks (Cleaning & Embedding) in PARALLEL...")

raw_chunks = []
current_buffer = ""
current_start = 0
CHAR_LIMIT = 800

for i, segment in enumerate(segments):
    text = segment['text']
    if not current_buffer: current_start = segment['start']
    current_buffer += " " + text
    if len(current_buffer) >= CHAR_LIMIT or i == len(segments) - 1:
        raw_chunks.append({'text': current_buffer.strip(), 'start': current_start, 'end': segment['end']})
        current_buffer = ""

def process_single_chunk(chunk_data):
    try:
        cleaned = clean_transcript_with_gemini(chunk_data['text'])
        emb = get_embedding_v2(cleaned)
        if not emb: return None
        return {
            'episode_id': episode_int_id,
            'content': cleaned,
            'start_time': chunk_data['start'],
            'end_time': chunk_data['end'],
            'embedding': emb
        }
    except: return None

chunks_to_insert = []
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(process_single_chunk, c) for c in raw_chunks]
    for i, future in enumerate(as_completed(futures)):
        res = future.result()
        if res: chunks_to_insert.append(res)
        print(f"  ✨ {i+1}/{len(raw_chunks)}", end="\r")

chunks_to_insert.sort(key=lambda x: x['start_time'])

# 5. Insert
print(f"\n🚀 Inserting {len(chunks_to_insert)} chunks...")
for i in range(0, len(chunks_to_insert), 50):
    supabase.table('chunks').upsert(chunks_to_insert[i:i+50]).execute()
    print(f"  written {i + 50}")

print("\n🎉 DONE! Video Processed Successfully.")
