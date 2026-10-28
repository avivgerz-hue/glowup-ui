import { NavLink, Outlet } from "react-router";

const links = [
  { to: "/", label: "Overview", end: true },
  { to: "/tickets", label: "Tickets" },
  { to: "/customers", label: "Customers" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  return (
    <div>
      <div className="bg-gray-100 border-b border-gray-300 p-3 flex items-center">
        <b className="mr-6 text-lg">Beacon Helpdesk</b>
        <nav className="flex gap-4">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? "text-blue-700 underline" : "text-blue-600")}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto text-sm">
          Maya Chen | <NavLink to="/login" className="text-blue-600">Log out</NavLink>
        </div>
      </div>
      <div className="p-4">
        <Outlet />
      </div>
    </div>
  );
}
