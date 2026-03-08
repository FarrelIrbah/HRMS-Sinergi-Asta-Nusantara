import { type DocumentProps } from "@react-pdf/renderer";
import { renderToStream } from "@react-pdf/renderer";
import React, { type JSXElementConstructor, type ReactElement } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OfferLetterDocument } from "@/lib/pdf/offer-letter-pdf";

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const role = session.user.role;
  if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const { candidateId } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: { vacancy: { include: { department: true } } },
  });

  if (!candidate) return new Response("Candidate not found", { status: 404 });

  if (candidate.stage !== "DITERIMA") {
    return new Response("Candidate not in DITERIMA stage", { status: 400 });
  }

  if (!candidate.offerSalary) {
    return new Response("Offer salary not set", { status: 400 });
  }

  const data = {
    candidateName: candidate.name,
    position: candidate.vacancy.title,
    department: candidate.vacancy.department.name,
    offerSalary: Number(candidate.offerSalary),
    offerNotes: candidate.offerNotes,
    generatedDate: new Date().toISOString(),
  };

  const safeFileName = `surat-penawaran-${candidate.name.replace(/\s+/g, "-")}.pdf`;

  try {
    const element = React.createElement(
      OfferLetterDocument,
      { data }
    ) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>;

    const stream = await renderToStream(element);

    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
      },
    });
  } catch (err) {
    console.error("[offer-letter-route] PDF generation failed:", err);
    return new Response(
      `Gagal menghasilkan PDF: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 500 }
    );
  }
}
