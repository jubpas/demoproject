import { getMessages } from "@/lib/messages";
import { requireOrganizationAccess, requireLocale } from "@/lib/app-context";
import { getOrganizationSeatSummary } from "@/lib/subscription";

type Props = {
  params: Promise<{ locale: string; orgSlug: string }>;
};

export default async function SettingsPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);

  const messages = getMessages(validLocale);
  const seatSummary = await getOrganizationSeatSummary(organization.id);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Workspace controls</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">{messages.nav.settings}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
          จัดการค่า threshold สำหรับการขออนุมัติงบประมาณขององค์กรนี้ และเตรียมพื้นที่สำหรับการตั้งค่าระดับองค์กรในอนาคต
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-8">
          <h2 className="text-lg font-semibold text-slate-950">{messages.approvalThreshold?.title || "Approval Threshold"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">
            {messages.approvalThreshold?.hint || "รายการที่เกินค่านี้จะถูกสร้างเป็นคำขออนุมัติก่อนบันทึกลงโครงการ"}
          </p>

          <form
            className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end"
            action={`/api/org/${orgSlug}/settings`}
            method="POST"
          >
            <div className="min-w-0">
              <label className="mb-2 block text-xs font-medium text-slate-500">
                {messages.approvalThreshold?.label || "Threshold (THB)"}
              </label>
              <input
                type="number"
                name="approvalThresholdInBaht"
                defaultValue={Math.round(organization.approvalThresholdInCents / 100)}
                min={0}
                step={100}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              {messages.common.save}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-sm font-medium text-blue-200">Current policy</p>
            <p className="mt-4 text-3xl font-semibold">
              {Math.round(organization.approvalThresholdInCents / 100).toLocaleString()} THB
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              ค่าเริ่มต้น: {Math.round(10000000 / 100).toLocaleString()} THB ({messages.approvalThreshold?.unit || "บาท"})
            </p>
          </aside>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{messages.members.currentPlan}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">
              {seatSummary.subscription?.plan.name || messages.members.noSubscription}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              {messages.members.seatsUsed}: {seatSummary.seatLimit === null ? seatSummary.usedSeats : `${seatSummary.usedSeats} / ${seatSummary.seatLimit}`}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              {messages.members.pendingSeats}: {seatSummary.pendingInviteCount}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
