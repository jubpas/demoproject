import "server-only";

import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const maxFileSize = 5 * 1024 * 1024;

function getExtension(fileName: string, mimeType: string) {
  const fromName = path.extname(fileName).toLowerCase();
  if (fromName) {
    return fromName;
  }

  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return "";
  }
}

export function validateReceiptFile(file: File) {
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("INVALID_FILE_TYPE");
  }

  if (file.size > maxFileSize) {
    throw new Error("FILE_TOO_LARGE");
  }
}

export async function saveReceiptFile(params: {
  file: File;
  organizationId: string;
}) {
  const { file, organizationId } = params;
  validateReceiptFile(file);

  const extension = getExtension(file.name, file.type);
  const fileName = `receipt-${Date.now()}-${crypto.randomUUID()}${extension}`;
  const relativeDirectory = path.join("uploads", "organizations", organizationId, "receipts");
  const absoluteDirectory = path.join(process.cwd(), "public", relativeDirectory);

  await mkdir(absoluteDirectory, { recursive: true });

  const absolutePath = path.join(absoluteDirectory, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    fileName,
    filePath: `/${relativeDirectory.replace(/\\/g, "/")}/${fileName}`,
    fileType: file.type,
    fileSize: file.size,
  };
}

export async function deleteLocalFile(filePath: string) {
  const normalizedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  const absolutePath = path.join(process.cwd(), "public", normalizedPath);

  try {
    await unlink(absolutePath);
  } catch {
    return;
  }
}
