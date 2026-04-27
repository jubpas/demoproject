type Props = {
  label: string;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
};

const styles = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function StatusBadge({ label, tone = "slate" }: Props) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[tone]}`}>
      {label}
    </span>
  );
}
