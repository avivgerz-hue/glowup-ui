import { cn } from "./cn.js";

// Scrolls sideways inside its own box on narrow screens, so the page never overflows.
// <Table><thead><tr><Th>Name</Th><Th align="right">Amount</Th></tr></thead><tbody><tr><Td strong>..</Td><Td align="right" num>..</Td></tr></tbody></Table>
export function Table({ className, children, caption }) {
  return (
    <div role="region" aria-label={caption} tabIndex={0} className={cn("overflow-x-auto rounded-card border border-line bg-surface", className)}>
      <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
export function Th({ align, className, children, ...props }) {
  return <th scope="col" className={cn("sticky top-0 whitespace-nowrap border-b border-line bg-sunken px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted", align === "right" && "text-right", className)} {...props}>{children}</th>;
}
export function Td({ align, num, strong, className, children, ...props }) {
  return <td className={cn("border-b border-line/70 px-4 py-3.5", align === "right" && "text-right", num && "num", strong && "font-medium text-ink", className)} {...props}>{children}</td>;
}
