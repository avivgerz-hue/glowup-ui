import { Link, useParams } from "react-router";
import { serviceById, formatPrice } from "../data.js";

export default function ServiceDetail() {
  const { id } = useParams();
  const service = serviceById(id);
  if (!service) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Service not found</h1>
        <p>We could not find that treatment.</p>
        <Link to="/services" className="text-blue-600 underline">Back to services</Link>
      </div>
    );
  }
  return (
    <div>
      <Link to="/services" className="text-blue-600 text-sm">← Services</Link>
      <h1 className="text-2xl font-bold">{service.name}</h1>
      <p className="text-sm text-gray-500 mb-2">{service.category} · {service.minutes} minutes · {formatPrice(service.price)}</p>
      <p className="mb-4">{service.summary}</p>
      <h2 className="font-bold">What to expect</h2>
      <ul className="list-disc ml-6 mb-4">{service.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
      <Link to={`/book?service=${service.id}`} className="bg-blue-600 text-white px-4 py-2 rounded">Book this treatment</Link>
    </div>
  );
}
