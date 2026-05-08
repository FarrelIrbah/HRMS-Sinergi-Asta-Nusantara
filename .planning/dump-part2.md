# DUMP PART 2 — HRMS PT. Sinergi Asta Nusantara

Dokumentasi referensi untuk skripsi BAB 4-5: Pages/Routes, Role & Access Control, Middleware & Auth.

---

## 3. Pages/Routes

Aplikasi menggunakan **Next.js App Router** dengan dua route group: `(auth)` untuk halaman publik (login) dan `(dashboard)` untuk halaman terproteksi yang memerlukan autentikasi. Route group dengan tanda kurung `(...)` tidak ikut menjadi bagian dari URL path — hanya berfungsi untuk mengelompokkan layout.

### 3.1 Root & Auth Group

#### 3.1.1 `/` — Root Redirect

| Aspek | Nilai |
|---|---|
| URL Path | `/` |
| Nama File | `src/app/page.tsx` |
| Komponen Utama | `redirect` dari `next/navigation` |
| Akses Role | (semua — non-authenticated juga) |
| Tipe | Server Component |

Halaman root tidak merender UI apa pun; hanya memanggil `redirect("/login")` untuk mengarahkan pengguna ke halaman login. Ini adalah halaman entry-point sederhana yang memastikan setiap akses ke domain tanpa path akan dipindahkan ke `/login`.

#### 3.1.2 Root Layout (`src/app/layout.tsx`)

| Aspek | Nilai |
|---|---|
| Nama File | `src/app/layout.tsx` |
| Komponen Utama | `AuthSessionProvider`, `NuqsAdapter`, `Toaster` |
| Tipe | Server Component (membungkus client provider) |

Root layout meng-define:
- Font lokal `GeistVF` dan `GeistMonoVF` via `next/font/local`.
- Metadata `title` = "HRMS PT. Sinergi Asta Nusantara", `description` = "Sistem Manajemen Sumber Daya Manusia".
- Bahasa HTML `id` (Indonesia).
- Wrapper urutan: `<AuthSessionProvider>` (NextAuth client-side session) → `<NuqsAdapter>` (URL state management) → children + `<Toaster />` (sonner notifications).

#### 3.1.3 Auth Layout (`src/app/(auth)/layout.tsx`)

| Aspek | Nilai |
|---|---|
| URL Path | (berlaku untuk semua child di group `(auth)`) |
| Nama File | `src/app/(auth)/layout.tsx` |
| Komponen Utama | div wrapper minimal |
| Akses Role | Public (tidak ada auth check) |
| Tipe | Server Component |

Layout sangat tipis: hanya `<div className="min-h-dvh bg-white">{children}</div>`. Tidak ada sidebar, header, atau auth gate — sesuai untuk halaman login yang harus dapat diakses tanpa session.

#### 3.1.4 `/login` — Halaman Login

| Aspek | Nilai |
|---|---|
| URL Path | `/login` |
| Nama File | `src/app/(auth)/login/page.tsx` |
| Komponen Utama | `Form`, `FormField`, `FormControl`, `FormMessage` (shadcn/react-hook-form), `Input`, `BrandPanel`, `MobileBrand`, `FeatureItem` |
| Library | `react-hook-form` + `@hookform/resolvers/zod`, `next-auth/react` (`signIn`), `lucide-react` icons |
| Akses Role | Public |
| Tipe | **Client Component** (`"use client"`) |

Halaman login menggunakan layout split-screen dua kolom (`grid lg:grid-cols-[1.05fr_1fr]`):
- Kolom kiri (`BrandPanel`): branding hijau emerald dengan gradient, daftar fitur (Absensi, Cuti, Slip Gaji), hanya tampil di `lg`.
- Kolom kanan: form login dengan field email + password (toggle show/hide), tombol submit dengan loading state.

Form di-validate via Zod schema `loginSchema` (dari `@/lib/validations/auth`). Submit memanggil `signIn("credentials", { email, password, redirect: false })` dari NextAuth, lalu pada sukses memanggil `router.push("/dashboard")` + `router.refresh()`. Error dikomunikasikan dengan banner role=alert "Email atau password salah".

### 3.2 Dashboard Group

#### 3.2.1 Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

| Aspek | Nilai |
|---|---|
| Nama File | `src/app/(dashboard)/layout.tsx` |
| Komponen Utama | `Sidebar`, `Header`, `Breadcrumbs`, `SessionProvider` (wrapper) |
| Akses Role | Authenticated only (semua role) |
| Tipe | Server Component (async) — memanggil `auth()` |

Layout ini adalah **gerbang autentikasi tingkat dua** (selain middleware). Logikanya:

```ts
const session = await auth();
if (!session) {
  redirect("/login");
}
```

Struktur DOM: `<SessionProvider>` (client wrapper untuk `useSession`) → flex container fullscreen → `<Sidebar />` (fixed kiri di md+) → kolom kanan dengan `<Header />`, `<Breadcrumbs />`, dan `<main>` scrollable berisi `{children}`. Semua halaman di group `(dashboard)/` mewarisi struktur ini.

#### 3.2.2 `/dashboard` — Dashboard

| Aspek | Nilai |
|---|---|
| URL Path | `/dashboard` |
| Nama File | `src/app/(dashboard)/dashboard/page.tsx` |
| Komponen Utama | `SuperAdminDashboard`, `HRAdminDashboard`, `ManagerDashboard`, `EmployeeDashboard` (di-render kondisional per role) |
| Service | `getSuperAdminDashboardData`, `getHrAdminDashboardData`, `getManagerDashboardData`, `getEmployeeDashboardData` (dari `@/lib/services/dashboard.service`) |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE (semua) |
| Tipe | Server Component (async) |

Page-level check: `if (!session?.user) redirect("/login")`. Lalu switch berdasarkan `session.user.role` untuk merender komponen dashboard yang berbeda — masing-masing menerima data yang sudah dipre-fetch di server.

#### 3.2.3 `/attendance` — Absensi (self-service)

