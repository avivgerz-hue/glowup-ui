import { useState } from "react";
import ServiceCard from "../components/ServiceCard.jsx";
import { services, categories } from "../data.js";

export default function Services() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const rows = services.filter((s) => (category === "All" || s.category === category) && (s.name + " " + s.summary).toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Services</h1>
      <div className="flex gap-2 mb-4">
        <label htmlFor="service-search" className="sr-only">Search services</label>
        <input id="service-search" type="search" placeholder="Search services" value={query} onChange={(e) => setQuery(e.target.value)} className="border border-gray-400 p-1" />
        <label htmlFor="category" className="sr-only">Category</label>
        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="border border-gray-400 p-1">
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      {rows.length === 0 ? <p className="text-gray-500">No services match your search.</p> : (
        <div className="grid grid-cols-3 gap-2">{rows.map((s) => <ServiceCard key={s.id} service={s} />)}</div>
      )}
    </div>
  );
}
