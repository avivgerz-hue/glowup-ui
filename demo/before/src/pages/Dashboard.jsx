import { Link } from "react-router";
import StatCard from "../components/StatCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { projects, activity, memberById, projectById, formatMoney } from "../data.js";

export default function Dashboard() {
  const active = projects.filter((p) => p.status === "active").length;
  const atRisk = projects.filter((p) => p.status === "at-risk");
  const openTasks = projects.flatMap((p) => p.tasks).filter((t) => !t.done).length;
  const pipeline = projects.filter((p) => p.status !== "completed").reduce((sum, p) => sum + p.budget, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="mb-4">Welcome back, Ana. Here is what is happening at the studio.</p>

      <div className="grid grid-cols-4 gap-2 mb-6">
        <StatCard label="Active projects" value={active} />
        <StatCard label="At risk" value={atRisk.length} hint="Needs attention" />
        <StatCard label="Open tasks" value={openTasks} />
        <StatCard label="Pipeline" value={formatMoney(pipeline)} hint="Excludes completed work" />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <h2 className="font-bold mb-2">Recent activity</h2>
          <ul>
            {activity.map((item) => (
              <li key={item.id} className="border-b border-gray-200 py-2">
                <b>{memberById(item.who).name}</b> {item.what}{" "}
                <Link to={`/projects/${item.project}`} className="text-blue-600 underline">
                  {projectById(item.project).name}
                </Link>{" "}
                <span className="text-gray-400 text-sm">{item.when}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/3">
          <h2 className="font-bold mb-2">Needs attention</h2>
          {atRisk.map((project) => (
            <div key={project.id} className="border border-red-300 p-2 mb-2">
              <Link to={`/projects/${project.id}`} className="text-blue-600 underline">{project.name}</Link>{" "}
              <StatusBadge status={project.status} />
              <div className="text-sm">{project.progress}% complete</div>
            </div>
          ))}
          <Link to="/projects" className="text-blue-600">View all projects →</Link>
        </div>
      </div>
    </div>
  );
}