| Aspek | Nilai |
|---|---|
| URL Path | `/attendance` |
| Nama File | `src/app/(dashboard)/attendance/page.tsx` |
| Komponen Utama | `SummaryTile`, `AttendanceToday`, `AttendanceHistory` |
| Service | `getTodayRecord`, `getWeeklySummary`, `getEmployeeAttendance` (`@/lib/services/attendance.service`) |
| Akses Role | Semua role yang ber-Employee profile (SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE) |
| Tipe | Server Component (async) |

Page-level check: `if (!session?.user) redirect("/login")`. Selanjutnya mencari `prisma.employee.findUnique({ where: { userId: session.user.id }})`. Jika tidak ada profil employee, ditampilkan empty state (tetap render, tidak redirect). Halaman menampilkan 5 KPI tile (status hari ini, hadir minggu ini, terlambat, rata-rata jam, lembur), card clock-in/out hari ini + kalender mingguan, dan tabel riwayat 7 hari terakhir.

#### 3.2.4 `/attendance-admin` — Admin Absensi

| Aspek | Nilai |
|---|---|
| URL Path | `/attendance-admin` |
| Nama File | `src/app/(dashboard)/attendance-admin/page.tsx` |
| Komponen Utama | `AttendanceFilters`, `AttendanceSummaryTable`, `ManualRecordDialog`, `ExportButtons`, `SummaryTile` |
| Service | `getMonthlyAttendanceRecap` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER |
| Tipe | Server Component (async) |

Page-level role check yang jelas:

```ts
if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) {
  redirect("/attendance");
}
```

Untuk MANAGER, query ditambahkan filter `departmentId` dari profil employee si manager — sehingga manager hanya melihat data departemen sendiri. Untuk HR/Super-Admin, melihat seluruh perusahaan dan mendapat tombol tambahan: `ManualRecordDialog` (input absensi manual) dan `ExportButtons` (Excel/CSV). Variabel `isHRAdmin = ["HR_ADMIN", "SUPER_ADMIN"].includes(role)` mengontrol kemunculan tombol-tombol tersebut.

#### 3.2.5 `/attendance-admin/[employeeId]` — Detail Absensi Karyawan

| Aspek | Nilai |
|---|---|
| URL Path | `/attendance-admin/[employeeId]` |
| Nama File | `src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx` |
| Komponen Utama | `SummaryTile`, `AttendanceStatusBadges`, `AttendanceFilters`, `Table`, `Card`, `Badge`, `Button` |
| Service | `getMonthlyAttendanceRecap` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER (manager hanya departemen sendiri) |
| Tipe | Server Component (async) |

Selain role check umum yang sama dengan parent, halaman ini menambahkan **scope check khusus untuk MANAGER**: jika `managerEmployee.departmentId !== employee.departmentId`, redirect ke `/attendance-admin`. Halaman menampilkan rekap bulanan satu karyawan dengan KPI tiles (hari hadir, terlambat, rata-rata, total lembur) dan tabel detail per tanggal.

#### 3.2.6 `/audit-log` — Log Audit

| Aspek | Nilai |
|---|---|
| URL Path | `/audit-log` |
| Nama File | `src/app/(dashboard)/audit-log/page.tsx` |
| Komponen Utama | `SummaryTile`, `AuditLogFilters`, `AuditLogTable` |
| Service | `getAuditLogs`, `getAuditLogUsers`, `getAuditLogModules` |
| Akses Role | **SUPER_ADMIN only** |
| Tipe | Server Component (async) |

Page-level guard:

```ts
if (session.user.role !== "SUPER_ADMIN") {
  redirect("/dashboard");
}
```

Mendukung filter via search params (`userId`, `module`, `dateFrom`, `dateTo`, `page`, `pageSize`). Menghitung KPI: total entri, jumlah aksi CREATE/UPDATE/DELETE.

#### 3.2.7 `/audit-log/[id]` — Detail Log Audit

| Aspek | Nilai |
|---|---|
| URL Path | `/audit-log/[id]` |
| Nama File | `src/app/(dashboard)/audit-log/[id]/page.tsx` |
| Komponen Utama | `Card`, `DiffView` (lokal), badges, ikon Lucide |
| Service | `getAuditLogById` |
| Akses Role | **SUPER_ADMIN only** |
| Tipe | Server Component (async) |

Sama dengan parent, hanya Super Admin yang bisa akses. Menampilkan diff `oldValue` vs `newValue` dengan status per-field: added/removed/changed/unchanged. Aksi (CREATE/UPDATE/DELETE) ditandai dengan warna khusus (emerald/sky/rose).

#### 3.2.8 `/employees` — Daftar Karyawan

| Aspek | Nilai |
|---|---|
| URL Path | `/employees` |
| Nama File | `src/app/(dashboard)/employees/page.tsx` |
| Komponen Utama | `EmployeeTable`, `EmployeeFilters`, `SummaryTile`, `Button` (Tambah Karyawan) |
| Service | `getEmployees`, `getEmployeesForManager`, `getEmployeeStatsSummary`, `getEmployeeByUserId`, `getAllDepartments`, `getAllPositions` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE (logika berbeda) |
| Tipe | Server Component (async) |

Akses kompleks per-role:
- **EMPLOYEE**: tidak melihat list. Halaman langsung redirect ke `/employees/{ownEmployeeId}` jika punya profil; jika tidak, tampilkan pesan "Profil karyawan tidak ditemukan."
- **MANAGER**: data di-filter via `getEmployeesForManager(userId)` (hanya departemen manager). Filter `departmentId` di-disable di UI (`isManager={true}` dilewatkan ke `EmployeeFilters`). Filter posisi di-scope ke posisi-posisi di departemen manager saja.
- **HR_ADMIN, SUPER_ADMIN**: pakai `getEmployees()` tanpa scope, dan tombol "Tambah Karyawan" muncul (`canCreate = role === "HR_ADMIN" || role === "SUPER_ADMIN"`).

Filter via searchParams: `page`, `search`, `departmentId`, `positionId`, `isActive`, `contractType`. KPI tiles: aktif, PKWT, PKWTT, baru bulan ini, nonaktif.

#### 3.2.9 `/employees/new` — Tambah Karyawan

