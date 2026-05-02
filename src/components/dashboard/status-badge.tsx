type Props = {
  label: string;
  tone?: "blue" | "green" | "amber" | "red" | "slate" | "success" | "error" | "warning" | "neutral" | "brand";
};

const toneMap: Record<string, string> = {
  blue: "text-[var(--primary)]",
  green: "text-[var(--success)]",
  red: "text-[var(--error)]",
  slate: "text-[var(--muted)]",
  amber: "text-amber-400",
  success: "text-[var(--success)]",
  error: "text-[var(--error)]",
  warning: "text-amber-400",
  neutral: "text-[var(--muted)]",
  brand: "text-[var(--primary)]",
};

export function StatusBadge({ label, tone = "neutral" }: Props) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneMap[tone]}`}>
      {label}
    </span>
  );
}
