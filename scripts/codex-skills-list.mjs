// Ask a real Codex app-server which skills it discovers for the given cwds.
import { spawn } from "node:child_process";
import readline from "node:readline";

const [codexBin, ...cwds] = process.argv.slice(2);
const child = spawn(codexBin, ["app-server"], { stdio: ["pipe", "pipe", "inherit"], env: process.env });
const rl = readline.createInterface({ input: child.stdout });
const send = (msg) => child.stdin.write(JSON.stringify(msg) + "\n");
const timer = setTimeout(() => { console.error("timeout"); child.kill(); process.exit(2); }, 60000);

rl.on("line", (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  if (msg.id === 1) {
    send({ method: "initialized" });
    send({ id: 2, method: "skills/list", params: { cwds, forceReload: true } });
  } else if (msg.id === 2) {
    clearTimeout(timer);
    if (msg.error) { console.log(JSON.stringify(msg.error, null, 2)); process.exit(1); }
    for (const entry of msg.result.data ?? msg.result.entries ?? msg.result) {
      console.log(`cwd: ${entry.cwd}`);
      for (const e of entry.errors) console.log(`  ERROR ${JSON.stringify(e)}`);
      for (const s of entry.skills.filter((s) => s.scope !== "system")) {
        console.log(`  [${s.scope}] ${s.name} enabled=${s.enabled} path=${s.path}`);
        if (s.name === "glowup-ui") console.log(`    interface=${JSON.stringify(s.interface)}\n    description=${s.description.slice(0, 90)}...`);
      }
    }
    child.kill();
    process.exit(0);
  }
});
send({ id: 1, method: "initialize", params: { clientInfo: { name: "glowup-ui-test", title: null, version: "0.0.0" }, capabilities: null } });
