import { Link } from "react-router-dom";
import { cn } from "./cn.js";
import { Card } from "./Card.jsx";
import { Icon } from "./Icon.jsx";
import { Sparkline } from "./Charts.jsx";
import { Contours } from "./Motifs.jsx";

// Page-level building blocks, so each page is data plus a few of these instead of 200 lines of markup. They carry the structure
// (hierarchy, spacing, responsive behavior, semantics); the direction's tokens carry the look. Restyle freely: wrap, reorder, or
// copy one into the page and change it when the direction calls for something different. Do not keep them untouched on every page.

/** Marketing or home hero: eyebrow, headline, body, actions on the left; art on the right (stacks on mobile). */
export function Hero({ eyebrow, title, body, actions, art, className }) {
  return (
    <section className={cn("relative isolate overflow-hidden", className)}>
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-20">
        <div>
          {eyebrow && <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-accent-ink">{eyebrow}</p>}
          <h1 className="text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.02]">{title}</h1>
          {body && <p className="mt-5 max-w-prose text-lg text-muted">{body}</p>}
          {actions && <div className="mt-7 flex flex-wrap gap-3">{actions}</div>}
        </div>
        {art && <div className="relative mx-auto w-full max-w-md">{art}</div>}
      </div>
    </section>
  );
}

/** Split sign-in: brand panel (statement, motif) beside the form. `panel` is the left content; children are the form. */
export function AuthSplit({ brand, panel, children, footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative isolate hidden flex-col justify-between overflow-hidden bg-primary p-10 text-on-primary lg:flex">
        <Contours className="-z-10 text-on-primary opacity-15" />
        <div className="font-display text-xl">{brand}</div>
        <div className="max-w-md font-display text-4xl leading-tight">{panel}</div>
        <div className="text-sm opacity-80">{footer}</div>
      </aside>
      <main id="main" className="grid place-items-center bg-canvas px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 font-display text-xl lg:hidden">{brand}</div>
          {children}
        </div>
      </main>
    </div>
  );
}

/** Settings or form section: label and explanation on the left, fields on the right (stacks on mobile). Danger zones: tone="danger". */
export function Section({ title, description, children, tone, className }) {
  return (
    <section className={cn("grid gap-4 border-t border-line py-8 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-10", tone === "danger" && "rounded-card border border-bad/30 bg-bad-soft/40 px-5", className)}>
      <div>
        <h2 className={cn("text-lg font-semibold", tone === "danger" && "text-bad-ink")}>{title}</h2>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

/** One figure with context. `hero` makes it the focal point (double width, display type). `data` adds a sparkline. */
export function Stat({ label, value, delta, deltaTone = "ok", hint, data, hero, className }) {
  const tones = { ok: "text-ok-ink", bad: "text-bad-ink", muted: "text-muted" };
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className={cn("num mt-1 font-display leading-none", hero ? "text-5xl sm:text-6xl" : "text-3xl")}>{value}</p>
      {(delta || hint) && <p className="mt-2 text-sm"><span className={cn("font-medium", tones[deltaTone])}>{delta}</span> <span className="text-muted">{hint}</span></p>}
      {data && <Sparkline data={data} className="mt-3" width={hero ? 220 : 140} height={hero ? 48 : 34} />}
    </div>
  );
}

/** Ruled strip of stats (one hero, the rest smaller). Replaces a row of equal cards. */
export function StatStrip({ children, className }) {
  return <div className={cn("grid gap-6 rounded-card border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr] lg:gap-0 lg:divide-x lg:divide-line sm:p-6 [&>*]:lg:px-6 [&>*:first-child]:lg:pl-0", className)}>{children}</div>;
}

/** Detail page frame: identity header on top, main content left, sticky details rail right. */
export function DetailLayout({ back, header, aside, children }) {
  return (
    <div>
      {back && <Link to={back.to} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="arrow-left" size={16} />{back.label}</Link>}
      {header}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">{children}</div>
        {aside && <aside className="lg:sticky lg:top-6 lg:self-start"><Card>{aside}</Card></aside>}
      </div>
    </div>
  );
}

/** Search and filter row above a table or grid. Put the primary action in PageHeader, not here. */
export function Toolbar({ children, count }) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">{children}</div>
      {count != null && <p className="text-sm text-muted" aria-live="polite">{count}</p>}
    </div>
  );
}

/** Catalog tile: art on top (an ArtTile or image), then name, meta line, and price right under. */
export function TileCard({ to, title, meta, price, badge, art, className }) {
  return (
    <Link to={to} className={cn("group block min-w-0 rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus", className)}>
      <div className="relative overflow-hidden rounded-card transition-transform duration-200 group-hover:-translate-y-0.5">
        {art}
        {badge && <span className="absolute left-3 top-3 rounded-pill bg-surface/95 px-2.5 py-1 text-xs font-medium text-ink shadow-card">{badge}</span>}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="truncate text-base font-semibold group-hover:underline">{title}</h3>
        {price && <p className="num shrink-0 font-medium">{price}</p>}
      </div>
      {meta && <p className="text-sm text-muted">{meta}</p>}
    </Link>
  );
}

/** Step indicator for checkout and booking. steps: ["Service", "Time", "Details"]; current: 0-based index. */
export function Stepper({ steps, current }) {
  return (
    <ol className="mb-8 flex gap-2 sm:gap-4" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined} className="min-w-0 flex-1">
          <div className={cn("h-1 rounded-pill", i <= current ? "bg-primary" : "bg-line")} />
          <p className={cn("mt-2 truncate text-xs font-medium uppercase tracking-[0.08em]", i === current ? "text-ink" : "text-muted")}><span className="num">{i + 1}</span> {s}</p>
        </li>
      ))}
    </ol>
  );
}

/** Order or booking summary rail. rows: [{ label, value }]; total: { label, value }; action: a Button or Link. */
export function SummaryRail({ title, rows = [], total, action, note, className }) {
  return (
    <Card className={cn("lg:sticky lg:top-6", className)} as="aside" aria-label={title}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="mt-4 space-y-2.5 text-sm">
        {rows.map((r) => <div key={r.label} className="flex justify-between gap-4"><dt className="text-muted">{r.label}</dt><dd className="num">{r.value}</dd></div>)}
      </dl>
      {total && <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4"><span className="font-medium">{total.label}</span><span className="num font-display text-2xl">{total.value}</span></div>}
      {action && <div className="mt-5 [&>*]:w-full">{action}</div>}
      {note && <p className="mt-3 text-xs text-muted">{note}</p>}
    </Card>
  );
}

/** Real footer: brand and one line on the left, link columns right, a small print row. columns: [{ title, links: [{ to, label }] }]. */
export function SiteFooter({ brand, blurb, columns = [], small, className }) {
  return (
    <footer className={cn("mt-20 border-t border-line bg-sunken", className)}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div><div className="font-display text-xl">{brand}</div>{blurb && <p className="mt-3 max-w-xs text-sm text-muted">{blurb}</p>}</div>
        {columns.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{c.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">{c.links.map((l) => <li key={l.label}>{l.to ? <Link to={l.to} className="hover:underline">{l.label}</Link> : <span>{l.label}</span>}</li>)}</ul>
          </nav>
        ))}
      </div>
      {small && <div className="border-t border-line px-4 py-4 text-center text-xs text-muted sm:px-6">{small}</div>}
    </footer>
  );
}
