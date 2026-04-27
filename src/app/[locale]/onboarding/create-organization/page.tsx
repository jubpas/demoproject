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
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl justify-end pb-4">
        <LanguageSwitcher
          locale={validLocale}
          labels={{ th: messages.common.thai, en: messages.common.english }}
        />
      </div>
      <div className="bg-mesh flex min-h-[calc(100vh-5rem)] items-center rounded-[36px] px-3 py-6 sm:px-6">
        <OnboardingForm locale={validLocale} copy={messages} />
      </div>
    </main>
  );
}
