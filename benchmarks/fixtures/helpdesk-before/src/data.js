// Mock data. Everything is local; no network calls.

export const agents = [
  { id: "a1", name: "Maya Chen" },
  { id: "a2", name: "Tomás Rivera" },
  { id: "a3", name: "Priya Nair" },
  { id: "a4", name: "Jonas Weber" },
];

export const customers = [
  { id: "c1", name: "Harper Lane", company: "Northwind Foods", email: "harper@northwind.test", plan: "Business" },
  { id: "c2", name: "Diego Alvarez", company: "Alvarez Studio", email: "diego@alvarez.test", plan: "Starter" },
  { id: "c3", name: "Mei Tanaka", company: "Lumen Labs", email: "mei@lumen.test", plan: "Enterprise" },
  { id: "c4", name: "Oliver Grant", company: "Grant & Sons", email: "oliver@grant.test", plan: "Starter" },
  { id: "c5", name: "Fatima Khalil", company: "Cedar Clinics", email: "fatima@cedar.test", plan: "Business" },
  { id: "c6", name: "Lucas Moreau", company: "Atelier Moreau", email: "lucas@moreau.test", plan: "Business" },
];

export const tickets = [
  { id: "T-1042", subject: "Cannot export invoices to CSV", customer: "c3", assignee: "a1", status: "open", priority: "urgent", updated: "2026-10-26T09:12:00", messages: [
    { from: "customer", name: "Mei Tanaka", at: "Oct 26, 8:40 AM", body: "The CSV export button spins forever on the invoices page. We need this for month-end close." },
    { from: "agent", name: "Maya Chen", at: "Oct 26, 9:12 AM", body: "Thanks Mei, I can reproduce this. I'm checking with engineering and will update you within the hour." },
  ] },
  { id: "T-1041", subject: "Add a teammate to our workspace", customer: "c5", assignee: "a2", status: "pending", priority: "normal", updated: "2026-10-25T16:30:00", messages: [
    { from: "customer", name: "Fatima Khalil", at: "Oct 25, 3:55 PM", body: "How do I add two more teammates? The invite button is greyed out." },
    { from: "agent", name: "Tomás Rivera", at: "Oct 25, 4:30 PM", body: "Your plan includes 10 seats and you are using 10. I can upgrade you to 15 seats if you would like." },
  ] },
  { id: "T-1040", subject: "Two-factor codes arrive late", customer: "c1", assignee: "a3", status: "open", priority: "high", updated: "2026-10-25T14:05:00", messages: [
    { from: "customer", name: "Harper Lane", at: "Oct 25, 1:50 PM", body: "SMS codes take about five minutes to arrive, so people keep getting locked out." },
  ] },
  { id: "T-1039", subject: "Refund request for duplicate charge", customer: "c2", assignee: "a1", status: "solved", priority: "normal", updated: "2026-10-24T11:20:00", messages: [
    { from: "customer", name: "Diego Alvarez", at: "Oct 24, 10:02 AM", body: "I was charged twice this month." },
    { from: "agent", name: "Maya Chen", at: "Oct 24, 11:20 AM", body: "Confirmed. The duplicate charge has been refunded and should appear in 3-5 days." },
  ] },
  { id: "T-1038", subject: "Dashboard widgets reset after logout", customer: "c6", assignee: "a4", status: "open", priority: "normal", updated: "2026-10-24T09:45:00", messages: [
    { from: "customer", name: "Lucas Moreau", at: "Oct 24, 9:30 AM", body: "My dashboard layout is lost every time I sign out." },
  ] },
  { id: "T-1037", subject: "Need SSO setup guide", customer: "c3", assignee: "a2", status: "pending", priority: "low", updated: "2026-10-23T15:10:00", messages: [
    { from: "customer", name: "Mei Tanaka", at: "Oct 23, 2:00 PM", body: "Is there a step-by-step guide for Okta SSO?" },
    { from: "agent", name: "Tomás Rivera", at: "Oct 23, 3:10 PM", body: "Sending you our SSO guide and a short checklist now." },
  ] },
  { id: "T-1036", subject: "API rate limit errors in production", customer: "c1", assignee: "a3", status: "open", priority: "urgent", updated: "2026-10-23T12:00:00", messages: [
    { from: "customer", name: "Harper Lane", at: "Oct 23, 11:40 AM", body: "We are getting 429 responses at about 60 requests per minute, which is below the documented limit." },
  ] },
  { id: "T-1035", subject: "Change billing email", customer: "c4", assignee: "a1", status: "solved", priority: "low", updated: "2026-10-22T10:00:00", messages: [
    { from: "customer", name: "Oliver Grant", at: "Oct 22, 9:20 AM", body: "Please send invoices to accounts@grant.test instead." },
    { from: "agent", name: "Maya Chen", at: "Oct 22, 10:00 AM", body: "Done. Your billing email is updated." },
  ] },
  { id: "T-1034", subject: "Mobile app crashes on login", customer: "c5", assignee: "a4", status: "pending", priority: "high", updated: "2026-10-22T08:15:00", messages: [
    { from: "customer", name: "Fatima Khalil", at: "Oct 22, 7:50 AM", body: "The Android app closes immediately after I enter my password." },
    { from: "agent", name: "Jonas Weber", at: "Oct 22, 8:15 AM", body: "Which app version are you on? We fixed a crash in 4.2.1." },
  ] },
  { id: "T-1033", subject: "Feature request: dark mode", customer: "c2", assignee: "a2", status: "solved", priority: "low", updated: "2026-10-21T17:40:00", messages: [
    { from: "customer", name: "Diego Alvarez", at: "Oct 21, 5:00 PM", body: "Any plans for a dark theme?" },
    { from: "agent", name: "Tomás Rivera", at: "Oct 21, 5:40 PM", body: "It's on the roadmap. I've added your vote." },
  ] },
  { id: "T-1032", subject: "Webhook deliveries failing", customer: "c6", assignee: "a3", status: "open", priority: "high", updated: "2026-10-21T13:25:00", messages: [
    { from: "customer", name: "Lucas Moreau", at: "Oct 21, 1:00 PM", body: "Webhooks to our staging endpoint return 500 since yesterday." },
  ] },
  { id: "T-1031", subject: "Question about data retention", customer: "c3", assignee: "a1", status: "solved", priority: "normal", updated: "2026-10-20T09:00:00", messages: [
    { from: "customer", name: "Mei Tanaka", at: "Oct 20, 8:30 AM", body: "How long do you retain deleted records?" },
    { from: "agent", name: "Maya Chen", at: "Oct 20, 9:00 AM", body: "Deleted records are kept for 30 days and then permanently removed." },
  ] },
];

export const stats = { csat: 94, firstResponseHours: 2.4 };

export const statusLabels = { open: "Open", pending: "Pending", solved: "Solved" };
export const priorityLabels = { urgent: "Urgent", high: "High", normal: "Normal", low: "Low" };

export const customerById = (id) => customers.find((c) => c.id === id);
export const agentById = (id) => agents.find((a) => a.id === id);
export const ticketById = (id) => tickets.find((t) => t.id === id);

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Simulates an API call. `?simulate=loading` never resolves, `?simulate=error` rejects,
// and `?simulate=empty` returns no tickets, so every UI state can be inspected.
export function fetchTickets(simulate) {
  if (simulate === "loading") return new Promise(() => {});
  if (simulate === "error") return Promise.reject(new Error("We could not reach the ticket service."));
  if (simulate === "empty") return Promise.resolve([]);
  return Promise.resolve(tickets);
}
