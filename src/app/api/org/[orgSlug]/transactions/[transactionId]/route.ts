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
import { deleteLocalFile, saveReceiptFile, validateReceiptFile } from "@/lib/uploads";

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

    const contentType = request.headers.get("content-type") || "";
    const isFormData = contentType.includes("multipart/form-data");
    const body = isFormData ? await request.formData() : await request.json();
    const budgetCategories = await ensureOrganizationBudgetCategories(membership.organizationId);
    const categoryValue = isFormData ? body.get("category") : body?.category;
    const amountValue = isFormData ? body.get("amount") : body?.amount;
    const projectIdValue = isFormData ? body.get("projectId") : body?.projectId;
    const budgetCategoryIdValue = isFormData ? body.get("budgetCategoryId") : body?.budgetCategoryId;
    const paymentStatusValue = isFormData ? body.get("paymentStatus") : body?.paymentStatus;
    const typeValue = isFormData ? body.get("type") : body?.type;
    const vendorNameValue = isFormData ? body.get("vendorName") : body?.vendorName;
    const referenceNumberValue = isFormData ? body.get("referenceNumber") : body?.referenceNumber;
    const descriptionValue = isFormData ? body.get("description") : body?.description;
    const transactionDateValue = isFormData ? body.get("transactionDate") : body?.transactionDate;
    const removeExistingReceiptValue = isFormData ? body.get("removeExistingReceipt") : body?.removeExistingReceipt;
    const receiptValue = isFormData ? body.get("receipt") : null;

    const category = typeof categoryValue === "string" ? categoryValue.trim() : "";
    const amountInCents = parseAmountToCents(amountValue);
    const projectId = typeof projectIdValue === "string" && projectIdValue.trim() ? projectIdValue : null;
    const budgetCategoryId = typeof budgetCategoryIdValue === "string" && budgetCategoryIdValue.trim() ? budgetCategoryIdValue : null;
    const removeExistingReceipt = removeExistingReceiptValue === true || removeExistingReceiptValue === "true";

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
        type: parseType(typeValue),
        paymentStatus: parsePaymentStatus(paymentStatusValue),
        category,
        budgetCategoryId,
        vendorName: typeof vendorNameValue === "string" ? vendorNameValue.trim() || null : null,
        referenceNumber: typeof referenceNumberValue === "string" ? referenceNumberValue.trim() || null : null,
        amountInCents,
        projectId,
        description: typeof descriptionValue === "string" ? descriptionValue.trim() || null : null,
        transactionDate:
          typeof transactionDateValue === "string" && transactionDateValue
            ? new Date(transactionDateValue)
            : existingTransaction.transactionDate,
      },
    });

    const existingAttachments = await prisma.attachment.findMany({
      where: { transactionId: existingTransaction.id },
    });

    if (removeExistingReceipt && existingAttachments.length > 0) {
      await Promise.all(existingAttachments.map((item) => deleteLocalFile(item.filePath)));
      await prisma.attachment.deleteMany({ where: { transactionId: existingTransaction.id } });
    }

    if (receiptValue instanceof File && receiptValue.size > 0) {
      try {
        validateReceiptFile(receiptValue);
        const savedFile = await saveReceiptFile({
          file: receiptValue,
          organizationId: membership.organizationId,
        });

        await prisma.attachment.create({
          data: {
            organizationId: membership.organizationId,
            projectId,
            transactionId: updatedTransaction.id,
            uploadedById: userId,
            fileName: savedFile.fileName,
            filePath: savedFile.filePath,
            fileType: savedFile.fileType,
            fileSize: savedFile.fileSize,
          },
        });
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_FILE_TYPE") {
          return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }

        if (error instanceof Error && error.message === "FILE_TOO_LARGE") {
          return NextResponse.json({ error: "File too large" }, { status: 400 });
        }

        throw error;
      }
    }

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
