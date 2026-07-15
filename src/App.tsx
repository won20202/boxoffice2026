/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { DailyBoxOfficeItem, BoxOfficeResponse } from "./types";
import {
  formatNumber,
  formatKoreanDate,
  getYesterdayDateString,
  apiDateParam,
  formatCurrency,
} from "./utils";
import BoxOfficeChart from "./components/BoxOfficeChart";
import MovieDetail from "./components/MovieDetail";
import {
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Film,
  Sparkles,
  AlertCircle,
  Clock,
  RotateCcw,
  Users,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const yesterday = getYesterdayDateString();

  // State Management
  const [selectedDate, setSelectedDate] = useState<string>(yesterday);
  const [boxOfficeList, setBoxOfficeList] = useState<DailyBoxOfficeItem[]>([]);
  const [selectedMovieCd, setSelectedMovieCd] = useState<string | null>(null);
  const [selectedMovieNm, setSelectedMovieNm] = useState<string>("");
  const [selectedMovieRank, setSelectedMovieRank] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState<boolean>(false);

  // Fetch Box Office Data
  useEffect(() => {
    const fetchBoxOffice = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const formattedDate = apiDateParam(selectedDate);
        const response = await fetch(`/api/boxoffice?date=${formattedDate}`);
        if (!response.ok) {
          throw new Error("박스오피스 데이터를 가져오는 데 실패했습니다.");
        }
        
        const data: BoxOfficeResponse = await response.json();
        const list = data.boxOfficeResult?.dailyBoxOfficeList || [];
        
        setBoxOfficeList(list);

        // Auto-select the first movie in the list if present
        if (list.length > 0) {
          setSelectedMovieCd(list[0].movieCd);
          setSelectedMovieNm(list[0].movieNm);
          setSelectedMovieRank(list[0].rank);
        } else {
          setSelectedMovieCd(null);
          setSelectedMovieNm("");
          setSelectedMovieRank("");
        }
      } catch (err: any) {
        console.error("Error fetching box office:", err);
        setError(err.message || "데이터 조회 도중 문제가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoxOffice();
  }, [selectedDate]);

  // Handle Quick Date Jumps
  const handleQuickJump = (daysAgo: number, type: "days" | "months" | "years") => {
    const date = new Date();
    if (type === "days") {
      date.setDate(date.getDate() - daysAgo);
    } else if (type === "months") {
      date.setMonth(date.getMonth() - daysAgo);
    } else if (type === "years") {
      date.setFullYear(date.getFullYear() - daysAgo);
    }

    // Limit to max yesterday
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 1);
    
    if (date > limitDate) {
      setSelectedDate(yesterday);
      return;
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  // Filter Box Office List by search query
  const filteredList = boxOfficeList.filter((movie) =>
    movie.movieNm.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMovie = (movie: DailyBoxOfficeItem) => {
    setSelectedMovieCd(movie.movieCd);
    setSelectedMovieNm(movie.movieNm);
    setSelectedMovieRank(movie.rank);
    setIsMobileDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 py-3.5 md:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white p-2.5 rounded-xl shadow-md shadow-indigo-100">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">
                  KOBIS 일일 박스오피스
                </h1>
                <span className="hidden xs:inline px-2 py-0.5 rounded bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">영화진흥위원회 공식 OpenAPI 연동 서비스</p>
            </div>
          </div>

          {/* Date Selector & Reset */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex items-center bg-slate-100/80 border border-slate-200 hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 rounded-xl px-3 py-1.5 transition-all duration-200">
              <Calendar className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
              <input
                id="box-office-date-picker"
                type="date"
                value={selectedDate}
                max={yesterday}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={() => setSelectedDate(yesterday)}
              disabled={selectedDate === yesterday}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/30 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-200 disabled:hover:text-slate-600 transition"
              title="어제 날짜로 리셋"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        
        {/* Quick Jump Dates Panel */}
        <div className="mb-6 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-slate-600">선택된 상영일:</span>
            <span className="text-sm font-black text-indigo-600 tracking-tight">
              {formatKoreanDate(apiDateParam(selectedDate))}
            </span>
          </div>

          {/* Jump Buttons */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickJump(1, "days")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedDate === yesterday
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              어제
            </button>
            <button
              onClick={() => handleQuickJump(7, "days")}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              1주일 전
            </button>
            <button
              onClick={() => handleQuickJump(1, "months")}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              1개월 전
            </button>
            <button
              onClick={() => handleQuickJump(1, "years")}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              1년 전
            </button>
          </div>
        </div>

        {/* Dashboard Grid split into Left (List, Chart) and Right (Detail) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Box Office List & Chart (8 cols) */}
          <section className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Box Office Card Wrapper */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              
              {/* Card Header & Search */}
              <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-800">박스오피스 TOP 10 순위</h2>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="영화 이름 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-white border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl transition-all"
                  />
                </div>
              </div>

              {/* Status and Lists */}
              <div className="p-4 md:p-5">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs font-semibold text-slate-500">KOBIS 데이터를 안전하게 수신하고 있습니다...</p>
                  </div>
                ) : error ? (
                  <div className="py-12 px-4 flex flex-col items-center text-center">
                    <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
                    <p className="text-sm font-bold text-red-800 mb-1">데이터 호출에 실패했습니다</p>
                    <p className="text-xs text-red-500 mb-4">{error}</p>
                    <button
                      onClick={() => setSelectedDate(selectedDate)} // Force refresh
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl transition"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="py-16 text-center text-slate-400">
                    <Search className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold">검색 조건과 일치하는 영화가 없습니다.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto scrollbar-thin">
                    {filteredList.map((movie) => {
                      const isSelected = movie.movieCd === selectedMovieCd;
                      const rankInten = parseInt(movie.rankInten, 10);
                      const isNew = movie.rankOldAndNew === "NEW";

                      return (
                        <div
                          key={movie.movieCd}
                          id={`movie-item-${movie.movieCd}`}
                          onClick={() => handleSelectMovie(movie)}
                          className={`group flex items-center p-3 md:p-4 rounded-xl cursor-pointer transition-all duration-200 mb-1 last:mb-0 ${
                            isSelected
                              ? "bg-indigo-50/50 border border-indigo-100 shadow-sm"
                              : "hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          {/* Rank Number */}
                          <div className="flex flex-col items-center justify-center w-12 mr-2">
                            <span className={`text-base md:text-lg font-black tracking-tight ${
                              movie.rank === "1" ? "text-amber-500" :
                              movie.rank === "2" ? "text-slate-400" :
                              movie.rank === "3" ? "text-amber-700" : "text-slate-500"
                            }`}>
                              {movie.rank}
                            </span>
                            
                            {/* Rank Change Indicator */}
                            <div className="flex items-center text-[10px] mt-0.5">
                              {isNew ? (
                                <span className="px-1 text-[9px] font-black text-emerald-600 bg-emerald-50 rounded border border-emerald-100 leading-none py-0.5 scale-90">NEW</span>
                              ) : rankInten > 0 ? (
                                <span className="flex items-center text-emerald-500 font-bold">
                                  <TrendingUp className="w-3 h-3 mr-0.5" />
                                  {rankInten}
                                </span>
                              ) : rankInten < 0 ? (
                                <span className="flex items-center text-red-500 font-bold">
                                  <TrendingDown className="w-3 h-3 mr-0.5" />
                                  {Math.abs(rankInten)}
                                </span>
                              ) : (
                                <span className="flex items-center text-slate-400 font-medium">
                                  <Minus className="w-3 h-3 mr-0.5" />
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Movie Content */}
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <h3 className={`text-sm font-bold truncate ${
                                isSelected ? "text-indigo-950 font-black" : "text-slate-800"
                              }`}>
                                {movie.movieNm}
                              </h3>
                              {isNew && (
                                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              )}
                            </div>

                            {/* Additional Stats Row */}
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                당일 {formatNumber(movie.audiCnt)}명
                              </span>
                              <span className="text-slate-300">|</span>
                              <span>누적 {formatNumber(movie.audiAcc)}명</span>
                              <span className="text-slate-300">|</span>
                              <span className="text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">
                                매출점유율 {movie.salesShare}%
                              </span>
                            </div>

                            {/* Sales share micro progress bar */}
                            <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isSelected ? "bg-indigo-500" : "bg-slate-300"
                                }`}
                                style={{ width: `${movie.salesShare}%` }}
                              />
                            </div>
                          </div>

                          {/* Side arrow indicators */}
                          <div className="text-slate-300 group-hover:text-slate-500 transition-colors ml-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recharts Analytics Panel */}
            {!isLoading && filteredList.length > 0 && (
              <BoxOfficeChart
                data={filteredList}
                onSelectMovie={(movieCd) => {
                  const target = boxOfficeList.find((m) => m.movieCd === movieCd);
                  if (target) {
                    setSelectedMovieCd(target.movieCd);
                    setSelectedMovieNm(target.movieNm);
                    setSelectedMovieRank(target.rank);
                    setIsMobileDetailOpen(true);
                  }
                }}
                selectedMovieCd={selectedMovieCd}
              />
            )}
          </section>

          {/* RIGHT: Detailed Movie Panel (4 cols) */}
          {/* Desktop Panel */}
          <section className="hidden lg:block lg:col-span-5 xl:col-span-4 h-fit sticky top-24">
            <MovieDetail
              movieCd={selectedMovieCd}
              movieNm={selectedMovieNm}
              rank={selectedMovieRank}
            />
          </section>
        </div>
      </main>

      {/* Mobile Drawer Detail Sheet */}
      <AnimatePresence>
        {isMobileDetailOpen && selectedMovieCd && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            {/* Backdrop Dismiss Button */}
            <div className="absolute inset-0 -z-10" onClick={() => setIsMobileDetailOpen(false)} />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Drag Handle */}
              <div className="w-full flex justify-center py-3 border-b border-slate-100 bg-slate-50/80">
                <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
              </div>

              {/* Movie Detail content */}
              <div className="overflow-y-auto flex-1">
                <MovieDetail
                  movieCd={selectedMovieCd}
                  movieNm={selectedMovieNm}
                  rank={selectedMovieRank}
                  onClose={() => setIsMobileDetailOpen(false)}
                />
              </div>

              {/* Close footer for mobile convenience */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                <button
                  onClick={() => setIsMobileDetailOpen(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-md shadow-slate-100"
                >
                  상세 화면 닫기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom styled footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 mt-16 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="text-xs font-medium">KOBIS 일일 박스오피스 대시보드</p>
          <p className="text-[10px] text-slate-500">본 사이트는 영화진흥위원회에서 제공하는 오픈 API 정보를 기반으로 제작되었습니다.</p>
          <p className="text-[9px] text-slate-600 font-mono mt-4">© 2026 Korean Film Council API Dashboard Project. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