| Aspek | Nilai |
|---|---|
| URL Path | `/employees/new` |
| Nama File | `src/app/(dashboard)/employees/new/page.tsx` |
| Komponen Utama | `CreateEmployeeForm`, `Button` |
| Service | `getAllDepartments`, `getAllPositions` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check: `if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/employees")`. Memuat list departemen + posisi untuk dropdown form. `CreateEmployeeForm` adalah client component (mengandung server action submit).

#### 3.2.10 `/employees/[id]` — Detail/Edit Karyawan

| Aspek | Nilai |
|---|---|
| URL Path | `/employees/[id]` |
| Nama File | `src/app/(dashboard)/employees/[id]/page.tsx` |
| Komponen Utama | `EmployeeProfileTabs`, `DeactivateEmployeeDialog`, `Avatar`, `Badge`, `Card`, `Separator` |
| Service | `getEmployeeById`, `getEmployeeByUserId`, `canManagerAccessEmployee`, `getAllDepartments`, `getAllPositions` |
| Akses Role | Bertingkat per role (lihat di bawah) |
| Tipe | Server Component (async) |

Logika akses sangat granular:
- **EMPLOYEE**: hanya boleh melihat profilnya sendiri. Mengambil `getEmployeeByUserId(session.user.id)`; jika `ownEmployee.id !== id` → redirect `/dashboard`. Mode = `readonly`.
- **MANAGER**: pakai `canManagerAccessEmployee(userId, employeeId)` — boleh akses jika employee target ada di departemennya. Jika tidak, redirect `/employees`. Mode = `readonly`.
- **HR_ADMIN, SUPER_ADMIN**: bebas akses semua karyawan. Mode = `edit` (form-form di tab dapat di-edit + tombol Deactivate muncul jika employee aktif).

Tab UI (`EmployeeProfileTabs`) menampilkan beberapa tab: profil/identitas, kontrak, dokumen, kontak darurat. Property `mode` ("edit" | "readonly") diteruskan ke tabs dan menentukan apakah field input enabled.

#### 3.2.11 `/leave` — Cuti (self-service)

| Aspek | Nilai |
|---|---|
| URL Path | `/leave` |
| Nama File | `src/app/(dashboard)/leave/page.tsx` |
| Komponen Utama | `LeaveBalanceCard`, `LeaveRequestSection`, `LeaveHistoryTable`, `SummaryTile` |
| Service | `getLeaveBalances`, `getLeaveRequests`, `ensureLeaveBalances` |
| Akses Role | Semua role yang punya Employee profile |
| Tipe | Server Component (async) |

Hanya `if (!session?.user) redirect("/login")` di level halaman. Lalu cari `prisma.employee` by `userId` — jika tidak ada, tampilkan empty state. Memanggil `ensureLeaveBalances(employee.id)` (idempotent) untuk memastikan saldo cuti tahun berjalan sudah dibuat. Lalu fetch balances + requests tahun berjalan. KPI: sisa cuti, terpakai, menunggu approval, total alokasi.

#### 3.2.12 `/leave/manage` — Kelola Cuti (approval)

| Aspek | Nilai |
|---|---|
| URL Path | `/leave/manage` |
| Nama File | `src/app/(dashboard)/leave/manage/page.tsx` |
| Komponen Utama | `LeaveApprovalTable`, `SummaryTile` |
| Service | `getLeaveRequests` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER |
| Tipe | Server Component (async) |

Page-level check: `if (!["HR_ADMIN", "SUPER_ADMIN", "MANAGER"].includes(role)) redirect("/leave")`. Default filter berbeda per-role:
- MANAGER: default status `PENDING_MANAGER` (queue manager).
- HR_ADMIN/SUPER_ADMIN: default status `PENDING_HR` (queue HR).

Untuk MANAGER, request di-scope by `departmentId` (dari profile employee). KPI: menunggu (aktor), disetujui, ditolak, dibatalkan.

#### 3.2.13 `/leave/report` — Laporan Cuti

| Aspek | Nilai |
|---|---|
| URL Path | `/leave/report` |
| Nama File | `src/app/(dashboard)/leave/report/page.tsx` |
| Komponen Utama | `LeaveReportKpiCards`, `LeaveReportFilters`, `LeaveReportTrendChart`, `Table` (summary per karyawan) |
| Service | `getLeaveRequests` (current year + prior year), `prisma.department.findMany` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check: `if (!["HR_ADMIN", "SUPER_ADMIN"].includes(session.user.role)) redirect("/leave")`. Filter via searchParams: `year`, `departmentId`. Menghitung KPI (jumlah employee yang cuti, hari approved, pending, rejected) untuk tahun current dan tahun prior (untuk perbandingan). Tren bulanan disusun ke buckets `MONTH_LABELS` (12 bulan). Tabel ringkasan per karyawan dengan inline bar untuk visualisasi hari yang disetujui.

#### 3.2.14 `/master-data` — Data Master

| Aspek | Nilai |
|---|---|
| URL Path | `/master-data` |
| Nama File | `src/app/(dashboard)/master-data/page.tsx` |
| Komponen Utama | `MasterDataTabs` (tabs: Departemen, Jabatan, Lokasi Kantor, Jenis Cuti) |
| Akses Role | **SUPER_ADMIN only** |
| Tipe | Server Component (async) |

Page-level guard:

```ts
if (session.user.role !== "SUPER_ADMIN") {
  redirect("/dashboard");
}
```

Hanya Super Admin yang dapat mengelola data master inti sistem (CRUD departemen, jabatan, lokasi kantor + workhours, jenis cuti).

#### 3.2.15 `/payroll` — Penggajian

| Aspek | Nilai |
|---|---|
| URL Path | `/payroll` |
| Nama File | `src/app/(dashboard)/payroll/page.tsx` |
| Komponen Utama | `ImportPayrollForm`, `SummaryTile`, `Table` (riwayat run), `Badge` |
| Service | `getPayrollRuns` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check: `if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) redirect("/dashboard")`. Halaman ini adalah hub untuk pivot penggajian Excel-import:
- Form di atas (`ImportPayrollForm`) untuk upload Excel/CSV penggajian baru.
- Tabel riwayat semua `PayrollRun` (status DRAFT atau FINALIZED).

