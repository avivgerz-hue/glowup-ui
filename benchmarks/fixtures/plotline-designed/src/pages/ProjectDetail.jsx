import { useState } from "react";
import { Link, useParams } from "react-router";
import StatusBadge from "../components/StatusBadge.jsx";
import Avatar from "../components/Avatar.jsx";
import { ProgressRing, ProgressBar } from "../components/Progress.jsx";
import { EmptyArt } from "../components/Illustrations.jsx";
import { projectById, memberById, formatDate, formatMoney } from "../data.js";

const backLink =
  "inline-flex min-h-10 items-center text-sm font-semibold text-muted transition-colors hover:text-ink";

export default function ProjectDetail() {
  const { id } = useParams();
  const project = projectById(id);
  const [tasks, setTasks] = useState(project ? project.tasks : []);

  if (!project) {
    return (
      <div className="rise flex flex-col items-start gap-5">
        <EmptyArt />
        <h1 className="text-4xl sm:text-5xl">Project not found</h1>
        <p className="text-muted">There is no project with the id “{id}”.</p>
        <Link to="/projects" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover">
          Back to projects
        </Link>
      </div>
    );
  }

  const owner = memberById(project.owner);
  const done = tasks.filter((t) => t.done).length;
  const toggle = (taskId) => setTasks((list) => list.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));

  const facts = [
    { label: "Owner", value: <span className="inline-flex items-center gap-2"><Avatar initials={owner.initials} size={24} />{owner.name}</span> },
    { label: "Due", value: formatDate(project.due) },
    { label: "Budget", value: formatMoney(project.budget) },
    { label: "Progress", value: `${project.progress}%` },
  ];

  return (
    <div className="rise">
      <Link to="/projects" className={`${backLink} mb-4`}>← Projects</Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-6 border-t border-ink pt-6">
        <div className="min-w-0">
          <h1 className="text-4xl sm:text-5xl">{project.name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-base text-muted">
            {project.client} · <StatusBadge status={project.status} />
          </p>
        </div>
        <div className="relative shrink-0">
          <ProgressRing value={project.progress} status={project.status} />
          <span aria-hidden="true" className="display-num num absolute inset-0 flex items-center justify-center text-xl">
            {project.progress}
          </span>
        </div>
      </div>

      <dl className="mb-10 grid grid-cols-2 divide-rule border-y border-ink max-sm:[&>*:nth-child(n+3)]:border-t max-sm:[&>*:nth-child(n+3)]:border-rule sm:grid-cols-4 sm:divide-x">
        {facts.map((f, i) => (
          <div key={f.label} className={`px-4 py-4 ${i % 2 === 0 ? "max-sm:pl-0" : ""} sm:first:pl-0`}>
            <dt className="text-xs text-muted">{f.label}</dt>
            <dd className="num mt-1 font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="max-w-2xl" aria-labelledby="tasks-title">
        <h2 id="tasks-title" className="mb-3 text-2xl">Tasks ({done}/{tasks.length} done)</h2>
        <ProgressBar value={tasks.length ? (done / tasks.length) * 100 : 0} status={project.status} className="mb-5" />
        <ul className="divide-y divide-rule rounded-box border border-ink bg-surface">
          {tasks.map((task) => (
            <li key={task.id}>
              <label className="flex min-h-14 cursor-pointer items-center gap-4 px-5 py-3 transition-colors hover:bg-sunken">
                <input type="checkbox" className="check" checked={task.done} onChange={() => toggle(task.id)} />
                <span className={`transition-colors ${task.done ? "text-faint line-through decoration-vermilion decoration-2" : ""}`}>{task.title}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
