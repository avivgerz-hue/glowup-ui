import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import ProjectTable from "../components/ProjectTable.jsx";
import Button from "../components/Button.jsx";
import { fetchProjects, statusLabels } from "../data.js";

export default function Projects() {
  const [searchParams] = useSearchParams();
  const simulate = searchParams.get("simulate");
  const [state, setState] = useState({ status: "loading", data: [], error: null });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: [], error: null });
    fetchProjects(simulate)
      .then((data) => !cancelled && setState({ status: "ready", data, error: null }))
      .catch((error) => !cancelled && setState({ status: "error", data: [], error }));
    return () => {
      cancelled = true;
    };
  }, [simulate, attempt]);

  const filtered = state.data.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      (p.name + " " + p.client).toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button className="ml-auto" onClick={() => alert("New project form coming soon")}>
          + New project
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <label htmlFor="search" className="sr-only">Search projects</label>
        <input
          id="search"
          type="search"
          placeholder="Search projects"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-gray-400 p-1"
        />
        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-400 p-1">
          <option value="all">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {state.status === "loading" && <p>Loading...</p>}

      {state.status === "error" && (
        <div className="border border-red-400 bg-red-100 p-3">
          <p>Error: {state.error.message}</p>
          <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>Retry</Button>
        </div>
      )}

      {state.status === "ready" && filtered.length === 0 && (
        <div className="p-4 text-gray-500">
          <p>No projects found.</p>
          {(query || status !== "all") && (
            <button className="text-blue-600 underline" onClick={() => { setQuery(""); setStatus("all"); }}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {state.status === "ready" && filtered.length > 0 && <ProjectTable projects={filtered} />}
    </div>
  );
}
