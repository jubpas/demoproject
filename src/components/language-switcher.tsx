"use client";

import { useRouter, usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/locales";

type Props = {
  locale: Locale;
  labels: {
    th: string;
    en: string;
  };
};

export function LanguageSwitcher({ locale, labels }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(nextLocale: Locale) {
    if (!pathname) {
      router.push(`/${nextLocale}`);
      return;
    }

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      router.push(`/${nextLocale}`);
      return;
    }

    if (locales.includes(segments[0] as Locale)) {
      segments[0] = nextLocale;
      router.push(`/${segments.join("/")}`);
      return;
    }

    router.push(`/${nextLocale}${pathname}`);
  }

  return (
    <div className="inline-flex rounded-full border border-white/12 bg-white/6 p-1 text-xs font-medium text-slate-200">
      {locales.map((item) => {
        const active = item === locale;

        return (
          <button
            key={item}
            type="button"
            onClick={() => switchLocale(item)}
            className={`rounded-full px-3 py-1.5 transition ${
              active
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item === "th" ? labels.th : labels.en}
          </button>
        );
      })}
    </div>
  );
}
