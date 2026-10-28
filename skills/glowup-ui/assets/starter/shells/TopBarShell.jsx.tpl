import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Icon } from "../ui/Icon.jsx";
import { cn } from "../ui/cn.js";

// Top-bar shell for marketing, store, booking, and editorial products. One <nav>; below md it opens as a menu panel.
// items: [{ to, label }]; actions: right-side nodes (cart link, CTA); footer: a real footer, not a copyright line.
export function TopBarShell({ brand, items, actions, footer, children, width = "max-w-6xl" }) {
  const [open, setOpen] = useState(false);
  const link = ({ isActive }) => cn("rounded-control px-3 py-2 text-sm font-medium transition-colors", isActive ? "text-ink underline decoration-primary decoration-2 underline-offset-8" : "text-muted hover:text-ink");
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">Skip to content</a>
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur">
        <div className={cn("mx-auto flex h-16 items-center gap-6 px-4 sm:px-6", width)}>
          <div className="shrink-0">{brand}</div>
          <nav aria-label="Main" id="site-nav" className={cn("md:flex md:flex-1 md:items-center md:gap-1", open ? "absolute inset-x-0 top-16 flex flex-col gap-1 border-b border-line bg-canvas p-3 shadow-pop md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none" : "hidden")}>
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className={link} onClick={() => setOpen(false)}>{item.label}</NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {actions}
            <button type="button" className="grid size-11 place-content-center rounded-control hover:bg-sunken md:hidden" aria-expanded={open} aria-controls="site-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)}>
              <Icon name={open ? "x" : "menu"} size={22} />
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">{children ?? <Outlet />}</main>
      {footer}
    </div>
  );
}
