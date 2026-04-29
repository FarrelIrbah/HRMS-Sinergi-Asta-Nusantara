"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Users2,
  Database,
  FileText,
  Menu,
  X,
  Clock,
  CalendarDays,
  ClipboardList,
  CheckSquare,
  BarChart2,
  Banknote,
  Receipt,
  BriefcaseBusiness,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/enums";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Umum",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
    ],
  },
  {
    label: "Manajemen SDM",
    items: [
      {
        label: "Karyawan",
        href: "/employees",
        icon: Users2,
        roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        label: "Rekrutmen",
        href: "/recruitment",
        icon: BriefcaseBusiness,
        roles: ["SUPER_ADMIN", "HR_ADMIN"],
      },
    ],
  },
  {
    label: "Kehadiran & Cuti",
    items: [
      {
        label: "Absensi",
        href: "/attendance",
        icon: Clock,
        roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        label: "Admin Absensi",
        href: "/attendance-admin",
        icon: ClipboardList,
        roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
      },
      {
        label: "Cuti",
        href: "/leave",
        icon: CalendarDays,
        roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
      {
        label: "Kelola Cuti",
        href: "/leave/manage",
        icon: CheckSquare,
        roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"],
      },
      {
        label: "Laporan Cuti",
        href: "/leave/report",
        icon: BarChart2,
        roles: ["SUPER_ADMIN", "HR_ADMIN"],
      },
    ],
  },
  {
    label: "Penggajian",
    items: [
      {
        label: "Penggajian",
        href: "/payroll",
        icon: Banknote,
        roles: ["SUPER_ADMIN", "HR_ADMIN"],
      },
      {
        label: "Slip Gaji",
        href: "/payslip",
        icon: Receipt,
        roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
      },
    ],
  },
  {
    label: "Sistem",
    items: [
      {
        label: "Pengguna",
        href: "/users",
        icon: Users,
        roles: ["SUPER_ADMIN"],
      },
      {
        label: "Data Master",
        href: "/master-data",
        icon: Database,
        roles: ["SUPER_ADMIN"],
      },
      {
        label: "Log Audit",
        href: "/audit-log",
        icon: FileText,
        roles: ["SUPER_ADMIN"],
      },
    ],
  },
];

function getFilteredGroups(role: Role | undefined): NavGroup[] {
  if (!role) return [];
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavGroups({
  groups,
  pathname,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav
      className="flex flex-col gap-5 px-3 py-2"
      aria-label="Menu navigasi utama"
    >
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = isItemActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
                      active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-emerald-500"
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active
                          ? "text-emerald-600"
                          : "text-slate-400 group-hover:text-slate-600",
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function BrandHeader() {
  return (
    <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
        aria-hidden="true"
      >
        <Building2 className="h-5 w-5" />
      </div>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-bold tracking-tight text-slate-900">
          HRMS
        </span>
        <span className="truncate text-[11px] text-slate-500">PT. SAN</span>
      </div>
    </div>
  );
}

function SidebarFooter({ role }: { role: Role | undefined }) {
  const roleLabel =
    role === "SUPER_ADMIN"
      ? "Super Admin"
      : role === "HR_ADMIN"
        ? "HR Admin"
        : role === "MANAGER"
          ? "Manager"
          : role === "EMPLOYEE"
            ? "Karyawan"
            : "—";

  return (
    <div className="border-t border-slate-200 px-5 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        Masuk sebagai
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-700">{roleLabel}</p>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;
  const groups = getFilteredGroups(userRole);

  return (
    <aside
      className="hidden border-r border-slate-200 bg-white md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col"
      aria-label="Sidebar"
    >
      <BrandHeader />
      <ScrollArea className="flex-1">
        <NavGroups groups={groups} pathname={pathname} />
      </ScrollArea>
      <SidebarFooter role={userRole} />
    </aside>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;
  const groups = getFilteredGroups(userRole);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka menu navigasi</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 border-slate-200 bg-white p-0 text-slate-900"
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
              aria-hidden="true"
            >
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight">HRMS</span>
              <span className="text-[11px] text-slate-500">PT. SAN</span>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-slate-900"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-4rem-3.25rem)]">
          <SheetClose asChild>
            <div>
              <NavGroups groups={groups} pathname={pathname} />
            </div>
          </SheetClose>
        </ScrollArea>
        <SidebarFooter role={userRole} />
      </SheetContent>
    </Sheet>
  );
}
