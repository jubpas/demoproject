import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveBudgetApprovalRequest } from "@/lib/approvals";
import prisma from "@/lib/db";
import { canApproveBudgetRequests, getMembershipByOrgSlug } from "@/lib/organization";

type Props = {
  params: Promise<{ orgSlug: string; requestId: string }>;
};

export async function POST(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, requestId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canApproveBudgetRequests(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const approvalRequest = await prisma.approvalRequest.findFirst({
      where: {
        id: requestId,
        organizationId: membership.organizationId,
      },
    });

    if (!approvalRequest) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    if (approvalRequest.status !== "PENDING") {
      return NextResponse.json({ error: "Approval request already processed" }, { status: 400 });
    }

    await approveBudgetApprovalRequest(approvalRequest, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve approval request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
