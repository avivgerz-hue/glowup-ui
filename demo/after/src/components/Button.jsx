export default function Button({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-primary text-on-primary hover:bg-primary-hover",
    secondary: "bg-surface text-ink border border-rule-strong hover:border-ink hover:bg-sunken",
    danger: "bg-danger-ink text-white hover:bg-ink",
  };
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors duration-150 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
