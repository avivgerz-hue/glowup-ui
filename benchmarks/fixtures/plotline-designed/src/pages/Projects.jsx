import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import ProjectTable from "../components/ProjectTable.jsx";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";
import { EmptyArt, ErrorArt } from "../components/Illustrations.jsx";
import { fetchProjects, statusLabels } from "../data.js";

const field =
  "min-h-11 rounded-full border border-rule-strong bg-surface px-4 text-sm text-ink transition-colors duration-150 placeholder:text-faint hover:border-ink focus-visible:border-ink";

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
    <div className="rise">
      <PageHeader
        title="Projects"
        action={
          <Button onClick={() => alert("New project form coming soon")}>
            + New project
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <label htmlFor="search" className="sr-only">Search projects</label>
          <Icon name="search" size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" />
          <input
            id="search"
            type="search"
            placeholder="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${field} w-full pl-11`}
          />
        </div>
        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} cursor-pointer pr-8`}>
          <option value="all">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {state.status === "loading" && (
        <div className="rounded-box border border-ink bg-surface">
          <p className="border-b border-rule px-5 py-3 text-sm text-muted">Loading...</p>
          <div aria-hidden="true" className="divide-y divide-rule">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-6 px-5 py-4">
                <div className="skeleton h-5 w-40 rounded" />
                <div className="skeleton hidden h-4 w-28 rounded md:block" />
                <div className="skeleton ml-auto h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {state.status === "error" && (
        <div className="flex flex-col items-center gap-5 rounded-box border border-danger bg-danger-soft/50 px-6 py-12 text-center">
          <ErrorArt />
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-danger-ink">Error: {state.error.message}</p>
          </div>
          <Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>
            <Icon name="refresh" size={16} />
            Retry
          </Button>
        </div>
      )}

      {state.status === "ready" && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-5 rounded-box border border-dashed border-rule-strong bg-surface/60 px-6 py-12 text-center">
          <EmptyArt />
          <p className="font-display text-2xl font-semibold tracking-tight">No projects found.</p>
          {(query || status !== "all") && (
            <button
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-rule-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:border-ink"
              onClick={() => { setQuery(""); setStatus("all"); }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {state.status === "ready" && filtered.length > 0 && <ProjectTable projects={filtered} />}
    </div>
  );
}
