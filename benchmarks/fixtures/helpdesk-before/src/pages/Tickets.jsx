import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import TicketTable from "../components/TicketTable.jsx";
import Button from "../components/Button.jsx";
import { fetchTickets, statusLabels, priorityLabels, customerById } from "../data.js";

export default function Tickets() {
  const [searchParams] = useSearchParams();
  const simulate = searchParams.get("simulate");
  const [state, setState] = useState({ status: "loading", data: [], error: null });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: [], error: null });
    fetchTickets(simulate)
      .then((data) => !cancelled && setState({ status: "ready", data, error: null }))
      .catch((error) => !cancelled && setState({ status: "error", data: [], error }));
    return () => { cancelled = true; };
  }, [simulate, attempt]);

  const filtered = state.data.filter(
    (t) =>
      (status === "all" || t.status === status) &&
      (priority === "all" || t.priority === priority) &&
      (t.subject + " " + t.id + " " + customerById(t.customer).name).toLowerCase().includes(query.trim().toLowerCase()),
  );
  const filtering = query || status !== "all" || priority !== "all";

  return (
    <div>
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <Button className="ml-auto" onClick={() => alert("New ticket form coming soon")}>+ New ticket</Button>
      </div>
      <div className="flex gap-2 mb-4">
        <label htmlFor="search" className="sr-only">Search tickets</label>
        <input id="search" type="search" placeholder="Search tickets" value={query} onChange={(e) => setQuery(e.target.value)} className="border border-gray-400 p-1" />
        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-400 p-1">
          <option value="all">All statuses</option>
          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <label htmlFor="priority" className="sr-only">Priority</label>
        <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="border border-gray-400 p-1">
          <option value="all">All priorities</option>
          {Object.entries(priorityLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {state.status === "loading" && <p>Loading tickets...</p>}
      {state.status === "error" && (
        <div role="alert" className="border border-red-400 bg-red-100 p-3">
          <p>Error: {state.error.message}</p>
          <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
        </div>
      )}
      {state.status === "ready" && filtered.length === 0 && (
        <div className="p-4 text-gray-500">
          <p>No tickets found.</p>
          {filtering && (
            <button className="text-blue-600 underline" onClick={() => { setQuery(""); setStatus("all"); setPriority("all"); }}>Clear filters</button>
          )}
        </div>
      )}
      {state.status === "ready" && filtered.length > 0 && <TicketTable tickets={filtered} />}
    </div>
  );
}
