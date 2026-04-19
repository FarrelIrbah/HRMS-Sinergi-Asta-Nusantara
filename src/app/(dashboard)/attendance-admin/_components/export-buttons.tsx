"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonsProps {
  month: number;
  year: number;
}

export function ExportButtons({ month, year }: ExportButtonsProps) {
  const baseUrl = `/api/attendance/export?month=${month}&year=${year}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-slate-200 bg-white text-sm"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Ekspor
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`${baseUrl}&format=xlsx`} download>
            Excel (.xlsx)
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${baseUrl}&format=pdf`} download>
            PDF
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
