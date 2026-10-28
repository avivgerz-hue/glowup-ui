# Chat — transformed workspace

A demonstration app alongside `benchmarks/fixtures/chat-before`. Existing `#chat`, `#history`, `#settings`, storage, server and streaming/cancellation behavior are covered by the chat contract. It uses a deterministic local provider, not a live AI service or a controlled current-skill quality comparison.

```bash
npm start
# Local server defaults to port 4179; set PORT to choose another.
npm test
npm run build
```

No install step or new dependency. This uses the original deterministic local test provider, not a live AI service.

Run `node benchmarks/chat-journey.mjs --url http://127.0.0.1:4179 --out /absolute/path/to/private-evidence` from the repository root to check behavior and capture genuine desktop/mobile views. Generated evidence is kept outside Git.
