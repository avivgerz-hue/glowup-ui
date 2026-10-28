import { NavLink, Outlet } from "react-router";
import Icon, { LogoMark } from "./Icon.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true, icon: "dashboard" },
  { to: "/projects", label: "Projects", icon: "projects" },
  { to: "/team", label: "Team", icon: "team" },
  { to: "/settings", label: "Settings", icon: "settings" },
];

export default function Layout() {
  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-ink bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 text-ink">
            <LogoMark size={28} />
            <b className="font-display text-xl font-semibold tracking-tight">Plotline</b>
          </div>

          <nav
            className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-ink bg-paper px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:static md:ml-8 md:flex md:gap-1 md:border-0 md:bg-transparent md:p-0"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `group relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md px-3 text-xs font-medium transition-colors duration-150 md:min-h-10 md:flex-row md:gap-2 md:rounded-full md:text-sm ${
                    isActive
                      ? "text-ink md:bg-ink md:text-paper"
                      : "text-muted hover:text-ink md:hover:bg-paper-deep"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={link.icon} size={20} className={isActive ? "text-vermilion md:text-paper" : ""} />
                    {link.label}
                    {isActive && <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-vermilion md:hidden" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden items-center gap-2 font-medium sm:flex">
              <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-ink ring-1 ring-ink/10">
                AR
              </span>
              Ana Ruiz
            </span>
            <span className="font-medium sm:hidden sr-only">Ana Ruiz</span>
            <NavLink
              to="/login"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-rule-strong px-3 text-muted transition-colors hover:border-ink hover:text-ink"
            >
              <Icon name="logout" size={16} />
              <span className="max-sm:sr-only">Log out</span>
            </NavLink>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
