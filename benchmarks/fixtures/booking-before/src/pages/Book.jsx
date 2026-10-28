import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Button from "../components/Button.jsx";
import { services, serviceById, slotsFor, formatPrice } from "../data.js";
import { saveBooking } from "../booking.js";

const STEPS = ["Service", "Date & time", "Your details"];

export default function Book() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(serviceById(params.get("service")) ? params.get("service") : "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [details, setDetails] = useState({ name: "", email: "", phone: "", notes: "" });
  const [error, setError] = useState("");
  const service = serviceById(serviceId);

  const next = () => {
    if (step === 0 && !serviceId) return setError("Please choose a service.");
    if (step === 1 && (!date || !time)) return setError("Please choose a date and a time.");
    setError("");
    setStep(step + 1);
  };
  const confirm = (e) => {
    e.preventDefault();
    if (!details.name.trim()) return setError("Please enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) return setError("Please enter a valid email address.");
    saveBooking({ serviceId, date, time, ...details });
    navigate("/confirmation");
  };
  const set = (field) => (e) => setDetails((d) => ({ ...d, [field]: e.target.value }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Book a treatment</h1>
      <p className="mb-4 text-sm">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      {error && <p role="alert" className="text-red-600 mb-2">{error}</p>}
      <div className="flex gap-6">
        <form onSubmit={confirm} noValidate className="flex-1">
          {step === 0 && (
            <fieldset>
              <legend className="font-bold mb-2">Choose a service</legend>
              {services.map((s) => (
                <div key={s.id}>
                  <label><input type="radio" name="service" value={s.id} checked={serviceId === s.id} onChange={() => setServiceId(s.id)} /> {s.name} ({s.minutes} min, {formatPrice(s.price)})</label>
                </div>
              ))}
            </fieldset>
          )}
          {step === 1 && (
            <div>
              <label htmlFor="date" className="font-bold">Date</label><br />
              <input id="date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="border border-gray-400 p-1 mb-4" />
              {date && (
                <fieldset>
                  <legend className="font-bold mb-2">Available times</legend>
                  {slotsFor(date).map((slot) => (
                    <label key={slot.time} className="block">
                      <input type="radio" name="time" value={slot.time} disabled={!slot.available} checked={time === slot.time} onChange={() => setTime(slot.time)} /> {slot.time}{!slot.available && " (unavailable)"}
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
          )}
          {step === 2 && (
            <div>
              <div className="mb-2"><label htmlFor="name">Name</label><br /><input id="name" value={details.name} onChange={set("name")} className="border border-gray-400 p-1" /></div>
              <div className="mb-2"><label htmlFor="email">Email</label><br /><input id="email" type="email" value={details.email} onChange={set("email")} className="border border-gray-400 p-1" /></div>
              <div className="mb-2"><label htmlFor="phone">Phone (optional)</label><br /><input id="phone" value={details.phone} onChange={set("phone")} className="border border-gray-400 p-1" /></div>
              <div className="mb-2"><label htmlFor="notes">Notes (optional)</label><br /><textarea id="notes" rows={3} value={details.notes} onChange={set("notes")} className="border border-gray-400 p-1" /></div>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            {step > 0 && <Button type="button" variant="secondary" onClick={() => { setError(""); setStep(step - 1); }}>Back</Button>}
            {step < STEPS.length - 1 && <Button type="button" onClick={next}>Next</Button>}
            {step === STEPS.length - 1 && <Button type="submit">Confirm booking</Button>}
          </div>
        </form>
        <aside className="w-64 border border-gray-300 p-3 text-sm h-fit" aria-label="Booking summary">
          <h2 className="font-bold mb-1">Your booking</h2>
          <p>{service ? service.name : "No service chosen yet"}</p>
          {service && <p>{service.minutes} min · {formatPrice(service.price)}</p>}
          {date && <p>{date}{time && ` at ${time}`}</p>}
        </aside>
      </div>
    </div>
  );
}
