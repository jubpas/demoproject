import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/auth/login-form";
import { getMessages } from "@/lib/messages";
import { requireLocale } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = await requireLocale(locale);
  const messages = getMessages(validLocale);

  return (
    <main className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl justify-end pb-4">
        <LanguageSwitcher
          locale={validLocale}
          labels={{ th: messages.common.thai, en: messages.common.english }}
        />
      </div>
      <LoginForm locale={validLocale} copy={messages} />
    </main>
  );
}
