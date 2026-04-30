import type { ReactNode } from "react";
import { signOut } from "@/lib/auth";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavLink } from "@/components/dashboard/nav-link";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function OrganizationLayout({ children, params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, user } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const navItems = [
    { href: `/${validLocale}/org/${orgSlug}/dashboard`, label: messages.nav.dashboard },
    { href: `/${validLocale}/org/${orgSlug}/projects`, label: messages.nav.projects },
    { href: `/${validLocale}/org/${orgSlug}/customers`, label: messages.nav.customers },
    { href: `/${validLocale}/org/${orgSlug}/members`, label: messages.nav.members },
    { href: `/${validLocale}/org/${orgSlug}/reports`, label: messages.nav.reports },
    { href: `/${validLocale}/org/${orgSlug}/survey-appointments`, label: messages.nav.surveyAppointments },
    { href: `/${validLocale}/org/${orgSlug}/quotations`, label: messages.nav.quotations },
    { href: `/${validLocale}/org/${orgSlug}/transactions`, label: messages.nav.transactions },
    { href: `/${validLocale}/org/${orgSlug}/settings`, label: messages.nav.settings },
  ];

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="bg-slate-950 px-5 py-5 lg:flex lg:min-h-screen lg:w-80 lg:shrink-0 lg:flex-col lg:border-r lg:border-white/10 lg:px-6 lg:py-6 xl:w-88">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-blue-300">{messages.common.appName}</p>
              <h1 className="mt-2 text-2xl font-semibold text-white">{organization.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {organization.description || user.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <LanguageSwitcher
                locale={validLocale}
                labels={{ th: messages.common.thai, en: messages.common.english }}
              />
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
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6 lg:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{organization.slug}</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{organization.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
                  {user.name || user.email}
                </div>
                {user.isSuperAdmin ? (
                  <a
                    href={`/${validLocale}/admin`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {messages.nav.admin}
                  </a>
                ) : null}
              </div>
            </div>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
