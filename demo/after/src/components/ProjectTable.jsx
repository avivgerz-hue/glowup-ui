import { Link } from "react-router";
import StatusBadge from "./StatusBadge.jsx";
import Avatar from "./Avatar.jsx";
import { ProgressBar } from "./Progress.jsx";
import { memberById, formatDate, formatMoney } from "../data.js";

export default function ProjectTable({ projects }) {
  return (
    <div className="overflow-hidden rounded-box border border-ink bg-surface shadow-lift">
      <table className="stack-table w-full text-left text-sm">
        <thead className="border-b border-ink bg-sunken text-xs text-muted">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">Project</th>
            <th scope="col" className="px-3 py-3 font-semibold">Client</th>
            <th scope="col" className="px-3 py-3 font-semibold">Status</th>
            <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
            <th scope="col" className="px-3 py-3 font-semibold">Due</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Budget</th>
            <th scope="col" className="py-3 pr-5 pl-6 font-semibold">Progress</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {projects.map((project) => {
            const owner = memberById(project.owner);
            return (
              <tr key={project.id} className="transition-colors duration-150 hover:bg-sunken">
                <td data-primary className="px-5 py-4">
                  <Link
                    to={`/projects/${project.id}`}
                    className="font-display text-lg font-semibold tracking-tight text-ink decoration-vermilion decoration-2 underline-offset-4 hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td data-label="Client" className="px-3 py-4 text-muted">{project.client}</td>
                <td data-label="Status" className="px-3 py-4"><StatusBadge status={project.status} /></td>
                <td data-label="Owner" className="px-3 py-4">
                  <span className="inline-flex items-center gap-2">
                    <Avatar initials={owner?.initials ?? "??"} size={24} />
                    {owner?.name}
                  </span>
                </td>
                <td data-label="Due" className="num px-3 py-4 whitespace-nowrap">{formatDate(project.due)}</td>
                <td data-label="Budget" className="num px-3 py-4 text-right whitespace-nowrap max-md:text-left">{formatMoney(project.budget)}</td>
                <td data-label="Progress" className="py-4 pr-5 pl-6 md:min-w-40">
                  <span className="flex items-center gap-3">
                    <ProgressBar value={project.progress} status={project.status} className="max-w-32" />
                    <span className="num w-10 shrink-0 text-right font-medium">{project.progress}%</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
