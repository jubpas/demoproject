import type { ReactNode } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavLink } from "@/components/dashboard/nav-link";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireSuperAdmin } from "@/lib/app-context";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  const validLocale = await requireLocale(locale);
  const user = await requireSuperAdmin(validLocale);
  const messages = getMessages(validLocale);

  const navItems = [
    { href: `/${validLocale}/admin`, label: messages.admin.dashboardTitle },
    { href: `/${validLocale}/admin/organizations`, label: messages.admin.organizationsTitle },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="px-5 py-5 lg:flex lg:min-h-screen lg:w-80 lg:shrink-0 lg:flex-col lg:border-r" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">{messages.common.appName}</p>
              <h1 className="mt-2 text-2xl font-medium text-[var(--foreground)]">Super Admin</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{user.email}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LanguageSwitcher locale={validLocale} labels={{ th: messages.common.thai, en: messages.common.english }} />
              <Link href={`/${validLocale}`} className="rounded-md border px-4 py-3 text-sm font-medium transition" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                {messages.common.backToHome}
              </Link>
            </div>
          </div>

          <nav className="mt-8 grid gap-2">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="mt-8 rounded-xl" style={{ border: `1px solid var(--border)`, background: "var(--surface)" }}>
            <p className="font-medium text-[var(--foreground)]">{user.name || user.email}</p>
            <p className="mt-1 break-all text-[var(--muted)]">{user.email}</p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: `/${validLocale}/login` });
              }}
              className="mt-4"
            >
              <button
                type="submit"
                className="w-full rounded-md border border-[var(--error)]/30 bg-[var(--error)]/12 px-4 py-2.5 font-medium text-red-300 transition hover:bg-[var(--error)]/20"
              >
                {messages.common.signOut}
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8 xl:px-10" style={{ background: "var(--background)" }}>
          {children}
        </section>
      </div>
    </main>
  );
}
