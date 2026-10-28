import { useState } from "react";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Avatar from "../components/Avatar.jsx";
import Icon from "../components/Icon.jsx";
import { members, projects } from "../data.js";

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
    <div className="rise">
      <PageHeader
        title="Team"
        action={<Button onClick={() => setInviteOpen(true)}>Invite member</Button>}
      />

      {invited.length > 0 && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-box border border-success bg-success-soft px-4 py-3 text-sm font-medium text-success-ink">
          <Icon name="check" size={18} />
          Invitation sent to {invited.join(", ")}
        </p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const owned = projects.filter((p) => p.owner === member.id).length;
          return (
            <li key={member.id} className="flex flex-col gap-4 rounded-box border border-ink bg-surface p-5 shadow-lift transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <Avatar initials={member.initials} size={52} />
                <div className="min-w-0">
                  <div className="font-display text-xl font-semibold tracking-tight">{member.name}</div>
                  <div className="text-sm text-muted">{member.role}</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-rule pt-4 text-sm">
                <a href={`mailto:${member.email}`} className="inline-flex min-w-0 items-center gap-2 font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">
                  <Icon name="mail" size={16} />
                  <span className="truncate">{member.email}</span>
                </a>
                {owned > 0 && (
                  <span className="num shrink-0 rounded-full bg-paper-deep px-2.5 py-0.5 text-xs font-semibold" title="Projects owned">
                    {owned} {owned === 1 ? "project" : "projects"}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {inviteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-title"
          className="rise fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-4 backdrop-blur-[2px] sm:items-center"
        >
          <form onSubmit={submit} className="w-full max-w-md rounded-box border border-ink bg-surface p-6 shadow-lift">
            <h2 id="invite-title" className="mb-1 text-2xl">Invite a teammate</h2>
            <label htmlFor="invite-email" className="mt-5 mb-1.5 block text-sm font-medium">Email</label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-6 block min-h-11 w-full rounded-full border border-rule-strong bg-surface px-4 text-sm transition-colors hover:border-ink focus-visible:border-ink"
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Send invite</Button>
              <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
