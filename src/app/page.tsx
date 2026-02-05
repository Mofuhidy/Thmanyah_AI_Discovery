"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, Play } from "lucide-react";
import { SearchResult } from "@/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
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
    setActiveVideo(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch (error) {
      console.error("Search failed", error);
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white flex flex-col items-center">
      {/* Hero Section */}
      <div
        className={`w-full max-w-4xl px-6 transition-all duration-700 ease-in-out ${results.length > 0 || activeVideo ? "mt-10" : "mt-[30vh]"}`}>
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 tracking-tight font-sans mb-4">
            Thamanya AI
          </h1>
          <p className="text-lg text-slate-300">
            Semantic Search for Podcast Archives
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="relative w-full max-w-2xl mx-auto mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
              <Search className="ml-4 text-slate-400 w-6 h-6" />
              <Input
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-xl py-8 pl-4 pr-12 text-white placeholder:text-slate-500"
                placeholder="ابحث عن لحظة محددة..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                dir="rtl"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute left-2 h-10 w-10 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-lg transition-transform hover:scale-105 active:scale-95"
                disabled={loading}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Content Area */}
      {(results.length > 0 || activeVideo) && (
        <div className="w-full max-w-6xl px-4 pb-20 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
          {/* Results List */}
          <div
            className={`lg:col-span-1 space-y-4 ${activeVideo ? "" : "lg:col-span-3 max-w-3xl mx-auto w-full"}`}>
            <h3 className="text-xl font-semibold text-slate-200 mb-4 px-2">
              نتائج البحث ({results.length})
            </h3>
            <ScrollArea
              className={`${activeVideo ? "h-[600px]" : "h-auto"} pr-4`}>
              <div className="space-y-4 pb-4">
                {results.map(result => (
                  <Card
                    key={result.id}
                    className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-teal-500/50 transition-all cursor-pointer group"
                    onClick={() =>
                      playVideo(result.episode_url, result.start_time)
                    }>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className="text-teal-400 border-teal-400/30 text-xs">
                          {formatTime(result.start_time)}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="bg-slate-700 text-slate-300 text-[10px]">
                          {(result.similarity * 100).toFixed(0)}% تطابق
                        </Badge>
                      </div>
                      <p
                        className="text-slate-200 text-sm leading-relaxed mb-3 line-clamp-3 group-hover:text-teal-50 transition-colors"
                        dir="rtl">
                        {result.content}
                      </p>
                      <div className="flex items-center text-xs text-slate-400">
                        <Play className="w-3 h-3 ml-1 fill-current" />
                        <span className="truncate max-w-[200px]">
                          {result.episode_title}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Video Player */}
          {activeVideo && (
            <div className="lg:col-span-2 animate-in fade-in zoom-in duration-500">
              <div className="sticky top-6">
                <Card className="bg-black border-slate-700 overflow-hidden shadow-2xl aspect-video rounded-xl">
                  <iframe
                    src={activeVideo.url}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full"></iframe>
                </Card>
                <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <h2 className="text-lg font-medium text-teal-400">
                    جاري التشغيل
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    تم الانتقال إلى الثانية {Math.floor(activeVideo.startTime)}{" "}
                    بناءً على سياق البحث.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
