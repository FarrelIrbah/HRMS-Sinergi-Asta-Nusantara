import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LeaveType {
  id: string;
  name: string;
  annualQuota: number;
}

interface Balance {
  leaveTypeId: string;
  allocatedDays: number;
  usedDays: number;
  leaveType: {
    id: string;
    name: string;
    annualQuota: number;
  };
}

interface LeaveBalanceCardProps {
  balances: Balance[];
  leaveTypes: LeaveType[];
}

export function LeaveBalanceCard({
  balances,
  leaveTypes,
}: LeaveBalanceCardProps) {
  const balanceMap = new Map(balances.map((b) => [b.leaveTypeId, b]));

  return (
    <section aria-label={`Saldo cuti ${new Date().getFullYear()}`}>
      <h2 className="mb-3 text-base font-semibold text-slate-900">
        Saldo Cuti {new Date().getFullYear()}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {leaveTypes.map((lt) => {
          const balance = balanceMap.get(lt.id);
          const used = balance?.usedDays ?? 0;
          const allocated = balance?.allocatedDays ?? lt.annualQuota;
          const remaining = Math.max(0, allocated - used);
          const pct =
            allocated > 0
              ? Math.min(100, (used / allocated) * 100)
              : 0;

          // Color based on remaining percentage
          const remainPct = allocated > 0 ? (remaining / allocated) * 100 : 100;
          const progressColor =
            remainPct > 50
              ? "[&>div]:bg-emerald-500"
              : remainPct > 20
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-red-500";

          return (
            <Card key={lt.id} className="border-slate-200 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <p className="line-clamp-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  {lt.name}
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-bold tabular-nums text-slate-900">
                    {remaining}
                  </span>
                  <span className="text-xs tabular-nums text-slate-500">
                    / {allocated} hari
                  </span>
                </div>
                <Progress
                  value={pct}
                  className={`h-1.5 bg-slate-100 ${progressColor}`}
                  aria-label={`${used} dari ${allocated} hari terpakai`}
                />
                <p className="text-xs text-slate-500">
                  {used} hari terpakai
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
