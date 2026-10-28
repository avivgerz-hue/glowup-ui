import { Link } from "react-router";
import StatusBadge from "./StatusBadge.jsx";
import { memberById, formatDate, formatMoney } from "../data.js";

export default function ProjectTable({ projects }) {
  return (
    <table className="w-full border border-gray-300 text-left">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2">Project</th>
          <th className="p-2">Client</th>
          <th className="p-2">Status</th>
          <th className="p-2">Owner</th>
          <th className="p-2">Due</th>
          <th className="p-2">Budget</th>
          <th className="p-2">Progress</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id} className="border-t border-gray-300">
            <td className="p-2">
              <Link to={`/projects/${project.id}`} className="text-blue-600 underline">
                {project.name}
              </Link>
            </td>
            <td className="p-2">{project.client}</td>
            <td className="p-2"><StatusBadge status={project.status} /></td>
            <td className="p-2">{memberById(project.owner)?.name}</td>
            <td className="p-2">{formatDate(project.due)}</td>
            <td className="p-2">{formatMoney(project.budget)}</td>
            <td className="p-2">{project.progress}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
