import { useState } from "react";
import Button from "../components/Button.jsx";
import { members } from "../data.js";

export default function Team() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [invited, setInvited] = useState([]);

  const submit = (e) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setInvited((list) => [...list, email]);
    setEmail("");
    setInviteOpen(false);
  };

  return (
    <div>
      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-bold">Team</h1>
        <Button className="ml-auto" onClick={() => setInviteOpen(true)}>Invite member</Button>
      </div>

      {invited.length > 0 && (
        <p role="status" className="bg-green-100 p-2 mb-4">Invitation sent to {invited.join(", ")}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {members.map((member) => (
          <div key={member.id} className="border border-gray-300 p-3">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mb-2">{member.initials}</div>
            <div className="font-bold">{member.name}</div>
            <div className="text-sm text-gray-500">{member.role}</div>
            <a href={`mailto:${member.email}`} className="text-sm text-blue-600">{member.email}</a>
          </div>
        ))}
      </div>

      {inviteOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="invite-title" className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <form onSubmit={submit} className="bg-white p-4">
            <h2 id="invite-title" className="font-bold mb-2">Invite a teammate</h2>
            <label htmlFor="invite-email" className="block text-sm">Email</label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-gray-400 p-1 mb-2 block"
            />
            <Button type="submit">Send invite</Button>{" "}
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
          </form>
        </div>
      )}
    </div>
  );
}
