import { useState } from "react";
import Button from "../components/Button.jsx";

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
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <form onSubmit={submit} noValidate>
        <h2 className="font-bold">Profile</h2>
        <div className="mb-2">
          <label htmlFor="name">Name</label>
          <br />
          <input
            id="name"
            value={form.name}
            onChange={update("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="border border-gray-400 p-1"
          />
          {errors.name && <div id="name-error" className="text-red-600 text-sm">{errors.name}</div>}
        </div>
        <div className="mb-4">
          <label htmlFor="email">Email</label>
          <br />
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={update("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="border border-gray-400 p-1"
          />
          {errors.email && <div id="email-error" className="text-red-600 text-sm">{errors.email}</div>}
        </div>

        <h2 className="font-bold">Notifications</h2>
        <div className="mb-2">
          <label>
            <input type="checkbox" checked={form.notifications} onChange={update("notifications")} /> Email me when a project is at risk
          </label>
        </div>
        <div className="mb-4">
          <label htmlFor="digest">Activity digest</label>
          <br />
          <select id="digest" value={form.digest} onChange={update("digest")} className="border border-gray-400 p-1">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </select>
        </div>

        <Button type="submit">Save changes</Button>
        {saved && <span role="status" className="ml-2 text-green-700">Saved!</span>}
      </form>

      <hr className="my-6" />
      <h2 className="font-bold text-red-600">Danger zone</h2>
      <p className="text-sm mb-2">Deleting your workspace removes all projects and cannot be undone.</p>
      <Button variant="danger" onClick={() => confirm("Delete workspace? This cannot be undone.")}>Delete workspace</Button>
    </div>
  );
}
