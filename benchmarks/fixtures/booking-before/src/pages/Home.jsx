import { Link } from "react-router";
import ServiceCard from "../components/ServiceCard.jsx";
import { services } from "../data.js";

export default function Home() {
  const featured = services.filter((s) => ["deep-tissue", "hydrating-facial", "tide-ritual"].includes(s.id));
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Rest by the sea</h1>
      <p className="mb-4">Massage, facials, and body treatments in a quiet harbor-side space. Book online in under a minute.</p>
      <Link to="/book" className="bg-blue-600 text-white px-4 py-2 rounded">Book a treatment</Link>
      <h2 className="text-xl font-bold mt-8 mb-2">Popular treatments</h2>
      <div className="grid grid-cols-3 gap-2">
        {featured.map((s) => <ServiceCard key={s.id} service={s} />)}
      </div>
      <p className="mt-2"><Link to="/services" className="text-blue-600">See all services →</Link></p>
      <h2 className="text-xl font-bold mt-8 mb-2">How it works</h2>
      <ol className="list-decimal ml-6">
        <li>Choose a treatment</li>
        <li>Pick a date and time</li>
        <li>Tell us who is coming and confirm</li>
      </ol>
    </div>
  );
}
