"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Pengguna",
  employees: "Karyawan",
  "master-data": "Data Master",
  "audit-log": "Log Audit",
  create: "Tambah",
  new: "Tambah",
  edit: "Ubah",
};

function getLabel(segment: string): string {
  return segmentLabels[segment] || segment;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-muted-foreground px-4 md:px-6 py-3"
    >
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" />
            {isLast ? (
              <span className="font-medium text-foreground">
                {getLabel(segment)}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground transition-colors"
              >
                {getLabel(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
