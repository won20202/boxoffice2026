/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { DailyBoxOfficeItem } from "../types";
import { formatNumber } from "../utils";

interface BoxOfficeChartProps {
  data: DailyBoxOfficeItem[];
  onSelectMovie: (movieCd: string) => void;
  selectedMovieCd: string | null;
}

export default function BoxOfficeChart({
  data,
  onSelectMovie,
  selectedMovieCd,
}: BoxOfficeChartProps) {
  // Map and parse numbers for Recharts
  const chartData = [...data]
    .reverse() // Reverse so the #1 movie is at the top of a vertical bar chart
    .map((item) => ({
      movieCd: item.movieCd,
      name: item.movieNm.length > 12 ? `${item.movieNm.substring(0, 11)}...` : item.movieNm,
      fullName: item.movieNm,
      audience: parseInt(item.audiCnt, 10) || 0,
      share: parseFloat(item.salesShare) || 0,
      rank: item.rank,
    }));

  const COLORS = [
    "#F59E0B", // Golden for #1
    "#3B82F6", // Blue for others
    "#10B981", // Green
    "#EC4899", // Pink
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#6366F1", // Indigo
    "#14B8A6", // Teal
    "#F43F5E", // Rose
    "#64748B", // Slate
  ];

  const getColorForRank = (rankStr: string, movieCd: string) => {
    if (movieCd === selectedMovieCd) {
      return "#3B82F6"; // Selected highlight color
    }
    const rank = parseInt(rankStr, 10);
    if (rank === 1) return "#F59E0B"; // Gold for #1
    if (rank === 2) return "#94A3B8"; // Silver for #2
    if (rank === 3) return "#B45309"; // Bronze for #3
    return "#CBD5E1"; // Subtle grey for rest
  };

  const getHoverColor = (rankStr: string) => {
    const rank = parseInt(rankStr, 10);
    if (rank === 1) return "#D97706";
    return "#1D4ED8";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs text-slate-100 font-sans">
          <p className="font-bold mb-1 text-white">{dataPoint.fullName}</p>
          <p className="text-amber-400">순위: {dataPoint.rank}위</p>
          <p>관객수: <span className="font-semibold text-sky-400">{formatNumber(dataPoint.audience)}명</span></p>
          <p>매출점유율: <span className="font-semibold text-emerald-400">{dataPoint.share}%</span></p>
        </div>
      );
    }
    return null;
  };

  const handleClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const movieCd = state.activePayload[0].payload.movieCd;
      onSelectMovie(movieCd);
    }
  };

  return (
    <div className="w-full h-80 min-h-[320px] bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-sm font-bold text-slate-800">영화별 당일 관객수 비교 (명)</h3>
        <p className="text-xs text-slate-500">막대를 클릭하여 상세 정보를 확인할 수 있습니다.</p>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            onClick={handleClick}
          >
            <XAxis type="number" tickFormatter={(v) => v >= 10000 ? `${(v/10000).toFixed(0)}만` : v} fontSize={10} stroke="#64748b" />
            <YAxis
              dataKey="name"
              type="category"
              fontSize={10}
              width={75}
              stroke="#64748b"
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
            <Bar dataKey="audience" cursor="pointer" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColorForRank(entry.rank, entry.movieCd)}
                  className="transition-all duration-200 hover:opacity-85"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-end gap-3 mt-1 text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" />
          <span>1위</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm" />
          <span>2위</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-amber-700 rounded-sm" />
          <span>3위</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-slate-300 rounded-sm" />
          <span>4위 이하</span>
        </div>
      </div>
    </div>
  );
}
