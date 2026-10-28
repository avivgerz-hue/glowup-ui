import { useState } from "react";
import { Link, useParams } from "react-router";
import Badge from "../components/Badge.jsx";
import Button from "../components/Button.jsx";
import { ticketById, customerById, agents, agentById, statusLabels } from "../data.js";

export default function TicketDetail() {
  const { id } = useParams();
  const ticket = ticketById(id);
  const [messages, setMessages] = useState(ticket ? ticket.messages : []);
  const [status, setStatus] = useState(ticket ? ticket.status : "open");
  const [assignee, setAssignee] = useState(ticket ? ticket.assignee : "a1");
  const [reply, setReply] = useState("");

  if (!ticket) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Ticket not found</h1>
        <p>There is no ticket with the id “{id}”.</p>
        <Link to="/tickets" className="text-blue-600 underline">Back to tickets</Link>
      </div>
    );
  }
  const customer = customerById(ticket.customer);
  const send = (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setMessages((list) => [...list, { from: "agent", name: "Maya Chen", at: "Just now", body: reply.trim() }]);
    setReply("");
  };

  return (
    <div>
      <Link to="/tickets" className="text-blue-600 text-sm">← Tickets</Link>
      <h1 className="text-2xl font-bold">{ticket.subject}</h1>
      <p className="mb-4 text-sm">{ticket.id} · {customer.name}, {customer.company} · <Badge kind={status} /> <Badge kind={ticket.priority} /></p>
      <div className="flex gap-6">
        <div className="flex-1">
          <h2 className="font-bold mb-2">Conversation</h2>
          <ul>
            {messages.map((m, i) => (
              <li key={i} className="border-b border-gray-200 py-2">
                <b>{m.name}</b> <span className="text-gray-500 text-sm">{m.at}</span>
                <p>{m.body}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={send} className="mt-4">
            <label htmlFor="reply">Reply</label><br />
            <textarea id="reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} className="border border-gray-400 p-1 w-full" />
            <Button type="submit">Send reply</Button>
          </form>
        </div>
        <div className="w-64">
          <h2 className="font-bold mb-2">Details</h2>
          <div className="mb-2">
            <label htmlFor="ticket-status">Status</label><br />
            <select id="ticket-status" value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-400 p-1">
              {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label htmlFor="assignee">Assignee</label><br />
            <select id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="border border-gray-400 p-1">
              {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <p className="text-sm text-gray-500">Customer: <a href={`mailto:${customer.email}`} className="text-blue-600">{customer.email}</a> ({customer.plan} plan)</p>
          <p className="text-xs text-gray-400">Assigned to {agentById(assignee).name}</p>
        </div>
      </div>
    </div>
  );
}
