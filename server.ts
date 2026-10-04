import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "AutoFleet & Rental Management System", timestamp: new Date() });
  });

  // AI Fleet Assistant Endpoint (uses Gemini Server-side if configured)
  app.post("/api/ai/fleet-insight", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          success: false,
          message: "GEMINI_API_KEY is not configured.",
          insight: "Direct maintenance recommended for vehicles approaching 10,000 km threshold. Check tire pressure and oil levels."
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { carsData, rentalsCount, maintenanceCount, language = 'ar' } = req.body;

      const prompt = `You are an expert Automotive Fleet Management AI Assistant.
Analyze this fleet overview and provide 3 concise, actionable operational tips and maintenance recommendations:
Cars Overview: ${JSON.stringify(carsData)}
Active Rentals: ${rentalsCount}
Pending Maintenance Items: ${maintenanceCount}

Respond in ${language === 'ar' ? 'Arabic' : 'English'} in JSON format:
{
  "summary": "Brief overall status summary",
  "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      return res.json({ success: true, insightText: responseText });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AutoFleet Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
