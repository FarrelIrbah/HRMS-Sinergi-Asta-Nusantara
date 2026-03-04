import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/enums";
import { DocumentType } from "@/generated/prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createDocumentRecord } from "@/lib/services/employee-document.service";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const VALID_DOCUMENT_TYPES = Object.values(DocumentType);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = session.user.role as string;
    if (userRole !== Role.HR_ADMIN && userRole !== Role.SUPER_ADMIN) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id: employeeId } = await params;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string | null;

    // Validate file exists
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "File is required" },
        { status: 400 }
      );
    }

    // Validate mime type
    if (
      !ALLOWED_MIME_TYPES.includes(
        file.type as (typeof ALLOWED_MIME_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only PDF, JPEG, and PNG files are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    // Validate documentType
    if (
      !documentType ||
      !VALID_DOCUMENT_TYPES.includes(documentType as DocumentType)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid document type." },
        { status: 400 }
      );
    }

    // Create upload directory
    const uploadDir = path.join(
      process.cwd(),
      "uploads",
      "employees",
      employeeId
    );
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename (sanitize original name)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(uploadDir, uniqueFileName);
    const relativeFilePath = path.join(
      "uploads",
      "employees",
      employeeId,
      uniqueFileName
    );

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Create DB record
    const document = await createDocumentRecord({
      employeeId,
      documentType: documentType as DocumentType,
      fileName: file.name,
      filePath: relativeFilePath,
      fileSize: file.size,
      mimeType: file.type,
      actorId: session.user.id,
    });

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
