"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Play, ArrowLeft } from "lucide-react";
import { SearchResult } from "@/types";
import Image from "next/image";

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setError(null);
    setHasSearched(true);
    setActiveVideo(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
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
    <main className="min-h-screen bg-[oklch(0.92_0.02_95)] text-[#1f1f1f] flex flex-col items-center selection:bg-[#C05838]/20 font-sans relative overflow-x-hidden">
      {/* Navbar Minimal Placeholder */}
      <nav className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center z-10">
        <div className="relative w-28 h-24 hover:opacity-90 transition-opacity cursor-pointer">
          <Image
            src="/logo.png"
            alt="Lahza Logo"
            fill
            className="object-contain object-right"
            priority
          />
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-[#C05838]">
          <a href="#" className="hover:opacity-80 transition-opacity">
            عن الشركة
          </a>
          <a href="#" className="hover:opacity-80 transition-opacity">
            تواصل معنا
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <div
        className={`w-full max-w-4xl px-6 transition-all duration-700 ease-out z-10 ${results.length > 0 || activeVideo ? "mt-8 mb-12" : "mt-[25vh]"}`}>
        <div
          className={`text-center mb-10 duration-700 transition-all flex flex-col items-center ${results.length > 0 || activeVideo ? "scale-90" : "scale-100"}`}>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-6 text-black font-sans">
            لحظة{" "}
            <span className="text-[#C05838] font-light text-5xl md:text-7xl">
              | Lahza
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#555] font-light max-w-2xl mx-auto leading-relaxed -mt-4">
            لا تبحث عن الحلقة.. ابحث عن الفكرة
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative w-full max-w-3xl mx-auto">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-[#C05838]/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-white rounded-full border border-[#E5E5E5] shadow-sm hover:border-[#C05838]/50 hover:shadow-md focus-within:border-[#C05838] focus-within:ring-4 focus-within:ring-[#C05838]/5 transition-all duration-300 h-16">
              <div className="flex items-center justify-center w-14 h-full pointer-events-none">
                <Search className="text-[#C05838] w-6 h-6 opacity-70" />
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
                  className="h-12 w-12 rounded-full bg-white hover:bg-[#FAF9F6] text-[#C05838] border border-transparent hover:border-[#E5E5E5] transition-all ml-2"
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
            <div
              className={`space-y-6 ${activeVideo ? "lg:col-span-4" : "lg:col-span-8 lg:col-start-3"}`}>
              <div className="flex items-center justify-between px-2 pb-2 border-b border-black/5">
                <h3 className="text-lg font-bold text-black flex items-center gap-2">
                  نتائج البحث
                  <span className="bg-[#C05838]/10 text-xs px-2 py-0.5 rounded-full font-mono text-[#C05838]">
                    {results.length}
                  </span>
                </h3>
              </div>

              <ScrollArea
                className={`${activeVideo ? "h-[calc(100vh-200px)]" : "h-auto"} pr-4 -mr-4`}>
                <div className="space-y-4 pb-8 pl-2">
                  {results.map(result => (
                    <Card
                      key={result.id}
                      className="bg-white border border-[#E5E5E5] hover:border-[#C05838]/50 hover:shadow-lg transition-all cursor-pointer group overflow-hidden rounded-xl"
                      onClick={() =>
                        playVideo(result.episode_url, result.start_time)
                      }>
                      <CardContent className="p-0 flex flex-col md:flex-row">
                        {/* Thumbnail */}
                        {result.thumbnail_url && (
                          <div className="relative w-full md:w-48 aspect-video md:aspect-[4/3] shrink-0 overflow-hidden bg-gray-100">
                            <Image
                              src={result.thumbnail_url}
                              alt={result.episode_title}
                              fill
                              className="object-cover opacity-95 group-hover:scale-105 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1.5 font-medium">
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>{formatTime(result.start_time)}</span>
                            </div>
                          </div>
                        )}

                        {/* Text Content */}
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-[#1f1f1f] line-clamp-1 text-lg group-hover:text-[#C05838] transition-colors mb-2">
                              {result.episode_title}
                            </h3>
                            <p
                              className="text-[#555] text-sm leading-relaxed line-clamp-2 md:line-clamp-3 font-normal"
                              dir="rtl">
                              {result.content}
                            </p>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className="bg-[#FAF9F6] text-[#777] border border-[#E5E5E5] group-hover:border-[#C05838]/30 group-hover:text-[#C05838] transition-colors text-[10px] px-2 font-mono">
                              {(result.similarity * 100).toFixed(0)}% تطابق
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Video Player Column */}
            {activeVideo && (
              <div className="lg:col-span-8 animate-in fade-in slide-in-from-left-4 duration-500 sticky top-8 self-start">
                <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E5E5] shadow-2xl">
                  <div className="aspect-video w-full bg-black relative">
                    <iframe
                      src={activeVideo.url} // Now using standard iframe for guaranteed compatibility
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                  <div className="p-6 bg-[#FAF9F6]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C05838] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C05838]"></span>
                      </span>
                      <h2 className="text-lg font-bold text-[#1f1f1f]">
                        جاري التشغيل
                      </h2>
                    </div>
                    <p className="text-[#555] font-light">
                      تم القفز تلقائياً إلى{" "}
                      <span className="text-[#C05838] font-mono dir-ltr inline-block px-1 font-bold">
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
      </div>
      {/* Footer */}
      <footer className="w-full py-8 mt-auto text-center text-[#777] text-sm font-medium z-10 animate-in fade-in duration-1000 delay-500">
        <p>
          Designed by{" "}
          <a
            href="https://www.linkedin.com/in/mo-fuhidy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C05838] hover:text-[#A04828] transition-colors decoration-wavy underline-offset-4 hover:underline">
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
