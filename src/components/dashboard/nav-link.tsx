"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
};

export function NavLink({ href, label }: Props) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "bg-[var(--primary)] text-[var(--on-primary)]"
          : "text-[var(--muted)] hover:bg-[var(--surface-elevated)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
}
