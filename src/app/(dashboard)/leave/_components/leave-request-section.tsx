"use client";

import { useState } from "react";
import { LeaveRequestForm } from "./leave-request-form";
import { LeaveTypeInfoPanel } from "./leave-type-info-panel";

interface LeaveType {
  id: string;
  name: string;
  annualQuota: number;
  isPaid: boolean;
  genderRestriction: string | null;
}

interface Balance {
  leaveTypeId: string;
  allocatedDays: number;
  usedDays: number;
  leaveType: { id: string; name: string };
}

interface LeaveRequestSectionProps {
  leaveTypes: LeaveType[];
  balances: Balance[];
}

export function LeaveRequestSection({
  leaveTypes,
  balances,
}: LeaveRequestSectionProps) {
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <LeaveRequestForm
          leaveTypes={leaveTypes}
          balances={balances}
          onLeaveTypeChange={setSelectedLeaveTypeId}
        />
      </div>
      <div className="lg:col-span-2">
        <LeaveTypeInfoPanel
          leaveTypes={leaveTypes}
          balances={balances}
          selectedLeaveTypeId={selectedLeaveTypeId}
        />
      </div>
    </div>
  );
}
