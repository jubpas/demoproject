import type { ReactNode } from "react";
import { signOut } from "@/lib/auth";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavLink } from "@/components/dashboard/nav-link";
import { GlobalSearch } from "@/components/org/global-search";

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
    { href: `/${validLocale}/org/${orgSlug}/worker-teams`, label: messages.nav.workerTeams },
    { href: `/${validLocale}/org/${orgSlug}/work-logs`, label: messages.nav.workLogs },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <GlobalSearch orgSlug={orgSlug} locale={validLocale} />
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="px-5 py-5 lg:flex lg:min-h-screen lg:w-80 lg:shrink-0 lg:flex-col lg:border-r" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[var(--primary)]">{messages.common.appName}</p>
              <h1 className="mt-2 text-2xl font-medium text-[var(--foreground)]">{organization.name}</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
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

          <div className="mt-8 rounded-xl" style={{ border: `1px solid var(--border)`, background: "var(--surface-elevated)" }}>
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
                className="w-full rounded-md border border-[var(--error)]/30 bg-[var(--error)]/12 px-4 py-2.5 font-medium text-[var(--foreground)] transition hover:bg-[var(--error)]/20"
              >
                {messages.common.signOut}
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-8 xl:px-10" style={{ background: "var(--background)" }}>
          <div className="mb-6 rounded-xl border px-5 py-4 sm:px-6 lg:px-7" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--muted)]">{organization.slug}</p>
                <p className="mt-1 text-lg font-medium text-[var(--foreground)]">{organization.name}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-md px-4 py-2 text-sm" style={{ background: "var(--surface-elevated)", color: "var(--muted)" }}>
                  {user.name || user.email}
                </div>
                {user.isSuperAdmin ? (
                  <a
                    href={`/${validLocale}/admin`}
                    className="rounded-md border px-4 py-2 text-sm font-medium transition"
                    style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
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
