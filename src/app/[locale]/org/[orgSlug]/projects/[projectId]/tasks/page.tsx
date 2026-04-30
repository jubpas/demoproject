import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { ProjectTaskManager } from "@/components/org/project-task-manager";
import { getMessages } from "@/lib/messages";
import { requireLocale, requireOrganizationAccess } from "@/lib/app-context";
import { canManageProjectTasks } from "@/lib/organization";

type Props = {
  params: Promise<{ locale: string; orgSlug: string; projectId: string }>;
};

export default async function ProjectTasksPage({ params }: Props) {
  const { locale, orgSlug, projectId } = await params;
  const validLocale = await requireLocale(locale);
  const { organization, membership } = await requireOrganizationAccess(validLocale, orgSlug);
  const messages = getMessages(validLocale);

  const [project, tasks, members] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, organizationId: organization.id },
      select: { id: true, name: true },
    }),
    prisma.projectTask.findMany({
      where: { projectId, organizationId: organization.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.membership.findMany({
      where: { organizationId: organization.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <ProjectTaskManager
      locale={validLocale}
      orgSlug={orgSlug}
      projectId={project.id}
      projectName={project.name}
      tasks={tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedToId: task.assignedToId,
        assignedToName: task.assignedTo?.name || task.assignedTo?.email || null,
        startDate: task.startDate?.toISOString() ?? null,
        dueDate: task.dueDate?.toISOString() ?? null,
        endDate: task.endDate?.toISOString() ?? null,
        progressPercent: task.progressPercent,
        completedAt: task.completedAt?.toISOString() ?? null,
      }))}
      members={members.map((item) => ({ id: item.user.id, name: item.user.name || item.user.email || "User" }))}
      canManage={canManageProjectTasks(membership.role)}
      copy={{ common: messages.common, projects: messages.projects }}
    />
  );
}
