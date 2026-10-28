import { test } from "node:test";
import assert from "node:assert/strict";
import { initialState, balance, filtered, transaction } from "./model.mjs";
test("search and category combine without mutating sample transactions", () => {
  const state = initialState();
  assert.equal(filtered(state.transactions, "corner", "Food").length, 1);
  assert.equal(filtered(state.transactions, "corner", "Income").length, 0);
  assert.equal(state.transactions.length, 8);
});
test("adding a transaction updates the balance using integer cents", () => {
  const state = initialState(),
    before = balance(state);
  state.transactions.unshift(
    transaction(
      {
        merchant: "Lunch",
        amount: "12.34",
        category: "Food",
        date: "2026-10-25",
      },
      "added",
    ),
  );
  assert.equal(balance(state), before - 1234);
});
test("invalid amounts, missing descriptions and unknown categories are rejected", () => {
  for (const input of [
    { merchant: "", amount: "1", category: "Food" },
    { merchant: "Test", amount: "Infinity", category: "Food" },
    { merchant: "Test", amount: "-1", category: "Food" },
    { merchant: "Test", amount: "1", category: "Other" },
  ]) {
    assert.throws(() => transaction({ ...input, date: "2026-10-25" }, "bad"));
  }
  assert.throws(() =>
    transaction(
      {
        merchant: "Test",
        amount: "0.001",
        category: "Food",
        date: "2026-10-25",
      },
      "bad",
    ),
  );
  assert.throws(() =>
    transaction(
      { merchant: "Test", amount: "1", category: "Food", date: "2026-02-30" },
      "bad",
    ),
  );
});
