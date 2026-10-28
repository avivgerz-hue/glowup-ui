import { statusLabels } from "../data.js";

const colors = {
  active: "bg-green-200",
  "at-risk": "bg-red-200",
  completed: "bg-gray-200",
  paused: "bg-yellow-200",
};

export default function StatusBadge({ status }) {
  return <span className={`px-1 text-xs ${colors[status]}`}>{statusLabels[status]}</span>;
}
