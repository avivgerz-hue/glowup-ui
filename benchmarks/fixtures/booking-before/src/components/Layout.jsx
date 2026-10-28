import { Link, NavLink, Outlet } from "react-router";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Layout() {
  return (
    <div>
      <div className="bg-gray-100 border-b border-gray-300 p-3 flex items-center">
        <Link to="/" className="mr-6 text-lg font-bold">Saltwater Spa</Link>
        <nav className="flex gap-4">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "text-blue-700 underline" : "text-blue-600")}>{l.label}</NavLink>
          ))}
        </nav>
        <Link to="/book" className="ml-auto bg-blue-600 text-white px-3 py-1 rounded">Book now</Link>
      </div>
      <div className="p-4">
        <Outlet />
      </div>
      <div className="border-t border-gray-300 p-4 text-sm text-gray-500">
        Saltwater Spa · 18 Harbor Street, Port Hallow · Open daily 9am–6pm · (555) 014-2290
      </div>
    </div>
  );
}
