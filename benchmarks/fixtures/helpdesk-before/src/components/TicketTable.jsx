import { Link } from "react-router";
import Badge from "./Badge.jsx";
import { customerById, agentById, formatDate } from "../data.js";

export default function TicketTable({ tickets }) {
  return (
    <table className="w-full border border-gray-300 text-left">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2">Ticket</th>
          <th className="p-2">Customer</th>
          <th className="p-2">Status</th>
          <th className="p-2">Priority</th>
          <th className="p-2">Assignee</th>
          <th className="p-2">Updated</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((t) => (
          <tr key={t.id} className="border-t border-gray-300">
            <td className="p-2">
              <Link to={`/tickets/${t.id}`} className="text-blue-600 underline">{t.subject}</Link>
              <div className="text-xs text-gray-500">{t.id}</div>
            </td>
            <td className="p-2">{customerById(t.customer).name}</td>
            <td className="p-2"><Badge kind={t.status} /></td>
            <td className="p-2"><Badge kind={t.priority} /></td>
            <td className="p-2">{agentById(t.assignee).name}</td>
            <td className="p-2">{formatDate(t.updated)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
