import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Role } from "@/types/enums";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import {
  getDocumentById,
  deleteDocument,
} from "@/lib/services/employee-document.service";

type RouteParams = { params: Promise<{ id: string; docId: string }> };

/**
 * Check if a user can access an employee's documents based on their role.
 * - HR_ADMIN/SUPER_ADMIN: can access any
 * - MANAGER: can access employees in their department
 * - EMPLOYEE: can access only their own documents
 */
async function canAccessEmployeeDocuments(
  userId: string,
  userRole: string,
  employeeId: string
): Promise<boolean> {
  if (
    userRole === Role.HR_ADMIN ||
    userRole === Role.SUPER_ADMIN
  ) {
    return true;
  }

  if (userRole === Role.MANAGER) {
    // Check if the manager and the target employee share a department
    const managerEmployee = await prisma.employee.findUnique({
      where: { userId },
      select: { departmentId: true },
    });

    if (!managerEmployee) return false;

    const targetEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { departmentId: true },
    });

    if (!targetEmployee) return false;

    return managerEmployee.departmentId === targetEmployee.departmentId;
  }

  if (userRole === Role.EMPLOYEE) {
    // Check if the employee record belongs to this user
    const employee = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });
    return employee?.id === employeeId;
  }

  return false;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: employeeId, docId } = await params;

    // Role-based access check
    const hasAccess = await canAccessEmployeeDocuments(
      session.user.id,
      session.user.role as string,
      employeeId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Look up document
    const document = await getDocumentById(docId);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Verify document belongs to the specified employee
    if (document.employeeId !== employeeId) {
      return NextResponse.json(
        { success: false, error: "Document not found" },
        { status: 404 }
      );
    }

    // Read file from disk
    const absolutePath = path.join(process.cwd(), document.filePath);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(absolutePath);
    } catch {
      return NextResponse.json(
        { success: false, error: "File not found on disk" },
        { status: 404 }
      );
    }

    // Return file with appropriate headers
    return new Response(new Uint8Array(fileBuffer), {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${document.fileName}"`,
        "Content-Length": String(document.fileSize),
      },
    });
  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { docId } = await params;

    // Delete document (handles both DB record and filesystem)
    await deleteDocument(docId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
