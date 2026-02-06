"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Play, ArrowLeft, Copy, Check } from "lucide-react";
import { SearchResult } from "@/types";
import Image from "next/image";
import { supabase } from "@/lib/supabase"; // Import Supabase Client

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{
    url: string;
    startTime: number;
  } | null>(null);

  // Filter State
  const [episodes, setEpisodes] = useState<{ id: number; title: string }[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [showAbout, setShowAbout] = useState(false);

  // Fetch Episodes on Mount
  useState(() => {
    const fetchEpisodes = async () => {
      const { data } = await supabase
        .from("episodes")
        .select("id, title")
        .order("id", { ascending: false });
      if (data) setEpisodes(data);
    };
    fetchEpisodes();
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setError(null);
    setHasSearched(true);
    setActiveVideo(null);

    try {
      // Append timestamp to prevent browser/network caching
      const res = await fetch(`/api/search?ts=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          filter_episode: selectedEpisode ? parseInt(selectedEpisode) : null,
        }),
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.results) {
        setResults(data.results);
      }
    } catch (error: any) {
      console.error("Search failed", error);
      setError(error.message || "فشل البحث، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const playVideo = (url: string, startTime: number) => {
    // Convert YouTube URL to Embed URL with start time
    // Expected URL format: https://www.youtube.com/watch?v=VIDEO_ID
    const videoId = url.split("v=")[1]?.split("&")[0];
    if (videoId) {
      // Round start time to nearest second
      const start = Math.floor(startTime);
      const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${start}`;
      setActiveVideo({ url: embedUrl, startTime });
    }
  };

  return (
    <main className="min-h-screen bg-[oklch(0.92_0.02_95)] text-[#1f1f1f] flex flex-col items-center selection:bg-[#DB3C1D]/20 font-sans relative overflow-x-hidden">
      {/* Navbar Minimal Placeholder */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center z-10">
        <div className="relative w-28 h-24 hover:opacity-90 transition-opacity cursor-pointer">
          <Image
            src="/icon.png"
            alt="Lahza Logo"
            fill
            className="object-contain object-right"
            priority
          />
        </div>
        <div className="flex gap-4 md:gap-6 text-xs md:text-sm font-semibold text-[#DB3C1D]">
          <button
            onClick={() => setShowAbout(true)}
            className="cursor-pointer text-[#DB3C1D] hover:text-[#c94f34] transition-colors decoration-wavy underline-offset-4 hover:underline">
            عن المشروع
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        className={`w-full max-w-4xl px-6 transition-all duration-700 ease-out z-10 ${results.length > 0 || activeVideo ? "mt-8 mb-12" : "mt-[10vh]"}`}>
        <div
          className={`text-center mb-10 duration-700 transition-all flex flex-col items-center ${results.length > 0 || activeVideo ? "scale-90" : "scale-100"}`}>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-black font-sans">
            لحظة{" "}
            <span className="text-[#DB3C1D] font-semibold text-5xl md:text-7xl">
              | Lahza
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#555] font-semibold max-w-2xl mx-auto leading-relaxed -mt-4">
            لا تبحث عن الحلقة .. ابحث عن الفكرة
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="w-full max-w-3xl mx-auto mb-4 flex justify-end">
          <select
            value={selectedEpisode}
            onChange={e => setSelectedEpisode(e.target.value)}
            className="bg-transparent text-sm text-[#777] border-0 outline-none cursor-pointer hover:text-[#DB3C1D] transition-colors dir-rtl text-right appearance-none"
            dir="rtl">
            <option value="">كل الحلقات ({episodes.length})</option>
            {episodes.map(ep => (
              <option key={ep.id} value={ep.id}>
                {ep.title}
              </option>
            ))}
          </select>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative w-full max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-[#DB3C1D]/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-white rounded-full border border-[#E5E5E5] shadow-sm hover:border-[#DB3C1D]/50 hover:shadow-md focus-within:border-[#DB3C1D] focus-within:ring-4 focus-within:ring-[#DB3C1D]/5 transition-all duration-300 h-16">
              <div className="flex items-center justify-center w-14 h-full pointer-events-none">
                <Search className="text-[#DB3C1D] w-6 h-6 opacity-70" />
              </div>
              <Input
                className="flex-1 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-xl h-full px-2 text-[#1f1f1f] placeholder:text-[#999] font-normal"
                placeholder="ابحث في أرشيف ثمانية دلالياً..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                dir="rtl"
              />
              <div className="pl-2">
                <Button
                  type="submit"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-white hover:bg-[#FAF9F6] text-[#DB3C1D] border border-transparent hover:border-[#E5E5E5] transition-all ml-2"
                  disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowLeft className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Content Area */}
      <div className="w-full max-w-7xl px-6 pb-20 z-10">
        {/* Messages */}
        <div className="max-w-2xl mx-auto mb-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl text-center animate-in fade-in slide-in-from-bottom-2">
              {error}
            </div>
          )}

          {!loading && hasSearched && results.length === 0 && !error && (
            <div className="text-center text-[#777] py-16 animate-in fade-in zoom-in duration-500">
              <p className="text-xl font-medium mb-2">لم نعثر على نتائج</p>
              <p className="text-sm opacity-70">
                جرب كلمات مختلفة أو عبارات أعم
              </p>
            </div>
          )}
        </div>

        {(results.length > 0 || activeVideo) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
            {/* Search Results Column */}
            {/* Search Results Column */}
            <div className="lg:col-span-8 lg:col-start-3 space-y-6">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-black/5">
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  نتائج البحث
                  <span className="bg-[#DB3C1D]/10 text-xs px-2 py-0.5 rounded-full font-mono text-[#DB3C1D]">
                    {results.length}
                  </span>
                </h3>
              </div>

              <ScrollArea className="h-auto pr-4 -mr-4">
                <div className="space-y-4 pb-8 pl-2">
                  {results.map(result => (
                    <div
                      key={result.id}
                      className="group relative flex flex-col md:flex-row gap-6 p-4 rounded-2xl hover:bg-black/[0.02] transition-colors cursor-pointer border border-transparent hover:border-black/5"
                      onClick={() =>
                        playVideo(result.episode_url, result.start_time)
                      }>
                      {/* Thumbnail with Play Overlay */}
                      <div className="relative w-full md:w-56 aspect-video shrink-0 rounded-xl overflow-hidden shadow-sm">
                        {result.thumbnail_url ? (
                          <Image
                            src={result.thumbnail_url}
                            alt={result.episode_title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                            <span className="text-xs">No Image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                        {/* Custom Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                          <div className="bg-white/90 backdrop-blur-md text-[#DB3C1D] rounded-full p-3 shadow-lg">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>

                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-md font-mono font-medium">
                          {formatTime(result.start_time)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col pt-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-bold text-[#1f1f1f] text-lg leading-tight group-hover:text-[#DB3C1D] transition-colors line-clamp-1">
                            {result.episode_title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100 text-[10px] px-2 h-6 flex-shrink-0">
                            {(result.similarity * 100).toFixed(0)}% ملائمة
                          </Badge>
                        </div>

                        <p
                          className="text-[#666] text-base leading-relaxed line-clamp-3 font-normal ml-4"
                          dir="rtl">
                          {result.content}
                        </p>

                        <div className="mt-auto pt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-2 text-xs text-[#999]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DB3C1D]"></span>
                            <span>اضغط للمشاهدة من هذه اللحظة</span>
                          </div>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(result.content);
                              const btn = e.currentTarget;
                              const original = btn.innerHTML;
                              btn.innerHTML =
                                '<span class="text-green-600 flex items-center gap-1 text-xs font-bold">تم النسخ <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg></span>';
                              setTimeout(() => {
                                btn.innerHTML = original;
                              }, 2000);
                            }}
                            className="text-[#999] hover:text-[#1f1f1f] p-1.5 rounded-md hover:bg-black/5 transition-colors"
                            title="نسخ النص">
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Video Player Modal Overlay */}
            {activeVideo && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setActiveVideo(null)}>
                <div
                  className="relative w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10"
                  onClick={e => e.stopPropagation()}>
                  {/* Close Button */}
                  <button
                    onClick={() => setActiveVideo(null)}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full backdrop-blur-md transition-all">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-x">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>

                  <div className="aspect-video w-full bg-black relative">
                    <iframe
                      src={activeVideo.url}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                  <div className="p-6 bg-[#1A1A1A] text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DB3C1D] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DB3C1D]"></span>
                      </span>
                      <h2 className="text-lg font-bold">جاري التشغيل</h2>
                    </div>
                    <p className="text-gray-400 font-light">
                      تم القفز تلقائياً إلى{" "}
                      <span className="text-[#DB3C1D] font-mono dir-ltr inline-block px-1 font-bold">
                        {formatTime(activeVideo.startTime)}
                      </span>{" "}
                      حيث تم ذكر النص.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* About Modal */}
        {showAbout && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setShowAbout(false)}>
            <div
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 p-10 text-center"
              onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setShowAbout(false)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <div className="w-16 h-16 bg-[#DB3C1D]/10 text-[#DB3C1D] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-heart">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#1f1f1f] mb-1">
                  عن المشروع
                </h2>
                <p className="text-sm text-[#777]">من اليمن، بحب</p>
              </div>

              <div
                className="space-y-6 text-lg leading-relaxed text-[#555] font-light"
                dir="rtl">
                <p>
                  "أنا{" "}
                  <span className="font-bold text-[#DB3C1D]">محمد الفهيدي</span>
                  ، مهندس برمجيات من اليمن.
                </p>
                <p>
                  بنيت{" "}
                  <span className="font-semibold text-[#1f1f1f]">لحظة</span> ليس
                  فقط كأداة تقنية، بل كرسالة شكر لثمانية على المحتوى الذي أثرى
                  عقلي.
                </p>
                <p>
                  المشروع يثبت أن الشغف قادر على كسر{" "}
                  <span className="bg-[#DB3C1D]/10 text-[#DB3C1D] px-2 py-0.5 rounded-md text-base">
                    جدران الحماية
                  </span>
                  ، وقيود الميزانية، ومحدودية العتاد."
                </p>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 flex justify-center gap-4">
                <a
                  href="https://twitter.com/mofuhidy"
                  target="_blank"
                  className="text-[#777] hover:text-[#DB3C1D] transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-twitter">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
                <a
                  href="https://github.com/mofuhidy"
                  target="_blank"
                  className="text-[#777] hover:text-[#DB3C1D] transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-github">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/in/mo-fuhidy"
                  target="_blank"
                  className="text-[#777] hover:text-[#DB3C1D] transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-linkedin">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto text-center text-[#777] text-sm font-medium z-10 animate-in fade-in duration-1000 delay-500">
        <p>
          Designed by{" "}
          <a
            href="https://www.linkedin.com/in/mo-fuhidy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#DB3C1D] hover:text-[#A04828] transition-colors decoration-wavy underline-offset-4 hover:underline">
            Fuhidy
          </a>
        </p>
      </footer>
    </main>
  );
}

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
