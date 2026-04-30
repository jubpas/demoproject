import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/auth/login-form";
import { getMessages } from "@/lib/messages";
import { requireLocale } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; reset?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { callbackUrl, reset } = await searchParams;
  const validLocale = await requireLocale(locale);
  const messages = getMessages(validLocale);

  return (
    <main className="min-h-screen overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="flex justify-end pb-3 sm:pb-4">
        <LanguageSwitcher
          locale={validLocale}
          labels={{ th: messages.common.thai, en: messages.common.english }}
        />
      </div>
      <LoginForm
        locale={validLocale}
        callbackUrl={callbackUrl}
        resetSuccess={reset === "success"}
        copy={messages}
      />
    </main>
  );
}