KPI: total periode, difinalisasi, draft, periode terbaru.

#### 3.2.16 `/payroll/[periodId]` — Detail Periode Penggajian

| Aspek | Nilai |
|---|---|
| URL Path | `/payroll/[periodId]` |
| Nama File | `src/app/(dashboard)/payroll/[periodId]/page.tsx` |
| Komponen Utama | `PayrollEntryTable`, `FinalizeButton`, `SummaryTile`, `Badge` |
| Service | `getPayrollRunDetail` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check sama dengan parent. Data `PayrollEntry` (Prisma Decimal fields) di-serialize ke Number untuk client component. KPI: jumlah karyawan, total earnings, total deductions, total take home pay (dengan format Rupiah compact). Tombol `FinalizeButton` muncul hanya jika `run.status === "DRAFT"`.

#### 3.2.17 `/payslip` — Slip Gaji

| Aspek | Nilai |
|---|---|
| URL Path | `/payslip` |
| Nama File | `src/app/(dashboard)/payslip/page.tsx` |
| Komponen Utama | `SummaryTile`, `Table`, `Badge`, `<a>` link ke API `/api/payroll/payslip/{entryId}` |
| Akses Role | SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE (split logic) |
| Tipe | Server Component (async) |

Memiliki **dua mode tampilan**:

1. **Admin view (HR_ADMIN / SUPER_ADMIN)**: query semua `PayrollEntry` di periode FINALIZED, tampilkan tabel lengkap dengan kolom Periode/NIK/Nama/Status/Aksi (Unduh PDF). KPI: Total slip, Periode (count distinct), Karyawan (count distinct), Periode terbaru.
2. **Self view (EMPLOYEE / MANAGER)**: query `PayrollEntry` hanya milik sendiri (filter `employeeId`). KPI: total slip tersedia, periode terbaru, periode terlama. Tampilan tabel disederhanakan (tanpa kolom NIK/Nama).

Untuk download, link ke endpoint API route `/api/payroll/payslip/{entryId}` (PDF generation).

#### 3.2.18 `/recruitment` — Rekrutmen

| Aspek | Nilai |
|---|---|
| URL Path | `/recruitment` |
| Nama File | `src/app/(dashboard)/recruitment/page.tsx` |
| Komponen Utama | `VacancyTable`, `SummaryTile`, `Button` (Buat Lowongan) |
| Service | `getVacanciesWithPipeline`, `getRecruitmentStatsSummary` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page-level check: `if (role !== "HR_ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard")`. Filter via searchParams: `status` (OPEN/CLOSED). KPI: lowongan aktif, ditutup, total kandidat, interview terjadwal, hired bulan ini.

#### 3.2.19 `/recruitment/new` — Buat Lowongan

| Aspek | Nilai |
|---|---|
| URL Path | `/recruitment/new` |
| Nama File | `src/app/(dashboard)/recruitment/new/page.tsx` |
| Komponen Utama | `CreateVacancyForm`, `Button` |
| Service | `prisma.department.findMany` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Sama dengan parent, role check 2-tier (auth + role), lalu render form pembuatan vacancy.

#### 3.2.20 `/recruitment/[vacancyId]` — Detail Lowongan + Pipeline Kanban

| Aspek | Nilai |
|---|---|
| URL Path | `/recruitment/[vacancyId]` |
| Nama File | `src/app/(dashboard)/recruitment/[vacancyId]/page.tsx` |
| Komponen Utama | `KanbanBoard`, `AddCandidateDialog`, `Card`, `Badge`, `Separator`, `MetaItem` (lokal) |
| Service | `getVacancyById` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Kanban dengan 6 stage: MELAMAR, SELEKSI_BERKAS, INTERVIEW, PENAWARAN, DITERIMA, DITOLAK. Pipeline summary menampilkan 4 stage aktif (kecuali DITERIMA & DITOLAK). Kanban interaktif (drag-and-drop) di-implement di `KanbanBoard` (client).

#### 3.2.21 `/recruitment/candidates/[candidateId]` — Detail Kandidat

| Aspek | Nilai |
|---|---|
| URL Path | `/recruitment/candidates/[candidateId]` |
| Nama File | `src/app/(dashboard)/recruitment/candidates/[candidateId]/page.tsx` |
| Komponen Utama | `CandidateDetailClient` (client wrapper) |
| Service | `getCandidateById` |
| Akses Role | SUPER_ADMIN, HR_ADMIN |
| Tipe | Server Component (async) |

Page server-only mengambil data, men-serialize Date dan Decimal (`offerSalary`) ke string, lalu pass ke `CandidateDetailClient` yang menangani interaksi (pindah stage, schedule interview, hire).

#### 3.2.22 `/users` — Manajemen Pengguna

| Aspek | Nilai |
|---|---|
| URL Path | `/users` |
| Nama File | `src/app/(dashboard)/users/page.tsx` |
| Komponen Utama | `UserTable`, `UserPageHeader` |
| Service | `getUsers` |
| Akses Role | **SUPER_ADMIN only** |
| Tipe | Server Component (async) |

Page-level guard: `if (session.user.role !== "SUPER_ADMIN") redirect("/dashboard")`. Hanya Super Admin yang dapat mengelola user account (create, change role, deactivate). `UserPageHeader` mengandung dialog "Tambah Pengguna".

### 3.3 Ringkasan Karakteristik Halaman

- **Total halaman page.tsx**: 22 (1 root + 1 login + 20 dashboard).
- **Total layout.tsx**: 3 (root, auth group, dashboard group).
- **Hampir semua halaman dashboard adalah Server Components** (async function, panggil `auth()` dan service Prisma langsung). Hanya `/login` yang explicit `"use client"`.
- **Pattern role check** seragam: panggil `auth()` → cek `session?.user` → cek `session.user.role` → redirect target sesuai role yang seharusnya bisa akses.
- **Dynamic routes** menggunakan `params: Promise<{ ... }>` dan `searchParams: Promise<{ ... }>` (Next.js 15 async params).

---

## 4. Role & Access Control

### 4.1 Definisi Role

