/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Import Vercel API handlers directly to use as route callbacks for local server
import boxofficeHandler from "./api/boxoffice";
import movieInfoHandler from "./api/movie-info";
import generateReviewHandler from "./api/generate-review";

// Load environment variables
dotenv.config();

const app = express();

// JSON middleware
app.use(express.json());

// Bind direct API handlers to the Express routes
app.post("/api/generate-review", generateReviewHandler);
app.get("/api/boxoffice", boxofficeHandler);
app.get("/api/movie-info", movieInfoHandler);

if (!process.env.VERCEL) {
  const startServer = async () => {
    const PORT = 3000;

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
  };

  startServer();
}

export default app;
