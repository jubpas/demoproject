type Props = {
  label: string;
  tone?: "blue" | "green" | "amber" | "red" | "slate" | "success" | "error" | "warning" | "neutral" | "brand";
};

const toneMap: Record<string, string> = {
  blue: "bg-[var(--primary)]/10 text-[var(--primary)]",
  green: "bg-[var(--success)]/10 text-[var(--success)]",
  red: "bg-[var(--error)]/10 text-[var(--error)]",
  slate: "bg-[var(--surface-elevated)] text-[var(--muted)]",
  amber: "bg-amber-400/10 text-amber-400",
  success: "bg-[var(--success)]/10 text-[var(--success)]",
  error: "bg-[var(--error)]/10 text-[var(--error)]",
  warning: "bg-amber-400/10 text-amber-400",
  neutral: "bg-[var(--surface-elevated)] text-[var(--muted)]",
  brand: "bg-[var(--primary)]/10 text-[var(--primary)]",
};

export function StatusBadge({ label, tone = "neutral" }: Props) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneMap[tone]}`}>
      {label}
    </span>
  );
}
