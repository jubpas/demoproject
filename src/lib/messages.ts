import en from "@/messages/en";
import th from "@/messages/th";
import type { Locale } from "@/lib/locales";

const messages = {
  en,
  th,
} as const;

export function getMessages(locale: Locale) {
  return messages[locale];
}
