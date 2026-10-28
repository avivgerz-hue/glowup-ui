export default function StatCard({ label, value, hint }) {
  return (
    <div role="group" aria-label={label} className="border border-gray-300 p-3">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="text-xs text-gray-400">{hint}</div>}
    </div>
  );
}
