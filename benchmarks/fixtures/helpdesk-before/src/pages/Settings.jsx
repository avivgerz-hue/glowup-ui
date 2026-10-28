import { useState } from "react";
import Button from "../components/Button.jsx";

export default function Settings() {
  const [form, setForm] = useState({ name: "Maya Chen", email: "maya@beacon.test", assigned: true, replies: false });
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
          <label htmlFor="name">Name</label><br />
          <input id="name" value={form.name} onChange={update("name")} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} className="border border-gray-400 p-1" />
          {errors.name && <div id="name-error" className="text-red-600 text-sm">{errors.name}</div>}
        </div>
        <div className="mb-4">
          <label htmlFor="email">Email</label><br />
          <input id="email" type="email" value={form.email} onChange={update("email")} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} className="border border-gray-400 p-1" />
          {errors.email && <div id="email-error" className="text-red-600 text-sm">{errors.email}</div>}
        </div>
        <h2 className="font-bold">Notifications</h2>
        <div className="mb-1"><label><input type="checkbox" checked={form.assigned} onChange={update("assigned")} /> Email me when a ticket is assigned to me</label></div>
        <div className="mb-4"><label><input type="checkbox" checked={form.replies} onChange={update("replies")} /> Email me when a customer replies</label></div>
        <Button type="submit">Save changes</Button>
        {saved && <span role="status" className="ml-2 text-green-700">Saved!</span>}
      </form>
      <hr className="my-6" />
      <h2 className="font-bold text-red-600">Danger zone</h2>
      <p className="text-sm mb-2">Deleting your account removes your saved replies and cannot be undone.</p>
      <Button variant="danger" onClick={() => confirm("Delete your account? This cannot be undone.")}>Delete account</Button>
    </div>
  );
}
