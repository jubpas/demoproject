import { redirect } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { getCurrentUser, requireLocale } from "@/lib/app-context";
import { getMessages } from "@/lib/messages";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CreateOrganizationPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = await requireLocale(locale);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${validLocale}/login`);
  }

  const messages = getMessages(validLocale);

  return (
    <main className="min-h-screen overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
      <div className="flex justify-end pb-3 sm:pb-4">
        <LanguageSwitcher
          locale={validLocale}
          labels={{ th: messages.common.thai, en: messages.common.english }}
        />
      </div>
      <div className="bg-mesh flex min-h-[calc(100vh-5.25rem)] items-stretch rounded-[32px] border border-white/10 px-3 py-3 shadow-[0_28px_120px_rgba(2,6,23,0.45)] sm:rounded-[40px] sm:px-5 sm:py-5 lg:min-h-[calc(100vh-6rem)] lg:px-6 lg:py-6">
        <OnboardingForm locale={validLocale} copy={messages} />
      </div>
    </main>
  );
}
