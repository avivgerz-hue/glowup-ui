// One deterministic state for comparable captures; never used as a model prompt.
import crypto from 'node:crypto';
export const CHAT_SEED = {
  active: 'reference-thread', settings: { model: 'demo-balanced', theme: 'light' },
  chats: [{ id: 'reference-thread', title: 'Prague trip', messages: [
    { role: 'user', content: 'Plan a weekend in Prague' },
    { role: 'assistant', content: 'Demo reply: Explore the old town, take a riverside walk, and visit a museum. This is fixed benchmark content, not live AI.' }
  ] }]
};
export const CHAT_SEED_HASH = crypto.createHash('sha256').update(JSON.stringify(CHAT_SEED)).digest('hex');
export async function seedChat(page) {
  await page.evaluate(seed => localStorage.setItem('chat-benchmark', JSON.stringify(seed)), CHAT_SEED);
  // Hash navigation does not reinitialize module state. A real reload is essential.
  await page.reload();
}
