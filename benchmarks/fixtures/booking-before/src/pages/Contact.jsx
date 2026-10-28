import { useState } from "react";
import Button from "../components/Button.jsx";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const set = (f) => (e) => setForm((v) => ({ ...v, [f]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return setError("Please fill in your name and message.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Please enter a valid email address.");
    setError(""); setSent(true);
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Contact us</h1>
      <p className="mb-4">18 Harbor Street, Port Hallow · (555) 014-2290 · hello@saltwaterspa.test</p>
      {sent ? <p role="status" className="bg-green-100 p-2">Thanks, {form.name}. We will reply within one business day.</p> : (
        <form onSubmit={submit} noValidate>
          {error && <p role="alert" className="text-red-600 mb-2">{error}</p>}
          <div className="mb-2"><label htmlFor="c-name">Name</label><br /><input id="c-name" value={form.name} onChange={set("name")} className="border border-gray-400 p-1" /></div>
          <div className="mb-2"><label htmlFor="c-email">Email</label><br /><input id="c-email" type="email" value={form.email} onChange={set("email")} className="border border-gray-400 p-1" /></div>
          <div className="mb-2"><label htmlFor="c-message">Message</label><br /><textarea id="c-message" rows={4} value={form.message} onChange={set("message")} className="border border-gray-400 p-1" /></div>
          <Button type="submit">Send message</Button>
        </form>
      )}
    </div>
  );
}
