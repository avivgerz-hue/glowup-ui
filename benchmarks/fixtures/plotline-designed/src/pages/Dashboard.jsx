import { Link } from "react-router";
import StatCard from "../components/StatCard.jsx";
import StatusBadge, { statusColor } from "../components/StatusBadge.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Avatar from "../components/Avatar.jsx";
import Icon from "../components/Icon.jsx";
import { ProgressBar } from "../components/Progress.jsx";
import { projects, activity, memberById, projectById, formatMoney, formatDate } from "../data.js";

// Studio line: every project plotted by due date (x) and progress (y), joined in date order.
function StudioLine({ items }) {
  const W = 640;
  const H = 280;
  const pad = { l: 44, r: 28, t: 24, b: 44 };
  const times = items.map((p) => new Date(`${p.due}T00:00:00`).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  const x = (t) => pad.l + ((t - min) / (max - min || 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
  const points = items
    .map((p, i) => ({ ...p, px: x(times[i]), py: y(p.progress) }))
    .sort((a, b) => a.px - b.px);
  const line = points.map((p) => `${p.px},${p.py}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label="Projects plotted by due date and progress"
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[520px]"
      >
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#ddd4bf" strokeDasharray={v === 0 ? "0" : "3 5"} />
            <text x={pad.l - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#5d584b">{v}%</text>
          </g>
        ))}
        <polyline
          className="draw-line"
          style={{ "--len": 1400 }}
          points={line}
          fill="none"
          stroke="#1c1a16"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => {
          const flip = p.px > W - 150;
          // A local low point sits in the V of the line, so its label goes underneath.
          const valley = points[i - 1] && points[i + 1] && points[i - 1].py < p.py && points[i + 1].py < p.py;
          return (
            <g key={p.id}>
              <line x1={p.px} x2={p.px} y1={p.py} y2={y(0)} stroke={statusColor[p.status]} strokeOpacity="0.35" strokeDasharray="2 4" />
              <circle cx={p.px} cy={p.py} r="7" fill={statusColor[p.status]} stroke="#fffcf6" strokeWidth="3" />
              <text
                x={valley ? p.px : p.px + (flip ? -12 : 12)}
                y={p.py + (valley ? 26 : -12)}
                textAnchor={valley ? "middle" : flip ? "end" : "start"}
                fontSize="12"
                fontWeight="600"
                fill="#1c1a16"
                stroke="#fffcf6"
                strokeWidth="4"
                paintOrder="stroke"
              >
                {p.name}
              </text>
              <text x={p.px} y={H - 14} textAnchor="middle" fontSize="11" fill="#5d584b">
                {new Date(`${p.due}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const active = projects.filter((p) => p.status === "active").length;
  const atRisk = projects.filter((p) => p.status === "at-risk");
  const openTasks = projects.flatMap((p) => p.tasks).filter((t) => !t.done).length;
  const pipeline = projects.filter((p) => p.status !== "completed").reduce((sum, p) => sum + p.budget, 0);

  return (
    <div className="rise">
      <PageHeader title="Dashboard" lede="Welcome back, Ana. Here is what is happening at the studio." />

      <div className="mb-10 grid grid-cols-2 divide-x divide-rule border-y border-ink max-lg:[&>*:nth-child(odd)]:pl-0 max-lg:[&>*:nth-child(n+3)]:border-t max-lg:[&>*:nth-child(n+3)]:border-rule lg:grid-cols-4">
        <StatCard label="Active projects" value={active} icon="pulse" />
        <StatCard label="At risk" value={atRisk.length} hint="Needs attention" icon="alert" tone="danger" />
        <StatCard label="Open tasks" value={openTasks} icon="check" />
        <StatCard label="Pipeline" value={formatMoney(pipeline)} hint="Excludes completed work" icon="wallet" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-2">
          <section className="rounded-box border border-ink bg-surface p-5 shadow-lift sm:p-6" aria-labelledby="line-title">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <h2 id="line-title" className="text-2xl">Studio line</h2>
              <span className="text-xs text-muted">Progress by due date</span>
            </div>
            <StudioLine items={projects} />
          </section>

          <section aria-labelledby="activity-title">
            <h2 id="activity-title" className="mb-4 border-t border-ink pt-4 text-2xl">Recent activity</h2>
            <ul className="relative">
              <span aria-hidden="true" className="absolute top-3 bottom-3 left-4 w-px bg-rule" />
              {activity.map((item) => {
                const who = memberById(item.who);
                return (
                  <li key={item.id} className="relative flex items-start gap-4 py-3">
                    <span className="rounded-full ring-4 ring-paper">
                      <Avatar initials={who.initials} size={32} />
                    </span>
                    <div className="min-w-0 pt-1 text-sm leading-relaxed">
                      <b className="font-semibold">{who.name}</b> {item.what}{" "}
                      <Link to={`/projects/${item.project}`} className="font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary">
                        {projectById(item.project).name}
                      </Link>{" "}
                      <span className="whitespace-nowrap text-muted">{item.when}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside aria-labelledby="attention-title" className="flex flex-col gap-4 self-start">
          <h2 id="attention-title" className="border-t border-ink pt-4 text-2xl">Needs attention</h2>
          {atRisk.map((project) => (
            <div key={project.id} className="rounded-box border border-danger bg-danger-soft/60 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <Link to={`/projects/${project.id}`} className="font-display text-lg font-semibold tracking-tight text-ink underline decoration-danger underline-offset-4">
                  {project.name}
                </Link>{" "}
                <StatusBadge status={project.status} />
              </div>
              <ProgressBar value={project.progress} status={project.status} className="mb-2 bg-white/70" />
              <div className="num text-sm">{project.progress}% complete</div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <Icon name="calendar" size={14} />
                Due {formatDate(project.due)}
              </div>
            </div>
          ))}
          <Link to="/projects" className="group inline-flex items-center gap-2 text-sm font-semibold text-primary">
            View all projects <span className="transition-transform duration-150 group-hover:translate-x-1">→</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
