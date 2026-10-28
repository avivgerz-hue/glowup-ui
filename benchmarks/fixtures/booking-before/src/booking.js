// Tiny in-memory store that carries the latest booking to the confirmation page.
let latest = null;
let counter = 2047;

export function saveBooking(details) {
  counter += 1;
  latest = { ...details, reference: `SW-${counter}` };
  return latest;
}
export const getBooking = () => latest;
export const clearBooking = () => { latest = null; };
