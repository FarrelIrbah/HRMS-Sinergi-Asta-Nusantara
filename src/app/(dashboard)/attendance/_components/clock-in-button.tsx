"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clockInAction,
  clockOutAction,
} from "@/lib/actions/attendance.actions";

interface ClockInButtonProps {
  isClockedIn: boolean;
}

export function ClockInButton({ isClockedIn }: ClockInButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [verifyingLocation, setVerifyingLocation] = useState(false);

  async function handleClock() {
    setVerifyingLocation(true);
    const action = isClockedIn ? clockOutAction : clockInAction;

    if (!navigator.geolocation) {
      setVerifyingLocation(false);
      startTransition(async () => {
        const result = await action(undefined);
        if (result.success) {
          toast.success(
            isClockedIn
              ? "Absen pulang berhasil dicatat"
              : "Absen masuk berhasil dicatat"
          );
        } else {
          toast.error(result.error ?? "Gagal mencatat absen");
        }
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVerifyingLocation(false);
        startTransition(async () => {
          const result = await action({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          if (result.success) {
            toast.success(
              isClockedIn
                ? "Absen pulang berhasil dicatat"
                : "Absen masuk berhasil dicatat"
            );
          } else {
            toast.error(result.error ?? "Gagal mencatat absen");
          }
        });
      },
      () => {
        setVerifyingLocation(false);
        startTransition(async () => {
          const result = await action(undefined);
          if (result.success) {
            toast.success(
              isClockedIn
                ? "Absen pulang berhasil dicatat"
                : "Absen masuk berhasil dicatat"
            );
          } else {
            toast.error(result.error ?? "Gagal mencatat absen");
          }
        });
      },
      { timeout: 8000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }

  const isLoading = verifyingLocation || isPending;
  const label = verifyingLocation
    ? "Memverifikasi lokasi..."
    : isPending
      ? "Memproses..."
      : isClockedIn
        ? "Absen Pulang"
        : "Absen Masuk";

  return (
    <Button
      size="lg"
      variant={isClockedIn ? "outline" : "default"}
      onClick={handleClock}
      disabled={isLoading}
      className={`w-full gap-2 sm:w-auto min-w-[180px] h-12 text-sm font-semibold ${
        !isClockedIn
          ? "bg-emerald-600 hover:bg-emerald-700"
          : ""
      }`}
      aria-label={isClockedIn ? "Absen pulang" : "Absen masuk"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : isClockedIn ? (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      ) : (
        <LogIn className="h-4 w-4" aria-hidden="true" />
      )}
      {label}
    </Button>
  );
}
