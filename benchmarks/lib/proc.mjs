import { spawn, spawnSync } from "node:child_process";

export function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: opts.timeout ?? 300000, cwd: opts.cwd, env: { ...process.env, CI: "1", ...(opts.env || {}) }, shell: process.platform === "win32" });
  return { status: r.status, out: `${r.stdout || ""}${r.stderr || ""}`, signal: r.signal, error: r.error?.message };
}

export async function startPreview(cwd, port) {
  const child = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], { cwd, stdio: "ignore", detached: true });
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(url)).ok) return { url, stop: () => { try { process.kill(-child.pid); } catch { /* already gone */ } } }; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  try { process.kill(-child.pid); } catch { /* already gone */ }
  throw new Error(`preview server did not start on ${port}`);
}
