import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProjectScheduleChart } from "@/components/org/project-schedule-chart";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";

type Props = {
  params: Promise<{ locale: string; orgSlug: string; projectId: string }>;
};

export default async function ProjectSchedulePage({ params }: Props) {
  const { locale, orgSlug, projectId } = await params;
  const validLocale = await requireLocale(locale);
  const { organization } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: organization.id },
    include: {
      tasks: {
        include: { assignedTo: { select: { name: true, email: true } } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      surveyAppointments: { orderBy: { scheduledStart: "asc" } },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={messages.projects.scheduleTitle} description={`${project.name} · ${messages.projects.scheduleSubtitle}`} />
      <ProjectScheduleChart
        locale={validLocale}
        project={{
          name: project.name,
          startDate: project.startDate?.toISOString() ?? null,
          endDate: project.endDate?.toISOString() ?? null,
        }}
        tasks={project.tasks.map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignedToName: task.assignedTo?.name || task.assignedTo?.email || null,
          startDate: task.startDate?.toISOString() ?? null,
          dueDate: task.dueDate?.toISOString() ?? null,
          endDate: task.endDate?.toISOString() ?? null,
          progressPercent: task.progressPercent,
        }))}
        appointments={project.surveyAppointments.map((appointment) => ({
          id: appointment.id,
          title: appointment.title,
          status: appointment.status,
          scheduledStart: appointment.scheduledStart.toISOString(),
          scheduledEnd: appointment.scheduledEnd?.toISOString() ?? null,
        }))}
        copy={{ common: messages.common, projects: messages.projects }}
      />
    </div>
  );
}
