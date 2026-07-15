/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { MovieInfo, MovieInfoResponse } from "../types";
import { formatReleaseDate, formatNumber } from "../utils";
import {
  Film,
  User,
  Clock,
  Calendar,
  Globe,
  Award,
  Shield,
  Star,
  Loader2,
  ArrowLeft,
  Sparkles,
  Copy,
  Save,
  Trash2,
  BookOpen,
  Check,
  Edit,
  Undo2,
} from "lucide-react";
import Markdown from "react-markdown";

interface MovieDetailProps {
  movieCd: string | null;
  movieNm?: string;
  rank?: string;
  onClose?: () => void;
}

interface SavedReview {
  movieCd: string;
  movieNm: string;
  rating: number;
  briefReview: string;
  tone: string;
  detailedReview: string;
  savedAt: string;
}

export default function MovieDetail({ movieCd, movieNm, rank, onClose }: MovieDetailProps) {
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs: "info" (Details) or "review" (AI Review Maker)
  const [activeTab, setActiveTab] = useState<"info" | "review">("info");

  // Saved review & Review Maker state
  const [savedReview, setSavedReview] = useState<SavedReview | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [briefReview, setBriefReview] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("친근하고 감성적인 리뷰");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedReview, setGeneratedReview] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Fetch Movie Details
  useEffect(() => {
    if (!movieCd) {
      setMovieInfo(null);
      return;
    }

    const fetchMovieDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/movie-info?movieCd=${movieCd}`);
        if (!response.ok) {
          throw new Error("영화 상세 정보를 가져오는 데 실패했습니다.");
        }
        const data: MovieInfoResponse = await response.json();
        if (data.movieInfoResult && data.movieInfoResult.movieInfo) {
          setMovieInfo(data.movieInfoResult.movieInfo);
        } else {
          throw new Error("상세 정보 데이터가 올바르지 않습니다.");
        }
      } catch (err: any) {
        console.error("Error fetching movie info:", err);
        setError(err.message || "상세 정보를 조회하는 도중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetail();
  }, [movieCd]);

  // Load Saved Review for this movie
  useEffect(() => {
    if (!movieCd) {
      setSavedReview(null);
      return;
    }

    const localData = localStorage.getItem("kobis_saved_reviews");
    if (localData) {
      try {
        const reviews: SavedReview[] = JSON.parse(localData);
        const found = reviews.find((r) => r.movieCd === movieCd);
        setSavedReview(found || null);

        // Pre-fill states if found
        if (found) {
          setRating(found.rating);
          setBriefReview(found.briefReview === "영화 정보를 바탕으로 AI 자동 작성" ? "" : found.briefReview);
          setSelectedTone(found.tone);
        } else {
          // Reset form to defaults
          setRating(5);
          setBriefReview("");
          setSelectedTone("친근하고 감성적인 리뷰");
          setGeneratedReview(null);
        }
      } catch (e) {
        console.error("Failed to parse saved reviews", e);
      }
    } else {
      setSavedReview(null);
    }
  }, [movieCd]);

  // Loading message rotator
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  if (!movieCd) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 border border-slate-200/80 rounded-2xl min-h-[400px]">
        <Film className="w-12 h-12 text-slate-300 mb-3 stroke-[1.5]" />
        <p className="text-sm font-semibold text-slate-600 mb-1">선택된 영화가 없습니다</p>
        <p className="text-xs text-slate-400">박스오피스 목록에서 영화를 선택하시면<br />상세 정보와 AI 감상평을 확인하실 수 있습니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 border border-slate-200/80 rounded-2xl min-h-[450px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">영화 정보를 불러오는 중입니다...</p>
        {movieNm && <p className="text-xs text-slate-400 mt-1">"{movieNm}"</p>}
      </div>
    );
  }

  if (error || !movieInfo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-red-50 border border-red-100 rounded-2xl">
        <Award className="w-12 h-12 text-red-300 mb-3 stroke-[1.5]" />
        <p className="text-sm font-semibold text-red-800 mb-1">정보 조회 실패</p>
        <p className="text-xs text-red-600 mb-4">{error || "데이터를 조회할 수 없습니다."}</p>
        <button
          onClick={() => {
            const currentCd = movieCd;
            setMovieInfo(null);
            setTimeout(() => setMovieInfo({ movieCd: currentCd } as any), 10);
          }}
          className="px-3 py-1.5 bg-red-100 text-red-800 hover:bg-red-200 text-xs font-semibold rounded-lg transition"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // Tones configuration
  const tones = [
    { id: "친근하고 감성적인 리뷰", label: "친근 & 감성", desc: "개인적인 느낌과 여운을 다정하고 따뜻하게 서술합니다." },
    { id: "정밀하고 학술적인 평론", label: "정밀 & 평론", desc: "영화의 작품성, 연출, 서사 구조를 학술적으로 날카롭게 분석합니다." },
    { id: "스포일러 방지 간단평", label: "스포일러 방지", desc: "핵심 매력과 연출만 짚어내어 영화를 보지 않은 분들께 선물합니다." },
    { id: "위트 있고 솔직한 한줄평 확장", label: "위트 & 솔직", desc: "솔직하면서도 트렌디하고 유머러스하게 한줄평을 극대화합니다." },
  ];

  const loadingMessages = [
    "영화진흥위원회 KOBIS 데이터를 분석하는 중...",
    "고품격 전문 평론가 AI가 펜을 드는 중...",
    "영화의 감동과 맥락을 가장 아름답게 표현할 단어 선별 중...",
    "논조에 알맞은 멋진 마크다운 서평을 집필하고 있습니다..."
  ];

  // Helper to extract watch grade
  const watchGrade = movieInfo.audits?.[0]?.watchGradeNm || "등급 정보 없음";
  const getGradeColor = (grade: string) => {
    if (grade.includes("전체")) return "bg-green-50 text-green-700 border-green-200";
    if (grade.includes("12세")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (grade.includes("15세")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (grade.includes("청소년")) return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  // Generate Review Callback
  const handleGenerateReview = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedReview(null);

    const directorsStr = movieInfo.directors.map(d => d.peopleNm).join(", ");
    const genresStr = movieInfo.genres.map(g => g.genreNm).join(", ");
    const actorsStr = movieInfo.actors.slice(0, 5).map(a => a.peopleNm).join(", ");

    try {
      const response = await fetch("/api/generate-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieNm: movieInfo.movieNm,
          directors: directorsStr,
          genres: genresStr,
          actors: actorsStr,
          rating,
          briefReview,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        throw new Error("AI 서평 작성 도중 서버 에러가 발생했습니다.");
      }

      const data = await response.json();
      if (data.review) {
        setGeneratedReview(data.review);
      } else {
        throw new Error("서평 생성 결과가 유효하지 않습니다.");
      }
    } catch (err: any) {
      console.error("Failed to generate review:", err);
      setGenerationError(err.message || "서평을 생성하는 과정에서 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save detailed review to local library
  const handleSaveReview = (reviewText: string) => {
    const newReview: SavedReview = {
      movieCd: movieInfo.movieCd,
      movieNm: movieInfo.movieNm,
      rating,
      briefReview: briefReview.trim() || "영화 정보를 바탕으로 AI 자동 작성",
      tone: selectedTone,
      detailedReview: reviewText,
      savedAt: new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const localData = localStorage.getItem("kobis_saved_reviews");
    let reviews: SavedReview[] = [];
    if (localData) {
      try {
        reviews = JSON.parse(localData);
      } catch (e) {
        reviews = [];
      }
    }

    reviews = reviews.filter((r) => r.movieCd !== movieInfo.movieCd);
    reviews.unshift(newReview);

    localStorage.setItem("kobis_saved_reviews", JSON.stringify(reviews));
    setSavedReview(newReview);
    setGeneratedReview(null);
  };

  // Delete saved review from local library
  const handleDeleteReview = () => {
    const localData = localStorage.getItem("kobis_saved_reviews");
    if (localData) {
      try {
        let reviews: SavedReview[] = JSON.parse(localData);
        reviews = reviews.filter((r) => r.movieCd !== movieCd);
        localStorage.setItem("kobis_saved_reviews", JSON.stringify(reviews));
        setSavedReview(null);
        // Reset states
        setBriefReview("");
        setRating(5);
        setGeneratedReview(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Custom component styles for react-markdown
  const markdownRenderers = {
    h1: ({ children }: any) => (
      <h1 className="text-sm font-black text-slate-900 border-b border-indigo-100 pb-1.5 mb-3 mt-4 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-xs font-black text-slate-800 mb-2 mt-4">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xs font-bold text-slate-700 mb-1.5 mt-3">{children}</h3>
    ),
    p: ({ children }: any) => (
      <p className="text-[11px] text-slate-600 leading-relaxed mb-3 text-justify">{children}</p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc pl-4 mb-3 space-y-1 text-[11px] text-slate-600">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-4 mb-3 space-y-1 text-[11px] text-slate-600">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="text-[11px] text-slate-600">{children}</li>
    ),
    strong: ({ children }: any) => (
      <strong className="font-extrabold text-slate-950 bg-indigo-50/50 px-1 rounded">{children}</strong>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-indigo-500 pl-3 italic my-3 text-slate-500 text-[11px] bg-slate-50/80 py-1.5 rounded-r">
        {children}
      </blockquote>
    ),
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header Banner */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition md:hidden"
            aria-label="닫기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {rank && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide mb-3">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            박스오피스 {rank}위
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight mb-1 text-white">
          {movieInfo.movieNm}
        </h2>
        {movieInfo.movieNmEn && (
          <p className="text-xs text-slate-300 font-mono italic mb-2">
            {movieInfo.movieNmEn}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <span className={`px-2.5 py-0.5 text-[11px] font-bold border rounded-md ${getGradeColor(watchGrade)}`}>
            {watchGrade}
          </span>
          {movieInfo.genres.map((g, i) => (
            <span key={i} className="px-2.5 py-0.5 text-[11px] font-medium bg-white/10 border border-white/15 rounded-md text-slate-200">
              {g.genreNm}
            </span>
          ))}
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="flex border-b border-slate-150 bg-slate-50/50 p-1">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
            activeTab === "info"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          영화 상세 정보
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
            activeTab === "review"
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/50"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          AI 감상평 메이커
          {savedReview && (
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Main Container Switch */}
      {activeTab === "info" ? (
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6 max-h-[500px] md:max-h-[700px] scrollbar-thin scrollbar-thumb-slate-200">
          {/* Core Specs Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Clock className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">상영 시간</span>
                <span className="text-xs font-bold text-slate-700">{movieInfo.showTm ? `${movieInfo.showTm}분` : "정보 없음"}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Calendar className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">개봉일</span>
                <span className="text-xs font-bold text-slate-700">{formatReleaseDate(movieInfo.openDt)}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Globe className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">제작 국가</span>
                <span className="text-xs font-bold text-slate-700">
                  {movieInfo.nations?.[0]?.nationNm || "정보 없음"}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Shield className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">제작 연도 / 상태</span>
                <span className="text-xs font-bold text-slate-700">{movieInfo.prdtYear}년 ({movieInfo.prdtStatNm || "불명"})</span>
              </div>
            </div>
          </div>

          {/* Directors */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              감독
            </h3>
            <div className="flex flex-wrap gap-2">
              {movieInfo.directors.length > 0 ? (
                movieInfo.directors.map((dir, idx) => (
                  <div key={idx} className="px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/50 rounded-xl text-xs text-slate-700 font-semibold transition">
                    {dir.peopleNm}
                    {dir.peopleNmEn && (
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{dir.peopleNmEn}</span>
                    )}
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">등록된 감독 정보가 없습니다.</span>
              )}
            </div>
          </div>

          {/* Actors */}
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              출연 배우
            </h3>
            {movieInfo.actors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {movieInfo.actors.slice(0, 10).map((act, idx) => (
                  <div key={idx} className="flex flex-col p-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-xs font-bold text-slate-800">{act.peopleNm}</span>
                    {act.cast ? (
                      <span className="text-[10px] text-indigo-600 font-medium mt-0.5">역할: {act.cast}</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic mt-0.5">배우</span>
                    )}
                  </div>
                ))}
                {movieInfo.actors.length > 10 && (
                  <div className="col-span-full text-center text-[11px] text-slate-400 py-1 font-medium bg-slate-50 rounded-lg">
                    외 {movieInfo.actors.length - 10}명의 배우가 더 출연했습니다.
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">등록된 출연 배우 정보가 없습니다.</p>
            )}
          </div>

          {/* Companys */}
          {movieInfo.companys && movieInfo.companys.length > 0 && (
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-slate-500" />
                참여 영화사
              </h3>
              <div className="space-y-1.5">
                {movieInfo.companys.slice(0, 3).map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-50/50 border border-slate-100 rounded-lg text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">{comp.companyNm}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                      {comp.companyPartNm || "기타"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ==================== TAB 2: AI REVIEW MAKER ==================== */
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5 max-h-[500px] md:max-h-[700px] scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* A. If review is already saved in local storage */}
          {savedReview ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/40 border border-indigo-100/80 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    내 서재에 보관된 감상평
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">{savedReview.savedAt}</span>
                </div>

                {/* Rating & Tone description */}
                <div className="flex items-center justify-between border-b border-indigo-100/30 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${
                          idx < savedReview.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {savedReview.tone}
                  </span>
                </div>

                {/* Short Brief Review text */}
                <div className="mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">내가 남긴 한줄평</span>
                  <p className="text-xs text-slate-700 font-semibold italic bg-white/60 p-2.5 rounded-lg border border-slate-100">
                    "{savedReview.briefReview}"
                  </p>
                </div>
              </div>

              {/* Detailed Review Box */}
              <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 shadow-inner relative max-h-[350px] overflow-y-auto">
                <div className="markdown-body text-slate-700">
                  <Markdown components={markdownRenderers}>
                    {savedReview.detailedReview}
                  </Markdown>
                </div>
              </div>

              {/* Saved actions footer */}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={() => handleCopyToClipboard(savedReview.detailedReview)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      클립보드 복사
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    // Temporarily hide saved review to allow editing
                    setGeneratedReview(savedReview.detailedReview);
                    setSavedReview(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition border border-indigo-100"
                >
                  <Edit className="w-3.5 h-3.5" />
                  감상평 재작성
                </button>

                <button
                  onClick={handleDeleteReview}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-100"
                  title="감상평 완전히 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : isGenerating ? (
            /* B. Loading Spinner for generation */
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <Sparkles className="w-6 h-6 text-amber-500 fill-amber-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-2">영화 평론 AI 서평 저술 중</h4>
              <p className="text-xs text-indigo-600 font-semibold animate-pulse px-6 leading-relaxed max-w-sm">
                {loadingMessages[loadingStep]}
              </p>
            </div>
          ) : generatedReview ? (
            /* C. Previewing just-generated review before saving */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black text-indigo-600 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                  AI가 작성한 고품격 상세 감상평
                </span>
                <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">미저장</span>
              </div>

              {/* Render Review block */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white/80 shadow-sm relative max-h-[350px] overflow-y-auto">
                <div className="markdown-body text-slate-700">
                  <Markdown components={markdownRenderers}>
                    {generatedReview}
                  </Markdown>
                </div>
              </div>

              {/* Actions footer for pending save */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyToClipboard(generatedReview)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200/50"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">복사 완료!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        클립보드 복사
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSaveReview(generatedReview)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-indigo-100"
                  >
                    <Save className="w-3.5 h-3.5" />
                    내 서재에 저장
                  </button>
                </div>

                <button
                  onClick={() => {
                    setGeneratedReview(null);
                  }}
                  className="w-full flex items-center justify-center gap-1 py-1.5 text-slate-400 hover:text-slate-600 text-[11px] font-semibold transition"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  뒤로가기 (편집 화면으로 돌아가기)
                </button>
              </div>
            </div>
          ) : (
            /* D. Form input to generate a new review */
            <div className="space-y-5">
              
              {/* Introduction Banner */}
              <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-amber-50/50 border border-indigo-100/30 rounded-xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 fill-indigo-200/50" />
                <p className="text-[11px] text-slate-600 leading-normal">
                  영화에 대한 나만의 간단한 생각(한줄평)과 별점을 선택해주세요. 
                  <strong>Gemini AI</strong>가 영화 공식 메타데이터와 결합하여 고품격 영화 서평을 저술해 드립니다.
                </p>
              </div>

              {/* 1. Star Rating Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">내가 준 평점</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 active:scale-95 transition focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Style/Tone Select */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 block">서평 스타일 논조</label>
                <div className="grid grid-cols-2 gap-2">
                  {tones.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedTone(tone.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                        selectedTone === tone.id
                          ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span className="block text-xs font-extrabold text-slate-800 mb-0.5">{tone.label}</span>
                      <span className="block text-[9px] text-slate-400 leading-normal font-medium">{tone.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Brief Custom Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-700 block">간단한 감상평 (선택사항)</label>
                  <span className="text-[10px] text-slate-400">비워두면 AI가 정보 기반 자동 서술</span>
                </div>
                <textarea
                  value={briefReview}
                  onChange={(e) => setBriefReview(e.target.value)}
                  placeholder="예: 영상미가 무척 아름다웠고 배우들의 섬세한 심리 묘사가 정말 좋았습니다."
                  maxLength={150}
                  rows={3}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-300 resize-none"
                />
                <div className="text-right text-[9px] text-slate-400 font-medium">
                  {briefReview.length} / 150자
                </div>
              </div>

              {/* Generation Error Display */}
              {generationError && (
                <p className="text-[10px] font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-center gap-1.5">
                  <span className="block w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                  {generationError}
                </p>
              )}

              {/* Submit Action */}
              <button
                onClick={handleGenerateReview}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
              >
                <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300 animate-bounce" />
                AI 감상평 생성하기
              </button>
            </div>
          )}

        </div>
      )}

      {/* Footer Info */}
      <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 mt-auto">
        <span>자료 제공: 영화진흥위원회 KOBIS</span>
        <span>코드: {movieInfo.movieCd}</span>
      </div>
    </div>
  );
}
