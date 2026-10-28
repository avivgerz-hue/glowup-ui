import { useState } from "react";
import { customers, tickets } from "../data.js";

export default function Customers() {
  const [query, setQuery] = useState("");
  const rows = customers.filter((c) => (c.name + " " + c.company).toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <div className="mb-4">
        <label htmlFor="customer-search" className="sr-only">Search customers</label>
        <input id="customer-search" type="search" placeholder="Search customers" value={query} onChange={(e) => setQuery(e.target.value)} className="border border-gray-400 p-1" />
      </div>
      {rows.length === 0 ? <p className="text-gray-500">No customers found.</p> : (
        <table className="w-full border border-gray-300 text-left">
          <thead className="bg-gray-100">
            <tr><th className="p-2">Name</th><th className="p-2">Company</th><th className="p-2">Plan</th><th className="p-2">Tickets</th><th className="p-2">Email</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-gray-300">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.company}</td>
                <td className="p-2">{c.plan}</td>
                <td className="p-2">{tickets.filter((t) => t.customer === c.id).length}</td>
                <td className="p-2"><a href={`mailto:${c.email}`} className="text-blue-600">{c.email}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
