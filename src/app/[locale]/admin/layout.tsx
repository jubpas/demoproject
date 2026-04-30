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
    <main className="min-h-screen bg-slate-950">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="bg-slate-950 px-5 py-5 lg:flex lg:min-h-screen lg:w-80 lg:shrink-0 lg:flex-col lg:border-r lg:border-white/10 lg:px-6 lg:py-6 xl:w-88">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-blue-300">{messages.common.appName}</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">Super Admin</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">{user.email}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LanguageSwitcher locale={validLocale} labels={{ th: messages.common.thai, en: messages.common.english }} />
              <Link href={`/${validLocale}`} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/8 hover:text-white">
                {messages.common.backToHome}
              </Link>
            </div>
          </div>

          <nav className="mt-8 grid gap-2">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/6 p-4 text-sm text-slate-300 lg:mt-auto">
            <p className="font-medium text-white">{user.name || user.email}</p>
            <p className="mt-1 break-all text-slate-400">{user.email}</p>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: `/${validLocale}/login` });
              }}
              className="mt-4"
            >
              <button
                type="submit"
                className="w-full rounded-2xl border border-red-400/30 bg-red-500/12 px-4 py-2.5 font-medium text-red-100 transition hover:bg-red-500/20"
              >
                {messages.common.signOut}
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0 flex-1 bg-slate-100 px-4 py-4 text-slate-950 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
          {children}
        </section>
      </div>
    </main>
  );
}
