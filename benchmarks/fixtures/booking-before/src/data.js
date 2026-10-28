// Mock data for the Saltwater Spa booking site. Everything is local.

export const services = [
  { id: "deep-tissue", name: "Deep Tissue Massage", category: "Massage", minutes: 60, price: 120, summary: "Firm pressure to release chronic tension in the back, neck, and shoulders.", benefits: ["Eases muscle knots", "Improves mobility", "Reduces stress"] },
  { id: "swedish", name: "Swedish Massage", category: "Massage", minutes: 60, price: 105, summary: "A gentle, flowing massage for deep relaxation.", benefits: ["Calms the nervous system", "Improves circulation", "Promotes better sleep"] },
  { id: "hot-stone", name: "Hot Stone Massage", category: "Massage", minutes: 90, price: 160, summary: "Warm basalt stones melt away tension while long strokes soothe the body.", benefits: ["Deep warmth", "Releases tight muscles", "Quiets the mind"] },
  { id: "hydrating-facial", name: "Hydrating Facial", category: "Facials", minutes: 50, price: 95, summary: "Cleanse, exfoliate, and restore moisture with a sea-mineral mask.", benefits: ["Restores glow", "Locks in moisture", "Suits all skin types"] },
  { id: "radiance-facial", name: "Radiance Facial", category: "Facials", minutes: 75, price: 140, summary: "Vitamin C and gentle peel for brighter, more even skin.", benefits: ["Brightens skin tone", "Softens fine lines", "Includes shoulder massage"] },
  { id: "salt-scrub", name: "Sea Salt Body Scrub", category: "Body", minutes: 45, price: 85, summary: "A full-body exfoliation with mineral sea salt and botanical oils.", benefits: ["Smooths skin", "Boosts circulation", "Leaves skin silky"] },
  { id: "seaweed-wrap", name: "Seaweed Body Wrap", category: "Body", minutes: 60, price: 110, summary: "A detoxifying wrap rich in marine minerals, finished with a scalp massage.", benefits: ["Detoxifying", "Deeply nourishing", "Relaxing"] },
  { id: "tide-ritual", name: "The Tide Ritual", category: "Rituals", minutes: 150, price: 280, summary: "Our signature half-day: salt scrub, hot stone massage, and a hydrating facial.", benefits: ["Full-body reset", "Tea service included", "Best value"] },
];

export const categories = ["All", "Massage", "Facials", "Body", "Rituals"];
export const timeSlots = ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM"];

export const serviceById = (id) => services.find((s) => s.id === id);
export const formatPrice = (n) => `$${n}`;

// Deterministic availability: some slots are taken depending on the date.
export function slotsFor(dateString) {
  if (!dateString) return [];
  const day = Number(dateString.slice(-2));
  return timeSlots.map((time, i) => ({ time, available: (day + i) % 4 !== 0 }));
}
