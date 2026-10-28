import { Link } from "react-router";
import { ErrorArt } from "../components/Illustrations.jsx";

export default function NotFound() {
  return (
    <div className="rise flex flex-col items-start gap-5">
      <ErrorArt />
      <h1 className="text-4xl sm:text-5xl">Page not found</h1>
      <p className="text-muted">Sorry, we couldn't find that page.</p>
      <Link to="/" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover">
        Go to dashboard
      </Link>
    </div>
  );
}
