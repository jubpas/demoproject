import { NextResponse } from "next/server";
import { PaymentStatus, TransactionType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { ensureOrganizationBudgetCategories } from "@/lib/budget";
import prisma from "@/lib/db";
import { getMembershipByOrgSlug, canWriteTransactions } from "@/lib/organization";
import { saveReceiptFile } from "@/lib/uploads";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseTransactionType(value: string | null | undefined): TransactionType | undefined {
  if (!value) return undefined;
  if (Object.values(TransactionType).includes(value as TransactionType)) {
    return value as TransactionType;
  }
  return undefined;
}

function parsePaymentStatusParam(value: string | null | undefined): PaymentStatus | undefined {
  if (!value) return undefined;
  if (Object.values(PaymentStatus).includes(value as PaymentStatus)) {
    return value as PaymentStatus;
  }
  return undefined;
}

function parseAmountToCents(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const amount = Number(value);
  if (Number.isNaN(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function parseType(value: FormDataEntryValue | null) {
  return value === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE;
}

function parsePaymentStatus(value: FormDataEntryValue | null) {
  return typeof value === "string" && value in PaymentStatus
    ? (value as PaymentStatus)
    : PaymentStatus.PAID;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = typeof searchParams.get("search") === "string" ? searchParams.get("search")! : null;
    const sortBy = (typeof searchParams.get("sortBy") === "string" ? searchParams.get("sortBy")! : "transactionDate") as
      | "transactionDate"
      | "amountInCents"
      | "category";
    const order = (typeof searchParams.get("order") === "string" ? searchParams.get("order")! : "desc") as "asc" | "desc";

    const typeFilter = parseTransactionType(searchParams.get("type"));
    const statusFilter = parsePaymentStatusParam(searchParams.get("paymentStatus"));
    const categoryFilter = typeof searchParams.get("category") === "string" ? searchParams.get("category")!.trim() : null;
    const projectIdFilter = typeof searchParams.get("projectId") === "string" && searchParams.get("projectId")?.trim()
      ? searchParams.get("projectId")
      : null;
    const budgetCategoryIdFilter = typeof searchParams.get("budgetCategoryId") === "string" && searchParams.get("budgetCategoryId")?.trim()
      ? searchParams.get("budgetCategoryId")
      : null;
    const from = parseDate(searchParams.get("from"));
    const to = parseDate(searchParams.get("to"));

    const where: {
      organizationId: string;
      type?: TransactionType;
      paymentStatus?: PaymentStatus;
      category?: { contains: string };
      vendorName?: { contains: string };
      description?: { contains: string };
      projectId?: string | { not: null };
      budgetCategoryId?: string;
      transactionDate?: { gte?: Date; lte?: Date };
    } = {
      organizationId: membership.organizationId,
    };

    if (typeFilter) {
      where.type = typeFilter;
    }

    if (statusFilter) {
      where.paymentStatus = statusFilter;
    }

    if (categoryFilter) {
      where.category = { contains: categoryFilter };
    }

    if (projectIdFilter) {
      where.projectId = projectIdFilter;
    }

    if (budgetCategoryIdFilter) {
      where.budgetCategoryId = budgetCategoryIdFilter;
    }

    if (from || to) {
      where.transactionDate = {};
      if (from) where.transactionDate.gte = from;
      if (to) where.transactionDate.lte = to;
    }

    if (search) {
      if (where.category) {
        where.category.contains += ` ${search}`;
      } else {
        where.category = { contains: search };
      }
      where.vendorName = { contains: search };
      where.description = { contains: search };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { [sortBy]: order },
      include: {
        project: { select: { id: true, name: true, code: true } },
        budgetCategory: { select: { id: true, name: true, colorToken: true } },
        attachments: { select: { id: true, fileName: true, filePath: true, fileType: true, fileSize: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error("List transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Props) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orgSlug } = await params;
    const membership = await getMembershipByOrgSlug(userId, orgSlug);

    if (!membership || !canWriteTransactions(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const budgetCategories = await ensureOrganizationBudgetCategories(membership.organizationId);
    const category = formData.get("category");
    const amountInCents = parseAmountToCents(formData.get("amount"));
    const projectIdValue = formData.get("projectId");
    const projectId = typeof projectIdValue === "string" && projectIdValue.trim() ? projectIdValue : null;
    const budgetCategoryIdValue = formData.get("budgetCategoryId");
    const budgetCategoryId = typeof budgetCategoryIdValue === "string" && budgetCategoryIdValue.trim() ? budgetCategoryIdValue : null;

    if (typeof category !== "string" || !category.trim()) {
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

    const transaction = await prisma.transaction.create({
      data: {
        organizationId: membership.organizationId,
        createdById: userId,
        type: parseType(formData.get("type")),
        paymentStatus: parsePaymentStatus(formData.get("paymentStatus")),
        category: category.trim(),
        budgetCategoryId,
        vendorName: typeof formData.get("vendorName") === "string" ? String(formData.get("vendorName")).trim() || null : null,
        referenceNumber: typeof formData.get("referenceNumber") === "string" ? String(formData.get("referenceNumber")).trim() || null : null,
        amountInCents,
        description: typeof formData.get("description") === "string" ? String(formData.get("description")).trim() || null : null,
        transactionDate:
          typeof formData.get("transactionDate") === "string" && formData.get("transactionDate")
            ? new Date(String(formData.get("transactionDate")))
            : new Date(),
        projectId,
      },
    });

    const receipt = formData.get("receipt");

    if (receipt instanceof File && receipt.size > 0) {
      try {
        const savedFile = await saveReceiptFile({
          file: receipt,
          organizationId: membership.organizationId,
        });

        await prisma.attachment.create({
          data: {
            organizationId: membership.organizationId,
            projectId,
            transactionId: transaction.id,
            uploadedById: userId,
            fileName: savedFile.fileName,
            filePath: savedFile.filePath,
            fileType: savedFile.fileType,
            fileSize: savedFile.fileSize,
          },
        });
      } catch (error) {
        await prisma.transaction.delete({ where: { id: transaction.id } });

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
      entityId: transaction.id,
      action: "CREATE",
      summary: `Created ${transaction.type.toLowerCase()} transaction ${transaction.category}`,
      after: transaction,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
