import { statusLabels, priorityLabels } from "../data.js";

const colors = {
  open: "bg-blue-200", pending: "bg-yellow-200", solved: "bg-green-200",
  urgent: "bg-red-300", high: "bg-orange-200", normal: "bg-gray-200", low: "bg-gray-100",
};

export default function Badge({ kind }) {
  return <span className={`px-1 text-xs ${colors[kind]}`}>{statusLabels[kind] || priorityLabels[kind]}</span>;
}
