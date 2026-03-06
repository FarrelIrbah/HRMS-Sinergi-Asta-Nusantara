import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function LeaveBalanceCard({ balances, leaveTypes }: LeaveBalanceCardProps) {
  const balanceMap = new Map(balances.map((b) => [b.leaveTypeId, b]));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Saldo Cuti {new Date().getFullYear()}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {leaveTypes.map((lt) => {
          const balance = balanceMap.get(lt.id);
          const used = balance?.usedDays ?? 0;
          const allocated = balance?.allocatedDays ?? lt.annualQuota;
          const remaining = Math.max(0, allocated - used);
          const pct = allocated > 0 ? Math.min(100, (used / allocated) * 100) : 0;

          return (
            <Card key={lt.id}>
              <CardHeader className="pb-1 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground line-clamp-1">
                  {lt.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-2xl font-bold">{remaining}</span>
                  <span className="text-xs text-muted-foreground">/ {allocated} hari</span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{used} hari terpakai</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
