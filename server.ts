import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "3a3816b17943accb6ecdf9f052335842";

// Initialize Gemini client using process.env.GEMINI_API_KEY with headers for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // API Route: Generate Detailed Movie Review using Gemini AI
  app.post("/api/generate-review", async (req, res) => {
    try {
      const { movieNm, directors, genres, actors, rating, briefReview, tone } = req.body;

      if (!movieNm) {
        return res.status(400).json({ error: "movieNm parameter is required" });
      }

      const prompt = `
당신은 대한민국 대표 영화 평론가이자 유려한 문장력을 갖춘 전문 작가입니다. 
다음 영화 정보와 사용자가 입력한 짧은 감상평(한줄평)을 바탕으로, 지정된 논조(Tone/Style)에 어울리는 완성도 높은 상세 감상평(영화 리뷰)을 작성해주세요.

[영화 정보]
- 제목: ${movieNm}
- 감독: ${directors || "정보 없음"}
- 장르: ${genres || "정보 없음"}
- 주요 배우: ${actors || "정보 없음"}
- 사용자가 준 평점: ${rating ? `${rating} / 5` : "평점 없음"}

[사용자 입력 간단 감상평]
"${briefReview || "매우 인상 깊고 재미있게 감상한 작품"}"

[요청된 감상평 스타일 (Tone)]
- 스타일: ${tone || "일반적인 균형 잡힌 리뷰"}

[리뷰 작성 지침]
1. 제목: 리뷰를 상징하는 개성 있고 깊이 있는 헤드라인을 맨 첫 줄에 적어주세요. (예: '# [헤드라인]')
2. 본문 구성:
   - 영화의 장르적 특징과 감독/배우들의 앙상블을 가볍게 언급하며 글을 엽니다.
   - 사용자가 작성한 간단 감상평의 포인트를 논리적으로 분석 및 확장하여 설명해 줍니다. 
   - 지정된 스타일에 극도로 어울리는 말투와 필체를 유지해 주세요 (예: "정밀한 학술적 평론"이라면 학구적이고 분석적인 문체, "친근하고 재미있는 후기"라면 블로그 형식의 대화체 등).
3. 마크다운(Markdown)을 사용해 문단 구분, 강조, 리스트 등을 보기 좋게 서식화해 주세요.
4. 마지막은 영화에 대한 한 줄 요약 혹은 추천 대상(누가 보면 좋을지)을 정리하는 것으로 마무리합니다.
5. 영화 정보에 없는 허위 스포일러나 왜곡된 스토리는 자제하고, 사용자 감상평을 세련되고 풍부한 어휘로 다듬는 데 집중하세요.

답변은 한글로 완벽한 마크다운 서식으로 작성해 주세요.
`;

      console.log(`[Proxy] Generating detailed review for movie: ${movieNm} (Tone: ${tone})`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const reviewText = response.text || "";
      return res.json({ review: reviewText });
    } catch (error: any) {
      console.error("[Proxy Error] /api/generate-review:", error.message || error);
      return res.status(500).json({ error: "Failed to generate detailed review with Gemini AI." });
    }
  });

  // API Route: Get Daily Box Office list
  app.get("/api/boxoffice", async (req, res) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== "string") {
        return res.status(400).json({ error: "date parameter is required and must be a string (YYYYMMDD)" });
      }

      const url = `https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${date}`;
      
      console.log(`[Proxy] Fetching Daily Box Office for date: ${date}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("[Proxy Error] /api/boxoffice:", error.message || error);
      return res.status(500).json({ error: "Failed to fetch daily box office list" });
    }
  });

  // API Route: Get Detailed Movie Information
  app.get("/api/movie-info", async (req, res) => {
    try {
      const { movieCd } = req.query;
      if (!movieCd || typeof movieCd !== "string") {
        return res.status(400).json({ error: "movieCd parameter is required and must be a string" });
      }

      const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;
      
      console.log(`[Proxy] Fetching Detailed Movie Info for movieCd: ${movieCd}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`KOBIS API returned status ${response.status}`);
      }

      const data = await response.json();
      return res.json(data);
    } catch (error: any) {
      console.error("[Proxy Error] /api/movie-info:", error.message || error);
      return res.status(500).json({ error: "Failed to fetch detailed movie information" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
