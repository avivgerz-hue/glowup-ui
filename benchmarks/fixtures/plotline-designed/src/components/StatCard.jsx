import Icon from "./Icon.jsx";

export default function StatCard({ label, value, hint, icon, tone = "ink" }) {
  const toneCls = tone === "danger" ? "text-danger" : "text-ink";
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-1 px-5 py-4 first:pl-0 sm:py-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        {icon && <Icon name={icon} size={16} className={tone === "danger" ? "text-danger" : "text-faint"} />}
        {label}
      </div>
      <div className={`display-num num text-4xl ${toneCls}`}>{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}
