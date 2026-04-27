"use client";

type Props = {
  label: string;
};

export function PrintQuotationButton({ label }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"
    >
      {label}
    </button>
  );
}
