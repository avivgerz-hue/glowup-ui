import { useState } from "react";
import { Link, useParams } from "react-router";
import StatusBadge from "../components/StatusBadge.jsx";
import { projectById, memberById, formatDate, formatMoney } from "../data.js";

export default function ProjectDetail() {
  const { id } = useParams();
  const project = projectById(id);
  const [tasks, setTasks] = useState(project ? project.tasks : []);

  if (!project) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Project not found</h1>
        <p>There is no project with the id “{id}”.</p>
        <Link to="/projects" className="text-blue-600 underline">Back to projects</Link>
      </div>
    );
  }

  const done = tasks.filter((t) => t.done).length;
  const toggle = (taskId) => setTasks((list) => list.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));

  return (
    <div>
      <Link to="/projects" className="text-blue-600 text-sm">← Projects</Link>
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p className="mb-2">
        {project.client} · <StatusBadge status={project.status} />
      </p>

      <table className="mb-4">
        <tbody>
          <tr><td className="pr-4 text-gray-500">Owner</td><td>{memberById(project.owner).name}</td></tr>
          <tr><td className="pr-4 text-gray-500">Due</td><td>{formatDate(project.due)}</td></tr>
          <tr><td className="pr-4 text-gray-500">Budget</td><td>{formatMoney(project.budget)}</td></tr>
          <tr><td className="pr-4 text-gray-500">Progress</td><td>{project.progress}%</td></tr>
        </tbody>
      </table>

      <h2 className="font-bold">Tasks ({done}/{tasks.length} done)</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <label>
              <input type="checkbox" checked={task.done} onChange={() => toggle(task.id)} />{" "}
              <span className={task.done ? "line-through text-gray-400" : ""}>{task.title}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
