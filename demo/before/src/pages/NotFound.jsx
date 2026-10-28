import { Link } from "react-router";

export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p>Sorry, we couldn't find that page.</p>
      <Link to="/" className="text-blue-600 underline">Go to dashboard</Link>
    </div>
  );
}
