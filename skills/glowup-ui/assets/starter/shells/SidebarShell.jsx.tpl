import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon.jsx";
import { cn } from "../ui/cn.js";

// App shell: sidebar from lg up, bottom tab bar below. One <nav>, so there is one set of links to keep in sync.
// items: [{ to, label, icon, mobile?: false }]  (keep 5 or fewer for the tab bar; mark the rest mobile: false)
// Restyle freely (rail, tinted, ruled, floating); keep the single nav, skip link, and bottom padding.
export function SidebarShell({ brand, items, footer, header, children }) {
  const link = ({ isActive }) =>
    cn(
      "group relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
      "max-lg:flex-col max-lg:gap-1 max-lg:px-1 max-lg:py-2 max-lg:text-[11px]",
      isActive ? "bg-primary-soft text-primary-ink" : "text-muted hover:bg-sunken hover:text-ink",
    );
  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[16rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">Skip to content</a>
      <aside className="max-lg:contents lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-line lg:bg-surface lg:px-4 lg:py-6">
        <div className="hidden px-3 pb-6 lg:block">{brand}</div>
        <nav aria-label="Main" className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:grid max-lg:auto-cols-fr max-lg:grid-flow-col max-lg:border-t max-lg:border-line max-lg:bg-surface/95 max-lg:px-1 max-lg:pb-[env(safe-area-inset-bottom)] max-lg:backdrop-blur lg:flex lg:flex-col lg:gap-1">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={(s) => cn(link(s), item.mobile === false && "max-lg:hidden")}>
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {footer && <div className="mt-auto hidden px-3 pt-6 lg:block">{footer}</div>}
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 lg:hidden">{brand}</div>
        {header}
        <main id="main" className="mx-auto w-full max-w-[84rem] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}
