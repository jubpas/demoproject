import "server-only";

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import type { OrganizationRole } from "@prisma/client";
import { isSuperAdminAccess } from "./system-access";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

type Membership = {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  createdAt: Date;
  updatedAt: Date;
  organization: Organization;
};

export type OrgAccessResult = {
  membership: Membership;
  organization: Organization;
};

function extractOrgSlugFromRequest(request: NextRequest): { orgSlug: string; error: string | null } {
  const pathname = new URL(request.url).pathname;
  // pathname shape: /api/org/{orgSlug}/...
  const parts = pathname.split("/").filter(Boolean); // ['', 'api', 'org', 'acme', 'work-logs'] -> ['api', 'org', 'acme', 'work-logs']
  
  if (parts.length < 4 || parts[0] !== "api" || parts[1] !== "org") {
    return { orgSlug: "", error: "Invalid route pattern: expected /api/org/{orgSlug}/..." };
  }

  return { orgSlug: parts[2], error: null };
}

export async function requireOrganizationAccess(
  request: NextRequest
): Promise<OrgAccessResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const slugResult = extractOrgSlugFromRequest(request);
  if (slugResult.error) {
    throw new Error("FORBIDDEN");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      organization: {
        slug: slugResult.orgSlug,
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          archivedAt: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("FORBIDDEN");
  }

  if (membership.organization.archivedAt && !isSuperAdminAccess({ email: session.user?.email })) {
    throw new Error("FORBIDDEN");
  }

  return {
    membership,
    organization: membership.organization,
  };
}
