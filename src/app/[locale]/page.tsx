import { redirect } from "next/navigation";
import { getHomeRedirectPath, requireLocale } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocalizedHomePage({ params }: Props) {
  const { locale } = await params;
  const validLocale = await requireLocale(locale);

  redirect(await getHomeRedirectPath(validLocale));
}
