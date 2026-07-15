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
    const { date } = req.query;
    if (!date || typeof date !== "string") {
      return res.status(400).json({ error: "date parameter is required and must be a string (YYYYMMDD)" });
    }

    const url = `https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${date}`;
    
    console.log(`[Vercel API] Fetching Daily Box Office for date: ${date}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`KOBIS API returned status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("[Vercel API Error] /api/boxoffice:", error.message || error);
    return res.status(500).json({ error: "Failed to fetch daily box office list" });
  }
}
