type Props = {
  label: string;
  value: string;
  tone?: "blue" | "green" | "red" | "slate";
  hint?: string;
};

const toneMap = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function MetricCard({ label, value, tone = "slate", hint }: Props) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneMap[tone]}`}>
        {label}
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </article>
  );
}