Sistem memiliki 4 role yang didefinisikan di Prisma schema (`prisma/schema.prisma`):

```prisma
enum Role {
  SUPER_ADMIN
  HR_ADMIN
  MANAGER
  EMPLOYEE
}
```

Versi client-safe ada di `src/types/enums.ts`:

```ts
export const Role = {
  SUPER_ADMIN: "SUPER_ADMIN",
  HR_ADMIN: "HR_ADMIN",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;
export type Role = (typeof Role)[keyof typeof Role];
```

Konvensi: enum literal **harus dalam UPPER_SNAKE_CASE** (sesuai Prisma).

### 4.2 Profil Setiap Role

#### 4.2.1 SUPER_ADMIN

Role tertinggi dengan akses ke semua modul, termasuk modul administratif yang khusus untuk dirinya saja.

**Halaman yang bisa diakses (dari sidebar.tsx):**
- Dashboard
- Karyawan (list + detail + create + edit)
- Rekrutmen + Buat Lowongan + Detail Vacancy + Detail Kandidat
- Absensi (self) + Admin Absensi + Detail Karyawan Absensi
- Cuti (self) + Kelola Cuti + Laporan Cuti
- Penggajian + Detail Periode
- Slip Gaji (admin view, semua karyawan)
- **Pengguna** (eksklusif)
- **Data Master** (eksklusif)
- **Log Audit** + Detail Log Audit (eksklusif)

**Aksi yang bisa dilakukan:**
- Employee: CRUD + deactivate, akses semua data tanpa scope.
- Attendance: lihat semua, manual record, export, edit.
- Leave: lihat semua, approve/reject di stage HR.
- Payroll: import Excel, lihat semua periode, finalize.
- Recruitment: CRUD vacancy, kelola kandidat, hire.
- Master Data: CRUD departemen, jabatan, lokasi, jenis cuti.
- User Management: CRUD user, ubah role.
- Audit Log: read-only, semua entri.

#### 4.2.2 HR_ADMIN

Role administratif HR — akses operasional ke semua modul SDM kecuali yang eksklusif Super Admin.

**Halaman yang bisa diakses:**
- Dashboard
- Karyawan (list + detail + create + edit)
- Rekrutmen + semua sub-page
- Absensi (self) + Admin Absensi + Detail
- Cuti (self) + Kelola Cuti + Laporan Cuti
- Penggajian + Detail
- Slip Gaji (admin view)

**Tidak bisa akses:** Pengguna, Data Master, Log Audit.

**Aksi yang bisa dilakukan:**
- Employee: CRUD + deactivate (sama dengan SUPER_ADMIN).
- Attendance: sama dengan SUPER_ADMIN (manual record, export).
- Leave: lihat semua, approve di stage HR (PENDING_HR).
- Payroll: import Excel, finalize.
- Recruitment: CRUD vacancy, kelola kandidat.

#### 4.2.3 MANAGER

Role middle-management — terbatas pada departemennya sendiri.

**Halaman yang bisa diakses:**
- Dashboard
- Karyawan (list di-scope ke departemennya, detail readonly)
- Absensi (self) + Admin Absensi (di-scope departemen) + Detail (hanya karyawan di departemennya)
- Cuti (self) + Kelola Cuti (queue PENDING_MANAGER, scope departemen)
- Slip Gaji (self only, sama dengan EMPLOYEE)

**Tidak bisa akses:** Rekrutmen, Laporan Cuti, Penggajian (admin), Pengguna, Data Master, Log Audit.

**Aksi yang bisa dilakukan:**
- Employee: read-only di departemen sendiri, tidak bisa edit/create.
- Attendance: lihat departemen, tidak bisa manual record / export.
- Leave: approve/reject di stage `PENDING_MANAGER` untuk karyawan departemennya. Setelah approve, status jadi `PENDING_HR`.
- Slip Gaji: download milik sendiri.

#### 4.2.4 EMPLOYEE

Role end-user (karyawan biasa) — akses self-service.

**Halaman yang bisa diakses:**
- Dashboard
- Karyawan: hanya redirect ke `/employees/{ownId}` (detail readonly profil sendiri)
- Absensi (self): clock-in, clock-out, lihat history sendiri
- Cuti (self): ajukan cuti, lihat saldo, lihat history
- Slip Gaji (self): download slip sendiri

**Tidak bisa akses:** Admin Absensi, Kelola Cuti, Laporan Cuti, Rekrutmen, Penggajian (admin), Pengguna, Data Master, Log Audit.

**Aksi yang bisa dilakukan:**
- Lihat profil sendiri (read-only).
- Clock-in / Clock-out (jika lokasi kantor & waktu valid).
- Submit leave request.
- Cancel leave request sendiri yang masih PENDING.
- Download slip gaji sendiri (periode FINALIZED).

### 4.3 Mekanisme Pengecekan Role

Sistem menerapkan **defense in depth** dengan 4 lapis pengecekan:

#### Lapis 1 — `middleware.ts` (Edge Runtime)

