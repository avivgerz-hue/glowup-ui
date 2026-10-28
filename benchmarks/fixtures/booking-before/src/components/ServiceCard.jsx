import { Link } from "react-router";
import { formatPrice } from "../data.js";

export default function ServiceCard({ service }) {
  return (
    <div className="border border-gray-300 p-3">
      <div className="text-xs text-gray-500">{service.category}</div>
      <h3 className="font-bold"><Link to={`/services/${service.id}`} className="text-blue-600 underline">{service.name}</Link></h3>
      <p className="text-sm">{service.summary}</p>
      <p className="text-sm mt-1">{service.minutes} min · {formatPrice(service.price)}</p>
    </div>
  );
}
