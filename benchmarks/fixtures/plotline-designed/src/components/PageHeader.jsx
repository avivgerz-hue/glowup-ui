// Shared page title block: ruled top edge, display title, optional lede and action.
export default function PageHeader({ title, lede, action, kicker }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 md:mb-10">
      <div className="min-w-0 max-w-2xl">
        {kicker}
        <h1 className="text-4xl sm:text-5xl">{title}</h1>
        {lede && <p className="mt-3 max-w-prose text-base text-muted">{lede}</p>}
      </div>
      {action}
    </div>
  );
}
