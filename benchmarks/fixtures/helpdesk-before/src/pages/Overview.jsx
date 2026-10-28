import { Link } from "react-router";
import StatCard from "../components/StatCard.jsx";
import Badge from "../components/Badge.jsx";
import { tickets, stats, customerById } from "../data.js";

export default function Overview() {
  const count = (status) => tickets.filter((t) => t.status === status).length;
  const recent = [...tickets].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 5);
  const urgent = tickets.filter((t) => t.status === "open" && (t.priority === "urgent" || t.priority === "high"));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Overview</h1>
      <p className="mb-4">Good morning, Maya. Here is where support stands today.</p>
      <div className="grid grid-cols-4 gap-2 mb-6">
        <StatCard label="Open tickets" value={count("open")} hint="Waiting for a reply" />
        <StatCard label="Pending" value={count("pending")} />
        <StatCard label="Solved" value={count("solved")} />
        <StatCard label="CSAT" value={`${stats.csat}%`} hint={`${stats.firstResponseHours} h first response`} />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <h2 className="font-bold mb-2">Recent tickets</h2>
          <ul>
            {recent.map((t) => (
              <li key={t.id} className="border-b border-gray-200 py-2">
                <Link to={`/tickets/${t.id}`} className="text-blue-600 underline">{t.subject}</Link>{" "}
                <span className="text-gray-500 text-sm">from {customerById(t.customer).name}</span> <Badge kind={t.status} />
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/3">
          <h2 className="font-bold mb-2">Needs attention</h2>
          {urgent.map((t) => (
            <div key={t.id} className="border border-red-300 p-2 mb-2">
              <Link to={`/tickets/${t.id}`} className="text-blue-600 underline">{t.subject}</Link> <Badge kind={t.priority} />
            </div>
          ))}
          <Link to="/tickets" className="text-blue-600">View all tickets →</Link>
        </div>
      </div>
    </div>
  );
}
