
import yt_dlp
import whisper
import google.generativeai as genai
from supabase import create_client, Client
from google.colab import userdata
import os
import time
import re

# ---------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------

# Retrieve Secrets (Colab or Local)
try:
    SUPABASE_URL = userdata.get('SUPABASE_URL') or os.getenv('SUPABASE_URL')
    SUPABASE_KEY = userdata.get('SUPABASE_KEY') or os.getenv('SUPABASE_KEY')
    GEMINI_API_KEY = userdata.get('GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
except:
    SUPABASE_URL = "" # User must fill if running locally without env vars
    SUPABASE_KEY = ""
    GEMINI_API_KEY = ""

if not SUPABASE_URL or not GEMINI_API_KEY:
    print("⚠️  MISSING SECRETS! Please set SUPABASE_URL, SUPABASE_KEY, and GEMINI_API_KEY.")
    # Stop execution if important keys are missing? For now, we'll let it error out later if not filled.

genai.configure(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
# Whisper Model
whisper_model = whisper.load_model("medium") # Good balance for Arabic
CLEANING_MODEL = "gemini-1.5-flash" # Fast, Free-tier friendly. (Use 'gemini-2.0-flash-exp' for bleeding edge)

# ---------------------------------------------------------
# HELPER FUNCTIONS
# ---------------------------------------------------------

def clean_transcript_with_gemini(text):
    """
    Uses Gemini to clean the transcript.
    Removes stutters, repeated words, and fixes punctuation while keeping the dialect.
    """
    model = genai.GenerativeModel(CLEANING_MODEL)
    
    prompt = f"""
    You are a professional Arabic editor. 
    Clean the following transcript from a Saudi podcast.
    
    Rules:
    1. Remove stutters (e.g., "أنا أنا كنت" -> "أنا كنت").
    2. Remove filler words if they add no meaning (e.g., "يعني يعني").
    3. Fix punctuation to make it readable.
    4. **CRITICAL**: Do NOT change the dialect or words. Keep "وش صار" as "وش صار", do not change to "ماذا حدث".
    5. Return ONLY the cleaned text.

    Text:
    "{text}"
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"  ⚠️ Gemini Cleaning Error: {e}")
        return text # Fallback to original if AI fails

def get_embedding_v2(text, retries=5):
    """
    Generates embedding using the CORRECT model and dimensions.
    """
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
                raise e

# ---------------------------------------------------------
# MAIN PIPELINE
# ---------------------------------------------------------

VIDEO_URL = "YOUR_VIDEO_URL_HERE" # <--- PASTE URL HERE
FILENAME = "episode.mp3"

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
print(f"🎙️  Transcribing (Whisper Medium)...")
result = whisper_model.transcribe(
    FILENAME,
    verbose=False, # Quieter output
    language="ar",
    initial_prompt="هذا بودكاست باللغة العربية يتحدث عن ريادة الأعمال والبزنس، باللهجة السعودية."
)
segments = result['segments']
print(f"✅ Transcribed {len(segments)} segments.")

# 3. Save Episode to DB
print(f"💾 Saving Episode metadata...")
response = supabase.table('episodes').upsert({
    'video_id': video_id,
    'title': video_title,
    'url': f"https://www.youtube.com/watch?v={video_id}",
    'thumbnail_url': thumbnail_url
}, on_conflict='video_id').select().execute()

episode_int_id = response.data[0]['id']
print(f"✅ Episode ID: {episode_int_id}")

# 4. Process Chunks (The Logic)
print("🧠 Processing Chunks (Cleaning & Embedding)...")

chunks_to_insert = []
current_buffer = ""
current_start = 0

# Adjust this limit for chunk size (approx 30-60 secs of speech)
CHAR_LIMIT = 800 

for i, segment in enumerate(segments):
    text = segment['text']
    start = segment['start']
    
    # Initialize start time for the new buffer
    if not current_buffer:
        current_start = start
    
    current_buffer += " " + text
    
    # If buffer is full, process it
    if len(current_buffer) >= CHAR_LIMIT or i == len(segments) - 1:
        raw_text = current_buffer.strip()
        
        # A. Clean Text
        print(f"  ✨ Cleaning Chunk {len(chunks_to_insert)+1}...", end="\r")
        cleaned_text = clean_transcript_with_gemini(raw_text)
        
        # B. Embed Text
        embedding = get_embedding_v2(cleaned_text)
        
        # C. Add to List
        chunks_to_insert.append({
            'episode_id': episode_int_id,
            'content': cleaned_text, # Storing the CLEAN text
            'start_time': current_start,
            'end_time': segment['end'],
            'embedding': embedding
        })
        
        # Reset
        current_buffer = ""

# 5. Batch Insert
print(f"\n🚀 Inserting {len(chunks_to_insert)} chunks into Supabase...")
BATCH_SIZE = 50
for i in range(0, len(chunks_to_insert), BATCH_SIZE):
    batch = chunks_to_insert[i:i+BATCH_SIZE]
    supabase.table('chunks').upsert(batch).execute()
    print(f"  written {i + len(batch)} / {len(chunks_to_insert)}")

print("\n🎉 DONE! Phase 2 Processing Complete.")