```ts
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

Middleware berjalan di **Edge Runtime** untuk setiap request kecuali `api/auth/*`, asset Next, favicon. Callback `authorized` di `auth.config.ts` memutuskan:

```ts
authorized({ auth, request: { nextUrl } }) {
  const isLoggedIn = !!auth?.user
  const isPublicPath =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/api/auth")

  if (isPublicPath) return true
  if (isLoggedIn) return true

  // Redirect unauthenticated users to /login
  return false
}
```

Logic-nya: path publik (`/login`, `/api/auth/*`) selalu lolos; path lain butuh user login. Jika tidak login, return `false` → NextAuth otomatis redirect ke `pages.signIn` = `/login`. **Catatan**: middleware **TIDAK mengecek role** — hanya autentikasi.

#### Lapis 2 — Layout Auth Gate (`(dashboard)/layout.tsx`)

```ts
const session = await auth();
if (!session) {
  redirect("/login");
}
```

Layout dashboard adalah server component yang memastikan setiap render halaman dashboard memiliki session valid. Backup safety net di atas middleware.

#### Lapis 3 — Page-level Role Check

Hampir semua page server component melakukan dua check:

```ts
const session = await auth();
if (!session?.user) redirect("/login");

const role = session.user.role;
if (!["HR_ADMIN", "SUPER_ADMIN"].includes(role)) {
  redirect("/dashboard");
}
```

Ini memastikan pengguna dengan role yang tidak punya hak akses akan dilempar ke halaman yang sesuai (dashboard / login / fallback). Lihat contoh granular di `/employees/[id]/page.tsx` yang membedakan mode "edit" vs "readonly" berdasarkan role.

#### Lapis 4 — Server Action / Service Layer

Server actions dan service functions di `src/lib/services/*` melakukan pengecekan role/scope sebelum mengeksekusi operasi DB. Contoh (`canManagerAccessEmployee(userId, employeeId)`) mem-validate bahwa manager hanya boleh akses employee di departemennya.

#### Lapis 5 — Sidebar Filter (UI)

Di `src/components/layout/sidebar.tsx`, fungsi `getFilteredGroups(role)` memfilter item navigasi berdasarkan property `roles: Role[]` per item. Ini bukan security boundary (bisa di-bypass dengan langsung type URL), tapi memastikan UX bersih: user hanya melihat menu yang relevan.

Contoh definisi item:

```ts
{
  label: "Log Audit",
  href: "/audit-log",
  icon: FileText,
  roles: ["SUPER_ADMIN"],
},
```

### 4.4 Matrix Role × Modul

Notasi:
- **R** = Read (lihat)
- **W** = Write (create/update)
- **D** = Delete / Deactivate
- **A** = Approve (untuk workflow approval)
- **S** = Self-service only (terbatas data sendiri)
- **Sd** = Scoped to department
- **—** = Tidak ada akses

| Modul | SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE |
|---|---|---|---|---|
| **Dashboard** | R (super-admin view) | R (hr view) | R (manager view) | R (employee view) |
| **Employee — list** | R, W, D | R, W, D | R (Sd) | — (redirect ke profil sendiri) |
| **Employee — detail** | R, W (edit) | R, W (edit) | R (Sd, readonly) | R (S, readonly) |
| **Employee — create** | W | W | — | — |
| **Employee — deactivate** | D | D | — | — |
| **Attendance — self (clock in/out, history)** | R, W (S) | R, W (S) | R, W (S) | R, W (S) |
| **Attendance — admin (rekap bulanan)** | R | R | R (Sd) | — |
| **Attendance — manual record** | W | W | — | — |
| **Attendance — export** | R (export) | R (export) | — | — |
| **Attendance — detail karyawan** | R | R | R (Sd) | — |
| **Leave — self (ajukan, lihat saldo, history)** | R, W (S) | R, W (S) | R, W (S) | R, W (S) |
| **Leave — manage (approve/reject)** | A (stage HR) | A (stage HR) | A (stage Manager, Sd) | — |
| **Leave — cancel own request** | W (S) | W (S) | W (S) | W (S) |
| **Leave — report** | R | R | — | — |
| **Payroll — import Excel** | W | W | — | — |
| **Payroll — list runs** | R | R | — | — |
| **Payroll — finalize** | W | W | — | — |
| **Payroll — detail entries** | R | R | — | — |
| **Payslip — admin view (semua karyawan)** | R (download) | R (download) | — | — |
| **Payslip — self download** | R (S) | R (S) | R (S) | R (S) |
| **Recruitment — vacancies** | R, W, D | R, W, D | — | — |
| **Recruitment — candidates** | R, W, D | R, W, D | — | — |
| **Recruitment — kanban / change stage** | W | W | — | — |
| **Master Data — departemen** | R, W, D | — | — | — |
| **Master Data — jabatan** | R, W, D | — | — | — |
| **Master Data — lokasi kantor** | R, W, D | — | — | — |
| **Master Data — jenis cuti** | R, W, D | — | — | — |
| **User Management — list, create, role** | R, W, D | — | — | — |
| **Audit Log — list & detail** | R | — | — | — |

### 4.5 Catatan Implementasi

- **Sidebar items** untuk MANAGER tidak menampilkan: Rekrutmen, Laporan Cuti, Penggajian, Pengguna, Data Master, Log Audit (mengacu `roles` array di setiap NavItem).
- **Sidebar items** untuk EMPLOYEE tidak menampilkan: Admin Absensi, Kelola Cuti, Laporan Cuti, Rekrutmen, Penggajian, Pengguna, Data Master, Log Audit.
- Halaman `/employees` untuk EMPLOYEE bersifat unik: bukan menampilkan list, melainkan auto-redirect ke `/employees/{ownId}` agar UX konsisten dari sidebar.
- Halaman `/payslip` mendeteksi role di runtime dan men-render dua tampilan berbeda (admin / self) dalam satu file.
- Untuk MANAGER, scope ke departemen di-derive dari `prisma.employee.findUnique({ where: { userId: session.user.id }})` di setiap halaman (tidak di-cache di session).

---

## 11. Middleware & Auth

Sistem autentikasi menggunakan **NextAuth.js v5 (Auth.js)** dengan strategi JWT, Credentials provider, dan integrasi Prisma untuk verifikasi password.

### 11.1 Provider & Konfigurasi

#### 11.1.1 `src/lib/auth.config.ts` — Edge-compatible Config

```ts
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublicPath =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/api/auth")

      if (isPublicPath) return true
      if (isLoggedIn) return true

      return false
    },
  },
  providers: [], // Providers added in auth.ts (not Edge-compatible)
} satisfies NextAuthConfig
```

File ini **dipisahkan** dari `auth.ts` karena akan dimuat oleh middleware (Edge Runtime). Edge Runtime tidak mendukung `bcryptjs` dan Prisma client penuh — sehingga providers ditambahkan di `auth.ts` (Node.js runtime) saja.

`pages.signIn = "/login"` memberitahu NextAuth: jika user belum login, redirect ke `/login` (bukan halaman default `/api/auth/signin`).

#### 11.1.2 `src/lib/auth.ts` — Full NextAuth Configuration

```ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"
import type { Role } from "@/generated/prisma/client"

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email, isActive: true },
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)
        if (!isPasswordValid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as Role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
})
```

Object yang di-export:
- `auth` — function untuk dipanggil di server component / route handler untuk mengambil session.
- `signIn`, `signOut` — wrapper untuk login/logout (server action).
- `handlers` — `GET` & `POST` handler untuk `/api/auth/[...nextauth]/route.ts`.

#### 11.1.3 Provider: Credentials (Email + Password)

Sistem **hanya menggunakan satu provider**: `Credentials`. Tidak ada OAuth (Google/GitHub) karena ini sistem internal perusahaan.

Fields:
- `email` (type=email, label="Email")
- `password` (type=password, label="Password")

Function `authorize(credentials)`:
1. Validasi keberadaan email & password — jika kosong return `null`.
2. Query `prisma.user.findUnique({ where: { email, isActive: true }})` — di-filter `isActive: true` agar user yang di-deactivate tidak bisa login.
3. Jika user tidak ditemukan, return `null`.
4. `bcrypt.compare(password, user.hashedPassword)` — verifikasi password hash.
5. Jika password tidak valid, return `null`.
6. Return user object: `{ id, name, email, role }`. Field `role` (Prisma enum) ikut di-return supaya bisa diteruskan ke JWT.

Return `null` di NextAuth = login gagal → frontend menerima `result.error` di `signIn(...)` → tampilkan banner "Email atau password salah".

### 11.2 Session Strategy

```ts
session: {
  strategy: "jwt",
  maxAge: 8 * 60 * 60, // 8 hours
}
```

Sistem menggunakan **JWT-based session** (bukan database-backed). Implikasi:
- Session disimpan di **encrypted cookie** (`next-auth.session-token` / `__Secure-next-auth.session-token` di production).
- Tidak ada tabel `Session` / `Account` di Prisma schema — lebih ringan, tidak perlu Prisma adapter.
- Session **tidak bisa di-revoke server-side** (karena disimpan di client cookie). Logout efektif hanya pada device tersebut.
- `maxAge` = 8 jam — durasi 1 hari kerja kantor; sesudah itu user harus login ulang.

### 11.3 Callbacks: jwt() dan session()

NextAuth v5 dengan JWT strategy memanggil callback dalam urutan:
1. `authorize()` (Credentials provider) → return user object (atau null).
2. `jwt({ token, user, ... })` — pertama kali login, `user` ada; refresh subsequent, `user` undefined.
3. `session({ session, token })` — dipanggil setiap kali `auth()` atau `useSession()` dijalankan.

#### Callback `jwt`

```ts
async jwt({ token, user }) {
  if (user) {
    token.id = user.id as string
    token.role = user.role as Role
  }
  return token
}
```

Saat login pertama, `user` ada → kita inject `id` dan `role` dari user object (returned by `authorize`) ke JWT token. Pada request berikutnya, `user` undefined dan token sudah memiliki `id` + `role` yang persisten.

#### Callback `session`

```ts
async session({ session, token }) {
  if (token) {
    session.user.id = token.id
    session.user.role = token.role
  }
  return session
}
```

Dari token, kita inject `id` dan `role` ke session object. Inilah cara `session.user.role` tersedia di seluruh aplikasi (server component dan client `useSession()`).

### 11.4 TypeScript Type Augmentation (`src/types/next-auth.d.ts`)

NextAuth default `Session.user` hanya punya `name`, `email`, `image`. Untuk menambahkan `id` dan `role`, type-augment via module declaration:

```ts
import { Role } from "@/types/enums"
import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User extends DefaultUser {
    role: Role
  }

  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: Role
  }
}
```

Sekarang TypeScript memahami bahwa `session.user.role` adalah `Role` (`SUPER_ADMIN | HR_ADMIN | MANAGER | EMPLOYEE`), dan `session.user.id` adalah string.

### 11.5 Middleware Behavior

#### File: `src/middleware.ts`

```ts
import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

export default NextAuth(authConfig).auth

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
}
```

#### Penjelasan

1. **Edge Runtime**: middleware Next.js berjalan di Edge Runtime (V8 isolate, tidak ada Node API penuh). Ini sebabnya kita import `authConfig` (yang **tidak punya providers** Credentials dengan `bcryptjs`) — bukan `auth.ts` lengkap.

2. **`NextAuth(authConfig).auth`**: NextAuth menyediakan helper middleware. `auth` adalah default-exported function yang akan dijalankan untuk setiap request yang match `matcher`.

3. **Matcher regex**: `/((?!api/auth|_next/static|_next/image|favicon.ico).*)`. Ini negative lookahead — meng-exclude:
   - `/api/auth/*` — endpoint NextAuth (login, callback, signout) harus accessible tanpa middleware.
   - `/_next/static/*` & `/_next/image/*` — Next.js internal asset.
   - `/favicon.ico`.
   
   Semua path lain melewati middleware.

4. **Redirect logic**: callback `authorized()` di `authConfig` me-return `false` jika user tidak login dan path tidak public. NextAuth menerjemahkan `false` menjadi redirect ke `pages.signIn = "/login"` dengan query param `?callbackUrl={original}` (yang bisa digunakan untuk auto-redirect setelah login).

5. **Tidak ada role check di middleware**. Semua role-based authorization dilakukan di:
   - Layout dashboard (`if (!session) redirect("/login")`).
   - Page-level check (`if (role !== ...) redirect(...)`).
   - Service layer (validasi scope).

### 11.6 Login Flow End-to-End

1. User akses `/dashboard` (atau halaman protected lainnya) → middleware menjalankan `authorized` callback. Tidak ada session cookie → callback return `false` → NextAuth redirect ke `/login?callbackUrl=/dashboard`.
2. User type email + password di form `/login` (`src/app/(auth)/login/page.tsx`).
3. Form submit memanggil `signIn("credentials", { email, password, redirect: false })` dari `next-auth/react`.
4. NextAuth POST ke `/api/auth/callback/credentials` dengan kredensial.
5. Server menjalankan `authorize(credentials)` di `auth.ts` — query Prisma + `bcrypt.compare`. Jika OK, return user object.
6. NextAuth menjalankan `jwt({ token, user })` — inject `id` + `role` ke token.
7. Token di-encrypt + disimpan ke cookie httpOnly (`next-auth.session-token`).
8. Client menerima respons sukses (`result.error === undefined`) → halaman memanggil `router.push("/dashboard")` + `router.refresh()`.
9. Browser request ke `/dashboard` dengan cookie session → middleware `authorized` return `true` → request lolos.
10. Layout `(dashboard)/layout.tsx` jalankan `auth()` lagi (server-side) → memvalidasi cookie, decrypt token, jalankan `session({ session, token })` callback → return session yang punya `user.id` + `user.role`.
11. Page component `dashboard/page.tsx` panggil `auth()` → switch render dashboard sesuai `session.user.role`.

### 11.7 Password Hashing

- Library: `bcryptjs` (pure JS, tidak butuh native binding).
- Storage: field `User.hashedPassword` (string) di Prisma.
- Hash baru dibuat di flow seeding dan di server action create user (file `src/lib/services/user.service.ts` atau actions terkait).
- Verifikasi: `await bcrypt.compare(plaintextPassword, storedHash)` — memberikan timing-safe comparison.
- bcryptjs default cost: 10 rounds (cukup untuk aplikasi internal).

**Catatan keamanan**: karena `bcryptjs` butuh runtime Node.js (kompatibel dengan WASM tapi penalti perf di Edge), `Credentials` provider harus berada di file `auth.ts` saja, bukan `auth.config.ts`.

### 11.8 Bagaimana Role di-attach ke Session

Alur attachment role:

```
User table (Prisma)
  └── { role: Role enum }                  ← source of truth
        ↓
Credentials.authorize()
  └── return { id, name, email, role }     ← user object
        ↓
jwt() callback
  └── token.role = user.role               ← injected ke JWT
        ↓
[ JWT encrypted, stored in cookie ]
        ↓
session() callback (subsequent requests)
  └── session.user.role = token.role       ← extracted ke session
        ↓
session.user.role → consumed by:
  - Server: page.tsx role checks (redirect)
  - Server: layout.tsx
  - Server: service layer scope checks
  - Client: useSession() in sidebar.tsx (filter nav)
```

### 11.9 Verifikasi Auth di Server Component / Server Action

Pattern resmi yang dipakai di semua page server:

```ts
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function SomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Role-specific check
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard")
  }

  // ... fetch data, render UI
}
```

`auth()` di server context:
- Membaca cookie `next-auth.session-token` dari incoming Request.
- Decrypt JWT.
- Jalankan `session()` callback.
- Return `Session | null`.

Untuk **server actions** (`"use server"`), pattern serupa:

```ts
"use server"
import { auth } from "@/lib/auth"

export async function someAction(input: Input) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role !== "HR_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden")
  }
  // ... DB mutation
}
```

### 11.10 Verifikasi Auth di Client Component

Untuk client component yang butuh role/session info, dipakai `useSession` dari `next-auth/react`:

```tsx
"use client"
import { useSession } from "next-auth/react"

export function SomeWidget() {
  const { data: session } = useSession()
  const role = session?.user?.role
  // ...
}
```

Agar `useSession` bekerja, app harus dibungkus di `<SessionProvider>`. Di proyek ini ada **dua wrapper** dengan tujuan berbeda:

1. **`src/components/providers/session-provider.tsx`** — `AuthSessionProvider`, dipakai di **root layout** (`src/app/layout.tsx`):

   ```tsx
   "use client"
   import { SessionProvider } from "next-auth/react"
   
   export function AuthSessionProvider({ children }) {
     return <SessionProvider>{children}</SessionProvider>
   }
   ```

2. **`src/components/layout/session-provider.tsx`** — `SessionProvider` (alias berbeda), dipakai di **dashboard layout** (`src/app/(dashboard)/layout.tsx`):

   ```tsx
   "use client"
   import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
   
   export function SessionProvider({ children }) {
     return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
   }
   ```

Keduanya pada dasarnya identik — wrapper tipis di sekitar `next-auth/react`'s `SessionProvider`. Adanya dua versi adalah artefak refactor; secara fungsional satu cukup, tapi root layout dan dashboard layout masing-masing membungkus children dengan provider sendiri-sendiri (membuat double-wrap, namun tidak menimbulkan error).

### 11.11 Public Path & API Auth Endpoint

Path publik (tidak butuh auth):
- `/login` — halaman login.
- `/api/auth/*` — endpoint NextAuth: `/signin`, `/callback/credentials`, `/signout`, `/session`, `/csrf`, dll. Semua endpoint ini di-handle oleh `handlers` di `auth.ts` yang di-mount di `src/app/api/auth/[...nextauth]/route.ts` (file standar Auth.js).

### 11.12 Logout Flow

Logout dipanggil dari client (misalnya dari `Header` component dengan tombol logout) via:

```ts
import { signOut } from "next-auth/react"
await signOut({ callbackUrl: "/login" })
```

Atau dari server action:

```ts
"use server"
import { signOut } from "@/lib/auth"
export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}
```

Logout memanggil `/api/auth/signout` → cookie session di-clear (Set-Cookie dengan Max-Age=0) → redirect ke `/login`.

### 11.13 Ringkasan Lapisan Keamanan

| Lapis | Lokasi | Yang dicek | Fail action |
|---|---|---|---|
| 1. Middleware | `src/middleware.ts` | Login (existence of session) | Redirect `/login` |
| 2. Layout gate | `src/app/(dashboard)/layout.tsx` | Login (server `auth()`) | Redirect `/login` |
| 3. Page-level | Setiap `page.tsx` server component | Login + Role | Redirect (`/login` atau halaman fallback role) |
| 4. Service layer | `src/lib/services/*.ts` | Role + scope (departemen, ownership) | Throw error / null result |
| 5. UI Filter (UX) | `src/components/layout/sidebar.tsx` | Role (sembunyikan nav) | Item tidak ditampilkan (bukan security) |

Dengan lima lapis ini, sistem mempertahankan prinsip **defense in depth** — kebocoran di satu lapis tidak otomatis membuka akses ke modul yang seharusnya restricted.
