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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/enums";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Karyawan",
    href: "/employees",
    icon: Users2,
    roles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "EMPLOYEE"],
  },
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
];

function getFilteredNavItems(role: Role | undefined): NavItem[] {
  if (!role) return [];
  return navItems.filter((item) => item.roles.includes(role));
}

function NavLinks({
  items,
  pathname,
  onClick,
}: {
  items: NavItem[];
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-700 text-white"
                : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;
  const items = getFilteredNavItems(userRole);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-slate-900 text-white">
      <div className="flex h-16 items-center px-6 border-b border-slate-700">
        <span className="text-lg font-bold tracking-tight">
          HRMS PT. SAN
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks items={items} pathname={pathname} />
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;
  const items = getFilteredNavItems(userRole);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-slate-900 p-0 text-white border-slate-700">
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-700">
          <span className="text-lg font-bold tracking-tight">
            HRMS PT. SAN
          </span>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </div>
        <div className="py-4">
          <SheetClose asChild>
            <div>
              <NavLinks items={items} pathname={pathname} />
            </div>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
