import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "webdav";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: WebDAV Proxy
  app.post("/api/cloud/webdav/list", async (req, res) => {
    const { url, username, password, path } = req.body;
    try {
      const client = createClient(url, { username, password });
      const directoryItems = await client.getDirectoryContents(path || "/");
      res.json(directoryItems);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/cloud/webdav/fetch", async (req, res) => {
    const { url, username, password, filePath } = req.body;
    try {
      const client = createClient(url, { username, password });
      const buffer = await client.getFileContents(filePath);
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Generic URL fetcher (proxy for CORS)
  app.get("/api/cloud/fetch", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).send("URL required");
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      res.send(response.data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
