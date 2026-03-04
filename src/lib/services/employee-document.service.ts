import { prisma, createAuditLog } from "@/lib/prisma";
import { AuditAction, DocumentType } from "@/generated/prisma/client";
import { MODULES } from "@/lib/constants";
import { unlink } from "fs/promises";
import path from "path";

// ─── Queries ────────────────────────────────────────────────────────

export async function getDocumentsByEmployeeId(employeeId: string) {
  return prisma.employeeDocument.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocumentById(docId: string) {
  return prisma.employeeDocument.findUnique({
    where: { id: docId },
  });
}

// ─── Mutations ──────────────────────────────────────────────────────

export async function createDocumentRecord(data: {
  employeeId: string;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  actorId: string;
}) {
  const document = await prisma.employeeDocument.create({
    data: {
      employeeId: data.employeeId,
      documentType: data.documentType,
      fileName: data.fileName,
      filePath: data.filePath,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
    },
  });

  await createAuditLog({
    userId: data.actorId,
    action: AuditAction.CREATE,
    module: MODULES.EMPLOYEE_DOCUMENT,
    targetId: document.id,
    newValue: {
      employeeId: data.employeeId,
      documentType: data.documentType,
      fileName: data.fileName,
      fileSize: data.fileSize,
    },
  });

  return document;
}

export async function deleteDocument(docId: string, actorId: string) {
  const document = await prisma.employeeDocument.findUnique({
    where: { id: docId },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Delete file from filesystem
  const absolutePath = path.join(process.cwd(), document.filePath);
  try {
    await unlink(absolutePath);
  } catch {
    // File may already be deleted from disk; continue with DB cleanup
  }

  // Delete DB record
  await prisma.employeeDocument.delete({
    where: { id: docId },
  });

  await createAuditLog({
    userId: actorId,
    action: AuditAction.DELETE,
    module: MODULES.EMPLOYEE_DOCUMENT,
    targetId: docId,
    oldValue: {
      employeeId: document.employeeId,
      documentType: document.documentType,
      fileName: document.fileName,
      fileSize: document.fileSize,
    },
  });
}
