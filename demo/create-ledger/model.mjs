export const categories = [
  "Income",
  "Food",
  "Shopping",
  "Transport",
  "Home",
  "Software",
];
export function initialState() {
  return {
    name: "Avery",
    openingCents: 1985000,
    transactions: [
      {
        id: "1",
        merchant: "Studio North · project payment",
        category: "Income",
        date: "2026-10-24",
        amountCents: 420000,
      },
      {
        id: "2",
        merchant: "Sunday market",
        category: "Food",
        date: "2026-10-23",
        amountCents: -6840,
      },
      {
        id: "3",
        merchant: "Linear",
        category: "Software",
        date: "2026-10-22",
        amountCents: -1600,
      },
      {
        id: "4",
        merchant: "Eastbound rail",
        category: "Transport",
        date: "2026-10-21",
        amountCents: -2450,
      },
      {
        id: "5",
        merchant: "Fieldwork · monthly retainer",
        category: "Income",
        date: "2026-10-20",
        amountCents: 180000,
      },
      {
        id: "6",
        merchant: "A place for plants",
        category: "Shopping",
        date: "2026-10-19",
        amountCents: -4200,
      },
      {
        id: "7",
        merchant: "October rent",
        category: "Home",
        date: "2026-10-18",
        amountCents: -145000,
      },
      {
        id: "8",
        merchant: "Corner coffee",
        category: "Food",
        date: "2026-10-17",
        amountCents: -675,
      },
    ],
  };
}
export const balance = (state) =>
  state.openingCents +
  state.transactions.reduce((sum, t) => sum + t.amountCents, 0);
export function filtered(transactions, search = "", category = "") {
  const query = search.trim().toLowerCase();
  return transactions.filter(
    (t) =>
      (!category || t.category === category) &&
      `${t.merchant} ${t.category}`.toLowerCase().includes(query),
  );
}
export function transaction(input, id) {
  const amount = Number(input.amount);
  const cents = Math.round(amount * 100),
    date = new Date(input.date + "T12:00:00Z");
  if (
    !String(input.merchant || "").trim() ||
    !Number.isSafeInteger(cents) ||
    cents <= 0 ||
    amount !== cents / 100 ||
    !categories.includes(input.category) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.date
  )
    throw new Error(
      "Enter a description, positive two-decimal amount, category and valid date.",
    );
  return {
    id,
    merchant: input.merchant.trim().slice(0, 100),
    category: input.category,
    date: input.date,
    amountCents: cents * (input.category === "Income" ? 1 : -1),
  };
}
