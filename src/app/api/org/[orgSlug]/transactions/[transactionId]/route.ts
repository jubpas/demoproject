import { NextResponse } from "next/server";
import { PaymentStatus, TransactionType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import prisma from "@/lib/db";
import {
  canManageOrganizationData,
  canWriteTransactions,
  getMembershipByOrgSlug,
} from "@/lib/organization";
import { deleteLocalFile } from "@/lib/uploads";

type Props = {
  params: Promise<{ orgSlug: string; transactionId: string }>;
};

function parseAmountToCents(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const amount = Number(value);
  if (Number.isNaN(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function parseType(value: unknown) {
  return value === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE;
}

function parsePaymentStatus(value: unknown) {
  return typeof value === "string" && value in PaymentStatus
    ? (value as PaymentStatus)
    : PaymentStatus.PAID;
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, transactionId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canWriteTransactions(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organizationId: membership.organizationId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const body = await request.json();
    const budgetCategories = await ensureOrganizationBudgetCategories(membership.organizationId);
    const category = body?.category?.trim();
    const amountInCents = parseAmountToCents(body?.amount);
    const projectId = typeof body?.projectId === "string" && body.projectId.trim() ? body.projectId : null;
    const budgetCategoryId = typeof body?.budgetCategoryId === "string" && body.budgetCategoryId.trim() ? body.budgetCategoryId : null;

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    if (!amountInCents) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: membership.organizationId },
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 400 });
      }
    }

    if (budgetCategoryId && !budgetCategories.some((item) => item.id === budgetCategoryId)) {
      return NextResponse.json({ error: "Budget category not found" }, { status: 400 });
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: existingTransaction.id },
      data: {
        type: parseType(body?.type),
        paymentStatus: parsePaymentStatus(body?.paymentStatus),
        category,
        budgetCategoryId,
        vendorName: body?.vendorName?.trim() || null,
        referenceNumber: body?.referenceNumber?.trim() || null,
        amountInCents,
        projectId,
        description: body?.description?.trim() || null,
        transactionDate:
          typeof body?.transactionDate === "string" && body.transactionDate
            ? new Date(body.transactionDate)
            : existingTransaction.transactionDate,
      },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorId: userId,
      projectId,
      entityType: "TRANSACTION",
      entityId: updatedTransaction.id,
      action: "UPDATE",
      summary: `Updated transaction ${updatedTransaction.category}`,
      before: existingTransaction,
      after: updatedTransaction,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug, transactionId } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canManageOrganizationData(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        organizationId: membership.organizationId,
      },
      include: {
        attachments: true,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await Promise.all(existingTransaction.attachments.map((item) => deleteLocalFile(item.filePath)));
    await prisma.attachment.deleteMany({
      where: { transactionId: existingTransaction.id },
    });
    await prisma.transaction.delete({
      where: { id: existingTransaction.id },
    });

    await createAuditLog({
      organizationId: membership.organizationId,
      actorId: userId,
      projectId: existingTransaction.projectId,
      entityType: "TRANSACTION",
      entityId: existingTransaction.id,
      action: "DELETE",
      summary: `Deleted transaction ${existingTransaction.category}`,
      before: existingTransaction,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
