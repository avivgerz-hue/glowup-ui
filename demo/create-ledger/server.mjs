import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.dirname(fileURLToPath(import.meta.url));
const files = new Set(["index.html", "style.css", "app.mjs", "model.mjs"]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};
createServer((req, res) => {
  const name =
    new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
  if (!files.has(name)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  res.writeHead(200, {
    "Content-Type": types[path.extname(name)],
    "Cache-Control": "no-store",
  });
  res.end(fs.readFileSync(path.join(root, name)));
}).listen(Number(process.env.PORT || 4188), "127.0.0.1", () =>
  console.log("Margin demo ready"),
);
