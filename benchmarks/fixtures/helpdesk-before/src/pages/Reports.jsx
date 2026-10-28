import { tickets, customers, statusLabels, priorityLabels } from "../data.js";

function Table({ title, rows }) {
  return (
    <div className="mb-6">
      <h2 className="font-bold mb-2">{title}</h2>
      <table className="border border-gray-300 text-left">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-t border-gray-300"><td className="p-2 pr-8">{label}</td><td className="p-2 font-bold">{value}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const by = (key) => (v) => tickets.filter((t) => t[key] === v).length;
  const busiest = customers
    .map((c) => [c.name, tickets.filter((t) => t.customer === c.id).length])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <p className="mb-4">A snapshot of all {tickets.length} tickets.</p>
      <Table title="Tickets by status" rows={Object.entries(statusLabels).map(([v, l]) => [l, by("status")(v)])} />
      <Table title="Tickets by priority" rows={Object.entries(priorityLabels).map(([v, l]) => [l, by("priority")(v)])} />
      <Table title="Busiest customers" rows={busiest} />
    </div>
  );
}
