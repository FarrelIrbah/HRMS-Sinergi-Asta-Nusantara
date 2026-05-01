"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertCircle,
  Building2,
  CalendarDays,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Receipt,
  ShieldCheck,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email atau password salah")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Email atau password salah")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <BrandPanel />

      <main className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:bg-white lg:px-12">
        <div className="w-full max-w-md">
          <MobileBrand />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:border-0 lg:p-0 lg:shadow-none">
            <div className="mb-6 space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
                Selamat datang kembali
              </h1>
              <p className="text-sm text-slate-500">
                Masuk dengan akun PT. SAN Anda untuk melanjutkan.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <div
                  role="alert"
                  aria-live="polite"
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700",
                    error ? "" : "hidden",
                  )}
                >
                  <AlertCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <Input
                            type="email"
                            placeholder="nama@ptsan.co.id"
                            autoComplete="email"
                            inputMode="email"
                            disabled={isLoading}
                            className="h-11 pl-10 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock
                            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                            aria-hidden="true"
                          />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="h-11 pl-10 pr-11 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-0"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            disabled={isLoading}
                            aria-label={
                              showPassword
                                ? "Sembunyikan password"
                                : "Tampilkan password"
                            }
                            aria-pressed={showPassword}
                            className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    "Masuk"
                  )}
                </button>
              </form>
            </Form>

            <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
              <ShieldCheck
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <p>
                Akses sistem ini terbatas untuk karyawan terdaftar PT. SAN. Lupa
                password? Hubungi tim HR.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function MobileBrand() {
  return (
    <div className="mb-8 flex items-center gap-3 lg:hidden">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm"
        aria-hidden="true"
      >
        <Building2 className="h-5 w-5" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight text-slate-900">
          HRMS
        </span>
        <span className="text-[11px] text-slate-500">
          PT. Sinergi Asta Nusantara
        </span>
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <aside
      aria-label="Tentang HRMS PT. SAN"
      className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 lg:flex lg:flex-col"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-emerald-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl"
      />

      <div className="relative flex flex-1 flex-col justify-between p-12 xl:p-16">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm"
            aria-hidden="true"
          >
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-white">
              HRMS
            </span>
            <span className="text-xs text-emerald-50/80">
              PT. Sinergi Asta Nusantara
            </span>
          </div>
        </div>

        <div className="max-w-md">
          <h2 className="text-balance text-[2.25rem] font-bold leading-[1.1] tracking-tight text-white xl:text-[2.5rem]">
            Kelola SDM perusahaan dengan lebih cerdas.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-50/85">
            Satu platform terpadu untuk kehadiran, cuti, penggajian, dan
            rekrutmen — dirancang khusus untuk PT. SAN.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-emerald-50">
            <FeatureItem
              icon={Clock}
              label="Absensi real-time dengan validasi lokasi"
            />
            <FeatureItem
              icon={CalendarDays}
              label="Pengajuan cuti & izin yang ringkas"
            />
            <FeatureItem
              icon={Receipt}
              label="Slip gaji digital, tersedia kapan saja"
            />
          </ul>
        </div>

        <p className="text-xs text-emerald-50/60">
          © {new Date().getFullYear()} PT. Sinergi Asta Nusantara · Sistem
          internal
        </p>
      </div>
    </aside>
  )
}

function FeatureItem({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-md bg-white/15 ring-1 ring-white/20"
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5 text-white" />
      </span>
      <span>{label}</span>
    </li>
  )
}
