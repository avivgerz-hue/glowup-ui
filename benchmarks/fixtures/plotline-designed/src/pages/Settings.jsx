import { useState } from "react";
import Button from "../components/Button.jsx";
import PageHeader from "../components/PageHeader.jsx";
import Icon from "../components/Icon.jsx";

const input =
  "min-h-11 w-full rounded-full border bg-surface px-4 text-sm transition-colors duration-150 hover:border-ink focus-visible:border-ink";

function Section({ title, hint, children }) {
  return (
    <section className="grid gap-6 border-t border-ink py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12">
      <div>
        <h2 className="text-2xl">{title}</h2>
        {hint && <p className="mt-2 text-sm text-muted">{hint}</p>}
      </div>
      <div className="max-w-lg">{children}</div>
    </section>
  );
}

function FieldError({ id, children }) {
  return (
    <div id={id} className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-danger">
      <Icon name="alert" size={16} />
      {children}
    </div>
  );
}

export default function Settings() {
  const [form, setForm] = useState({ name: "Ana Ruiz", email: "ana@plotline.test", digest: "weekly", notifications: true });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  };

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email address.";
    setErrors(next);
    setSaved(Object.keys(next).length === 0);
  };

  return (
    <div className="rise">
      <PageHeader title="Settings" />
      <form onSubmit={submit} noValidate>
        <Section title="Profile" hint="How you appear to the rest of the studio.">
          <div className="mb-5">
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              id="name"
              value={form.name}
              onChange={update("name")}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={`${input} ${errors.name ? "border-danger" : "border-rule-strong"}`}
            />
            {errors.name && <FieldError id="name-error">{errors.name}</FieldError>}
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update("email")}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`${input} ${errors.email ? "border-danger" : "border-rule-strong"}`}
            />
            {errors.email && <FieldError id="email-error">{errors.email}</FieldError>}
          </div>
        </Section>

        <Section title="Notifications" hint="Decide when Plotline gets in touch.">
          <label className="mb-6 flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" className="check" checked={form.notifications} onChange={update("notifications")} />
            <span>Email me when a project is at risk</span>
          </label>
          <label htmlFor="digest" className="mb-1.5 block text-sm font-medium">Activity digest</label>
          <select id="digest" value={form.digest} onChange={update("digest")} className={`${input} cursor-pointer border-rule-strong`}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </select>
        </Section>

        <div className="flex flex-wrap items-center gap-4 border-t border-ink pt-6">
          <Button type="submit">Save changes</Button>
          {saved && (
            <span role="status" className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-sm font-semibold text-success-ink">
              <Icon name="check" size={16} />
              Saved!
            </span>
          )}
        </div>
      </form>

      <section className="mt-12 grid gap-6 rounded-box border border-danger bg-danger-soft/50 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12">
        <h2 className="text-2xl text-danger-ink">Danger zone</h2>
        <div className="max-w-lg">
          <p className="mb-4 text-sm">Deleting your workspace removes all projects and cannot be undone.</p>
          <Button variant="danger" onClick={() => confirm("Delete workspace? This cannot be undone.")}>
            <Icon name="trash" size={16} />
            Delete workspace
          </Button>
        </div>
      </section>
    </div>
  );
}
