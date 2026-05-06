type Props = {
  label: string;
  value: string;
  tone?: "blue" | "green" | "red" | "slate" | "success" | "error" | "warning" | "neutral";
  hint?: string;
  trend?: string;
  trendTone?: "good" | "bad";
};

const toneMap: Record<string, string> = {
  blue: "text-[var(--primary)]",
  green: "text-[var(--success)]",
  red: "text-[var(--error)]",
  slate: "text-[var(--muted)]",
  success: "text-[var(--success)]",
  error: "text-[var(--error)]",
  warning: "text-amber-400",
  neutral: "text-[var(--muted)]",
};

export function MetricCard({ label, value, tone = "neutral", hint, trend, trendTone }: Props) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${toneMap[tone]}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-medium text-[var(--foreground)]">{value}</p>
      {trend ? (
        <p className={`mt-2 text-sm font-medium ${trendTone === "good" ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
          {trend}
        </p>
      ) : hint ? (
        <p className="mt-2 text-sm text-[var(--muted)]">{hint}</p>
      ) : null}
    </article>
  );
}
