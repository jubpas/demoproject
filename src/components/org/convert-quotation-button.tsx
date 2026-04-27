"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  locale: string;
  orgSlug: string;
  quotationId: string;
  label: string;
  loadingLabel: string;
};

export function ConvertQuotationButton({
  locale,
  orgSlug,
  quotationId,
  label,
  loadingLabel,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/org/${orgSlug}/quotations/${quotationId}/convert-to-project`,
        { method: "POST" },
      );

      await response.json();

      if (!response.ok) {
        setLoading(false);
        return;
      }

      router.push(`/${locale}/org/${orgSlug}/projects`);
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
