/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default async function handler(req: any, res: any) {
  // Support CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "3a3816b17943accb6ecdf9f052335842";
  
  try {
    const { movieCd } = req.query;
    if (!movieCd || typeof movieCd !== "string") {
      return res.status(400).json({ error: "movieCd parameter is required and must be a string" });
    }

    const url = `https://kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;
    
    console.log(`[Vercel API] Fetching Movie Info for code: ${movieCd}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`KOBIS API returned status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[Vercel API Error] /api/movie-info:", error.message || error);
    return res.status(500).json({ error: "Failed to fetch detailed movie information" });
  }
}
