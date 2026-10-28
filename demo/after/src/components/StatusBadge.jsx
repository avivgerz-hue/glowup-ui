import { statusLabels } from "../data.js";
import Icon from "./Icon.jsx";

const styles = {
  active: { cls: "bg-success-soft text-success-ink", icon: "pulse" },
  "at-risk": { cls: "bg-danger-soft text-danger-ink", icon: "alert" },
  completed: { cls: "bg-paper-deep text-ink", icon: "check" },
  paused: { cls: "bg-warning-soft text-warning-ink", icon: "pause" },
};

export default function StatusBadge({ status }) {
  const s = styles[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full py-0.5 pr-2.5 pl-2 text-xs font-semibold whitespace-nowrap ${s.cls}`}>
      <Icon name={s.icon} size={13} strokeWidth={2.2} />
      {statusLabels[status]}
    </span>
  );
}

export const statusColor = {
  active: "#036f37",
  "at-risk": "#c73833",
  completed: "#5d584b",
  paused: "#9e650a",
};
