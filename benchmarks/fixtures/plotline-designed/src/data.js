// Mock data for the demo. Everything is local; no network calls.

export const members = [
  { id: "m1", name: "Ana Ruiz", role: "Design lead", email: "ana@plotline.test", initials: "AR" },
  { id: "m2", name: "Ben Okafor", role: "Frontend engineer", email: "ben@plotline.test", initials: "BO" },
  { id: "m3", name: "Chloé Martin", role: "Product manager", email: "chloe@plotline.test", initials: "CM" },
  { id: "m4", name: "Dev Patel", role: "Backend engineer", email: "dev@plotline.test", initials: "DP" },
  { id: "m5", name: "Elif Yılmaz", role: "Illustrator", email: "elif@plotline.test", initials: "EY" },
  { id: "m6", name: "Felix Wagner", role: "QA engineer", email: "felix@plotline.test", initials: "FW" },
];

export const projects = [
  {
    id: "p1",
    name: "Harbor rebrand",
    client: "Harbor Coffee Co.",
    status: "active",
    due: "2026-11-14",
    progress: 72,
    owner: "m1",
    budget: 48000,
    tasks: [
      { id: "t1", title: "Moodboard review", done: true },
      { id: "t2", title: "Logo refinements", done: true },
      { id: "t3", title: "Packaging mockups", done: false },
      { id: "t4", title: "Brand guidelines PDF", done: false },
    ],
  },
  {
    id: "p2",
    name: "Atlas mobile app",
    client: "Atlas Fitness",
    status: "at-risk",
    due: "2026-11-02",
    progress: 41,
    owner: "m2",
    budget: 126000,
    tasks: [
      { id: "t5", title: "Onboarding flow", done: true },
      { id: "t6", title: "Workout tracker screens", done: false },
      { id: "t7", title: "Push notification copy", done: false },
    ],
  },
  {
    id: "p3",
    name: "Quarry annual report",
    client: "Quarry Foundation",
    status: "completed",
    due: "2026-09-30",
    progress: 100,
    owner: "m3",
    budget: 22000,
    tasks: [
      { id: "t8", title: "Data visualizations", done: true },
      { id: "t9", title: "Print proofing", done: true },
    ],
  },
  {
    id: "p4",
    name: "Nimbus docs site",
    client: "Nimbus Cloud",
    status: "active",
    due: "2026-12-05",
    progress: 18,
    owner: "m4",
    budget: 64000,
    tasks: [
      { id: "t10", title: "Information architecture", done: true },
      { id: "t11", title: "Search UX", done: false },
      { id: "t12", title: "API reference templates", done: false },
    ],
  },
  {
    id: "p5",
    name: "Fern & Co. storefront",
    client: "Fern & Co.",
    status: "paused",
    due: "2027-01-20",
    progress: 9,
    owner: "m5",
    budget: 38000,
    tasks: [{ id: "t13", title: "Product photography brief", done: false }],
  },
];

export const activity = [
  { id: "a1", who: "m1", what: "uploaded 4 files to", project: "p1", when: "12 min ago" },
  { id: "a2", who: "m2", what: "flagged a blocker on", project: "p2", when: "1 hr ago" },
  { id: "a3", who: "m4", what: "completed “Information architecture” in", project: "p4", when: "3 hr ago" },
  { id: "a4", who: "m3", what: "archived the final files for", project: "p3", when: "Yesterday" },
  { id: "a5", who: "m6", what: "commented on", project: "p2", when: "Yesterday" },
];

export const statusLabels = {
  active: "Active",
  "at-risk": "At risk",
  completed: "Completed",
  paused: "Paused",
};

export function memberById(id) {
  return members.find((m) => m.id === id);
}

export function projectById(id) {
  return projects.find((p) => p.id === id);
}

export function formatMoney(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function formatDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Simulates an API call. `?simulate=loading` never resolves and
// `?simulate=error` rejects, so every UI state can be inspected.
export function fetchProjects(simulate) {
  if (simulate === "loading") return new Promise(() => {});
  if (simulate === "error") return Promise.reject(new Error("The server took too long to respond."));
  if (simulate === "empty") return Promise.resolve([]);
  return Promise.resolve(projects);
}
