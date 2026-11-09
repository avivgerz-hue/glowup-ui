import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

// Windows needs `shell: true` to resolve npm/npx, but then Node concatenates argv without
// quoting. A Node install at "C:\Program Files\nodejs\node.exe" therefore arrives as
// `C:\Program` and fails. Quote any argument that contains a space, and never pick up the
// shell for plain commands that do not need it.
const shellNeeded = (cmd) => process.platform === "win32" && !path.isAbsolute(cmd) && /\.(?:cmd|bat)$|^(?:npm|npx|yarn|pnpm)$/i.test(cmd);
const quoteIfNeeded = (value) => process.platform === "win32" && /\s/.test(value) && !/^".*"$/.test(value) ? `"${value}"` : value;

export function sh(cmd, args, opts = {}) {
  const shell = shellNeeded(cmd);
  const prepared = shell ? [cmd, ...args].map(quoteIfNeeded) : args;
  const r = spawnSync(shell ? quoteIfNeeded(cmd) : cmd, prepared, {
    encoding: "utf8", timeout: opts.timeout ?? 300000, cwd: opts.cwd,
    env: { ...process.env, CI: "1", ...(opts.env || {}) }, shell,
  });
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
