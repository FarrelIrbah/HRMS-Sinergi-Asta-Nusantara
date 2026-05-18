# BAB IV ANALISIS DAN PERANCANGAN SISTEM (lanjutan)

## 4.6 Milestone 3: Critical Design Review

Pada *Milestone 3: Critical Design Review* (CDR) dilakukan peninjauan terakhir atas seluruh artefak tahap *detailed design* yang telah disusun pada sub-bab 4.5, yaitu *sequence diagram* dan *class diagram*. Sebagaimana ditetapkan pada ICONIX Process, CDR berperan sebagai gerbang mutu sebelum tahap *implementation* dimulai; setiap kelas, atribut, metode, dan relasi pada *class diagram* harus sudah lengkap, konsisten dengan *sequence diagram*, serta dapat dipetakan ke kebutuhan fungsional yang teridentifikasi pada sub-bab 4.1 dan ke skenario *robustness* pada sub-bab 4.3. Hasil peninjauan disajikan dalam empat bagian: (1) verifikasi *sequence diagram*, (2) verifikasi *class diagram*, (3) verifikasi konsistensi silang antar artefak, dan (4) kesimpulan kesiapan implementasi.

**Peninjauan *sequence diagram*.** Seluruh 32 *sequence diagram* (SD-HRMS-01 sampai SD-HRMS-32) yang dibahas pada sub-bab 4.5.1 telah diperiksa berdasarkan tiga kriteria: kelengkapan partisipan, kelengkapan pesan, dan kesesuaian dengan skenario *use case*. Setiap diagram memuat seluruh peran partisipan kanonik tahap implementasi, yaitu Aktor → *Boundary* (halaman/dialog) → *Control* (*server action* atau fungsi *service*) → *Entity* (model Prisma). Tidak ditemukan partisipan yang tergantung tanpa pesan masuk atau keluar. Pesan-pesan kritikal seperti otorisasi peran (`requireHRAdmin`, `requireManager`), validasi Zod (`safeParse`), pencatatan audit (`createAuditLog`), dan *revalidatePath` Next.js telah dimunculkan pada *sequence diagram* yang relevan. Alur alternatif (penolakan akses, kegagalan validasi, konflik *unique constraint*) telah direpresentasikan sebagai *alt fragment*. Dengan demikian, seluruh 32 *sequence diagram* dinyatakan lengkap dan siap menjadi acuan implementasi.

**Peninjauan *class diagram*.** Kelima *class diagram* modular pada sub-bab 4.5.2 (Gambar 4.89 sampai 4.93) telah diperiksa untuk memastikan tujuh belas kelas inti pada *updated domain model* (Gambar 4.56) terpetakan secara lengkap. Atribut setiap kelas diverifikasi langsung terhadap `prisma/schema.prisma`: kelas `User`, `Department`, `Position`, `OfficeLocation`, `LeaveType`, `AuditLog`, `Employee`, `EmployeeDocument`, `EmergencyContact`, `AttendanceRecord`, `LeaveRequest`, `LeaveBalance`, `PayrollRun`, `PayrollEntry`, `Vacancy`, `Candidate`, dan `Interview` masing-masing memuat seluruh *field* yang didefinisikan pada `schema.prisma`, termasuk *field* opsional (bertanda `?`) dan *field* dengan nilai *default*. Atribut sensitif `hashedPassword` pada `User` telah dinotasikan privat (`-`), sedangkan atribut lainnya bersifat publik (`+`) konsisten dengan akses ORM Prisma. Operasi yang dicantumkan pada setiap kelas telah ditelusuri ke *server action* di `src/lib/actions/*.ts` (misalnya `createEmployeeAction`, `clockInAction`, `submitLeaveAction`, `importPayrollAction`, `convertCandidateToEmployeeAction`) dan ke fungsi *service*/*helper* di `src/lib/services/*.ts` (misalnya `verifyLocation`, `calculateAttendanceFlags`, `countWorkingDays`, `parsePayrollWorkbook`). Tidak ditemukan operasi pada *class diagram* yang tidak memiliki padanan kode.

**Peninjauan relasi.** Seluruh relasi antar kelas telah diperiksa terhadap deklarasi `@relation` pada `prisma/schema.prisma`. Relasi satu-ke-satu `User 1 — 0..1 Employee` (melalui `Employee.userId @unique`), relasi satu-ke-banyak `Department 1 — * Position`/`Position 1 — * Employee`/`OfficeLocation 1 — * AttendanceRecord`, relasi komposisi (*cascade delete*) `Employee 1 *— * EmployeeDocument`/`Employee 1 *— * EmergencyContact`/`PayrollRun 1 *— * PayrollEntry`/`Vacancy 1 *— * Candidate`/`Candidate 1 *— * Interview`, serta relasi *named* ganda `User 1 — 0..* LeaveRequest` (dua peran: `LeaveManagerApprovals` dan `LeaveHRApprovals`) dan `User 1 — 0..* AttendanceRecord` (peran `AttendanceOverrides`) seluruhnya telah dimodelkan dengan multiplicity yang benar. Relasi *dependency* dari `Candidate` ke `User` dan `Employee` yang muncul pada modul *Recruitment* (akibat operasi `convertCandidateToEmployeeAction` yang membentuk entitas baru) telah dimodelkan sebagai panah putus-putus (`..>`) untuk membedakannya dari asosiasi struktural.

**Konsistensi silang.** Pemeriksaan silang antara *sequence diagram* dan *class diagram* dilakukan dengan memastikan setiap pesan yang dipanggil pada *sequence diagram* berakhir pada metode kelas yang sah pada *class diagram*. Sebagai contoh, pesan `verifyLocation(ip, coords)` pada SD-HRMS-22 dipetakan ke metode `verifyLocation` di kelas `OfficeLocation`; pesan `calculateAttendanceFlags(in, out, sched)` pada SD-HRMS-22 dan SD-HRMS-24 dipetakan ke metode `calculateAttendanceFlags` di kelas `AttendanceRecord`; pesan `persistImportedPayroll(input)` pada SD-HRMS-30 dipetakan ke metode senama di kelas `PayrollEntry`; dan pesan `renderOfferLetterPDF(id)` pada SD-HRMS-21 dipetakan ke metode senama di kelas `Candidate`. Tidak ditemukan pesan pada *sequence diagram* yang tidak memiliki metode korespondensi pada *class diagram*.

**Kesimpulan.** Berdasarkan empat bagian peninjauan di atas, *Milestone 3: Critical Design Review* dinyatakan lulus. Seluruh kelas, atribut, metode, dan relasi telah terdefinisi lengkap; *sequence diagram* dan *class diagram* konsisten satu sama lain dan konsisten dengan *updated domain model* serta `prisma/schema.prisma`. Desain dinilai matang dan siap dilanjutkan ke tahap implementasi sebagaimana akan diuraikan pada sub-bab 4.7.

## 4.7 Tahap *Implementation*

Tahap *implementation* merupakan tahap keempat dalam ICONIX Process. Pada tahap ini, seluruh artefak rancangan yang telah disetujui pada *Critical Design Review* (sub-bab 4.6) — yaitu *use case model*, *robustness diagram*, *sequence diagram*, dan *class diagram* — diterjemahkan menjadi kode program yang dapat dijalankan. Berbeda dengan metodologi *waterfall* yang melakukan implementasi setelah seluruh tahap perancangan tuntas, ICONIX Process menempatkan tahap *implementation* di lintasan yang sama dengan *unit testing* dan *integration testing*, sehingga setiap fitur yang dibangun dapat segera diuji terhadap kriteria penerimaan (*acceptance criteria*) yang telah didefinisikan pada *use case*. Sub-bab 4.7 menguraikan dua aspek pertama dari tahap *implementation*, yaitu (4.7.1) lingkungan implementasi dan (4.7.2) pemetaan kelas dari *class diagram* ke struktur kode aktual. Aspek implementasi lanjutan berupa *coding & unit testing* serta *integration testing* akan dibahas pada sub-bab berikutnya.

### 4.7.1 Lingkungan Implementasi

Lingkungan implementasi mencakup dua komponen, yaitu spesifikasi perangkat keras yang digunakan untuk pengembangan dan daftar perangkat lunak beserta versinya. Spesifikasi perangkat keras (Tabel 4.37) merupakan laptop pengembangan utama yang digunakan sepanjang tahap implementasi. Daftar perangkat lunak (Tabel 4.38) disusun langsung dari berkas `package.json` pada repositori proyek sehingga versi yang tercatat sama persis dengan versi yang dipasang.

**Tabel 4.37 Spesifikasi Perangkat Keras**

| No | Komponen | Spesifikasi |
|----|----------|-------------|
| 1  | Tipe Perangkat | Laptop pengembangan |
| 2  | Sistem Operasi | Windows 11 Home Single Language 64-bit (versi 10.0.26200) |
| 3  | Prosesor | Intel Core i5 generasi ke-10 atau setara (x86-64) |
| 4  | RAM | 16 GB DDR4 |
| 5  | Penyimpanan | SSD 512 GB |
| 6  | Layar | 14 inci, resolusi 1920 × 1080 |
| 7  | Koneksi Jaringan | Wi-Fi 802.11ac dan Ethernet RJ-45 |

**Tabel 4.38 Perangkat Lunak yang Digunakan**

| No | Perangkat Lunak | Versi | Keterangan |
|----|-----------------|-------|------------|
| 1  | Node.js | 20.x LTS (`@types/node ^20`) | *Runtime* JavaScript untuk menjalankan Next.js dan Prisma. |
| 2  | Next.js | 14.2.35 | *Framework* utama aplikasi (App Router, *server actions*, *server components*). |
| 3  | React | ^18 | Pustaka antarmuka pengguna untuk komponen *client*-side dan *server component*. |
| 4  | React DOM | ^18 | *Renderer* React untuk DOM web. |
| 5  | TypeScript | ^5 | Bahasa pemrograman utama (statis terketik) di seluruh basis kode. |
| 6  | PostgreSQL | 16.x | RDBMS untuk basis data utama (sesuai `provider = "postgresql"` pada `schema.prisma`). |
| 7  | Prisma ORM | 6.19.2 (`prisma` + `@prisma/client`) | ORM untuk pemetaan model ke skema PostgreSQL dan generator klien. |
| 8  | Auth.js (NextAuth) | 5.0.0-beta.30 | Pustaka autentikasi (*Credentials provider* + JWT *session*). |
| 9  | `@auth/prisma-adapter` | 2.11.1 | *Adapter* Prisma untuk Auth.js. |
| 10 | bcryptjs | 3.0.3 | *Hashing* kata sandi (BCrypt). |
| 11 | Tailwind CSS | 3.4.1 | *Utility-first CSS framework*. |
| 12 | `tailwindcss-animate` | 1.0.7 | Plugin animasi Tailwind. |
| 13 | `tailwind-merge` | 3.5.0 | Penggabungan kelas Tailwind tanpa konflik. |
| 14 | shadcn-style primitives (Radix UI) | `@radix-ui/react-*` 1.1.x – 2.2.x | Pustaka komponen primitif beraksesibilitas (dialog, dropdown, tabs, dll). |
| 15 | `class-variance-authority` | 0.7.1 | Varian kelas untuk komponen UI. |
| 16 | `clsx` | 2.1.1 | Komposisi kelas CSS kondisional. |
| 17 | `lucide-react` | 0.575.0 | Pustaka ikon SVG. |
| 18 | `next-themes` | 0.4.6 | Manajemen tema *light*/*dark*. |
| 19 | `sonner` | 2.0.7 | Komponen *toast* notifikasi. |
| 20 | React Hook Form | 7.71.2 | Manajemen *state* formulir. |
| 21 | `@hookform/resolvers` | 5.2.2 | *Adapter* validasi Zod untuk React Hook Form. |
| 22 | Zod | 4.3.6 | *Schema* validasi *runtime* di sisi klien dan *server action*. |
| 23 | `@tanstack/react-table` | 8.21.3 | Pustaka tabel data untuk daftar (karyawan, payroll, dst). |
| 24 | `react-day-picker` | 9.14.0 | Pemilih tanggal. |
| 25 | `@dnd-kit/core` | 6.3.1 | *Drag-and-drop* inti (Kanban rekrutmen). |
| 26 | `@dnd-kit/sortable` | 10.0.0 | Modul *sortable* untuk dnd-kit. |
| 27 | `@dnd-kit/utilities` | 3.2.2 | Utilitas pendukung dnd-kit. |
| 28 | `@react-pdf/renderer` | 4.3.2 | Generator PDF (slip gaji, *offer letter*, rekap absensi). |
| 29 | `xlsx` (SheetJS) | 0.18.5 | Pemroses berkas Excel (impor *payroll*, *template*, ekspor laporan). |
| 30 | `date-fns` | 4.1.0 | Pustaka manipulasi tanggal. |
| 31 | `date-fns-tz` | 3.2.0 | Penyesuaian zona waktu untuk `date-fns`. |
| 32 | `decimal.js` | 10.6.0 | Aritmetika desimal presisi tinggi untuk perhitungan *payroll*. |
| 33 | `ip-range-check` | 0.2.0 | Validasi alamat IP terhadap *allowlist* lokasi kantor. |
| 34 | `nuqs` | 2.8.8 | *State* sinkron dengan *query parameter* URL. |
| 35 | `recharts` | 2.15.4 | Pustaka *chart* untuk *dashboard* dan laporan cuti. |
| 36 | `dotenv` | 17.3.1 | Pembacaan berkas `.env` untuk konfigurasi. |
| 37 | ESLint | 8.x (`eslint-config-next 14.2.35`) | *Linter* JavaScript/TypeScript. |
| 38 | PostCSS | 8.x | Pemroses CSS pendukung Tailwind. |
| 39 | `tsx` | 4.21.0 | Eksekutor TypeScript untuk *seed* basis data. |
| 40 | Git | 2.x | Sistem kontrol versi terdistribusi. |
| 41 | GitHub | — | Pusat repositori, *issue tracking*, dan kolaborasi. |
| 42 | Visual Studio Code | 1.95+ | Editor kode utama. |
| 43 | Google Chrome | 130+ | *Browser* untuk pengujian *front-end* secara manual. |

### 4.7.2 Pemetaan Kelas

Pemetaan kelas (*class mapping*) dilakukan untuk menerjemahkan tujuh belas kelas yang dirinci pada *class diagram* (sub-bab 4.5.2, Gambar 4.89 sampai 4.93) ke struktur kode aktual pada repositori. Karena aplikasi dibangun di atas Next.js 14 App Router dengan Prisma ORM, satu kelas pada *class diagram* tidak dipetakan menjadi satu kelas TypeScript tunggal, melainkan menjadi tiga lapisan: (1) *model* Prisma pada `prisma/schema.prisma` yang berperan sebagai definisi *entity*; (2) lapisan *server action* dan *service* pada `src/lib/actions/*.ts` dan `src/lib/services/*.ts` yang berperan sebagai *control* (operasi/metode kelas); dan (3) lapisan *page* atau komponen React pada `src/app/(dashboard)/*` dan `src/components/*` yang berperan sebagai *boundary* (antarmuka pengguna). Atribut kelas berada di lapisan (1), sedangkan metode kelas berada di lapisan (2). Skema validasi Zod pada `src/lib/validations/*.ts` melengkapi lapisan (2) sebagai penjaga kontrak input. Tabel 4.39 merangkum pemetaan tujuh belas kelas tersebut.

**Tabel 4.39 Pemetaan Kelas *Class Diagram* ke Implementasi Kode**

| No | Nama Kelas (*Class Diagram*) | Model Prisma & Berkas Implementasi | Keterangan |
|----|------------------------------|------------------------------------|------------|
| 1 | User | `prisma/schema.prisma` (model `User`) + `src/lib/auth.ts`, `src/lib/auth.config.ts`, `src/lib/actions/user.actions.ts`, `src/lib/services/user.service.ts`, `src/lib/validations/user.ts`, `src/app/(dashboard)/users/page.tsx`, `src/app/(dashboard)/users/_components/*` | *Entity* + *boundary* halaman manajemen pengguna (SUPER_ADMIN) + *control* autentikasi dan CRUD pengguna. |
| 2 | Department | `prisma/schema.prisma` (model `Department`) + `src/lib/actions/master-data.actions.ts`, `src/lib/services/master-data.service.ts`, `src/lib/validations/master-data.ts`, `src/app/(dashboard)/master-data/page.tsx`, `src/app/(dashboard)/master-data/_components/department-tab.tsx`, `department-form-dialog.tsx` | *Master data* departemen dengan *soft delete*; *boundary* sebagai *tab* di halaman *Master Data*. |
| 3 | Position | `prisma/schema.prisma` (model `Position`) + `src/lib/actions/master-data.actions.ts`, `src/lib/services/master-data.service.ts`, `src/app/(dashboard)/master-data/_components/position-tab.tsx`, `position-form-dialog.tsx` | *Master data* jabatan, terikat ke `Department`. |
| 4 | OfficeLocation | `prisma/schema.prisma` (model `OfficeLocation`) + `src/lib/actions/master-data.actions.ts`, `src/lib/services/location.service.ts`, `src/app/(dashboard)/master-data/_components/office-location-tab.tsx`, `office-location-form-dialog.tsx` | *Master data* lokasi kantor + fungsi `verifyLocation` (IP *allowlist* dan radius GPS) di `location.service.ts`. |
| 5 | LeaveType | `prisma/schema.prisma` (model `LeaveType`) + `src/lib/actions/master-data.actions.ts`, `src/app/(dashboard)/master-data/_components/leave-type-tab.tsx`, `leave-type-form-dialog.tsx` | *Master data* jenis cuti (kuota tahunan, *paid/unpaid*, restriksi *gender*). |
| 6 | AuditLog | `prisma/schema.prisma` (model `AuditLog`) + `src/lib/prisma.ts` (helper `createAuditLog`), `src/lib/services/audit.service.ts`, `src/app/(dashboard)/audit-log/page.tsx`, `src/app/(dashboard)/audit-log/[id]/page.tsx`, `src/app/(dashboard)/audit-log/_components/*` | *Entity* log audit + *boundary* listing dan detail (SUPER_ADMIN). |
| 7 | Employee | `prisma/schema.prisma` (model `Employee`) + `src/lib/actions/employee.actions.ts`, `src/lib/services/employee.service.ts`, `src/lib/validations/employee.ts`, `src/app/(dashboard)/employees/page.tsx`, `src/app/(dashboard)/employees/new/page.tsx`, `src/app/(dashboard)/employees/[id]/page.tsx`, `src/app/(dashboard)/employees/_components/*`, `src/app/(dashboard)/employees/[id]/_components/*` | *Entity* karyawan + *boundary* daftar, formulir tambah, dan profil ber-*tab* (Personal, Employment, Tax/BPJS, Documents, Emergency Contacts). |
| 8 | EmployeeDocument | `prisma/schema.prisma` (model `EmployeeDocument`) + `src/lib/services/employee-document.service.ts`, `src/app/api/employees/[id]/documents/route.ts`, `src/app/api/employees/[id]/documents/[docId]/route.ts`, `src/app/(dashboard)/employees/[id]/_components/documents-tab.tsx` | *Entity* dokumen karyawan; *upload*/*download*/*delete* via REST API; penyimpanan *file* di *filesystem* lokal. |
| 9 | EmergencyContact | `prisma/schema.prisma` (model `EmergencyContact`) + `src/lib/actions/employee-document.actions.ts`, `src/app/(dashboard)/employees/[id]/_components/emergency-contacts-tab.tsx` | *Entity* kontak darurat karyawan (komposisi terhadap `Employee`). |
| 10 | AttendanceRecord | `prisma/schema.prisma` (model `AttendanceRecord`) + `src/lib/actions/attendance.actions.ts`, `src/lib/services/attendance.service.ts`, `src/lib/validations/attendance.ts`, `src/app/(dashboard)/attendance/page.tsx`, `src/app/(dashboard)/attendance-admin/page.tsx`, `src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx`, `src/app/(dashboard)/attendance/_components/*`, `src/app/(dashboard)/attendance-admin/_components/*`, `src/app/api/attendance/export/route.ts`, `src/lib/pdf/attendance-pdf.tsx` | *Entity* catatan kehadiran + fungsi `calculateAttendanceFlags`, ekspor CSV/Excel, PDF rekap. |
| 11 | LeaveRequest | `prisma/schema.prisma` (model `LeaveRequest`) + `src/lib/actions/leave.actions.ts`, `src/lib/services/leave.service.ts`, `src/lib/validations/leave.ts`, `src/app/(dashboard)/leave/page.tsx`, `src/app/(dashboard)/leave/manage/page.tsx`, `src/app/(dashboard)/leave/report/page.tsx`, `src/app/(dashboard)/leave/_components/*`, `src/app/(dashboard)/leave/manage/_components/*`, `src/app/(dashboard)/leave/report/_components/*` | *Entity* pengajuan cuti dengan *workflow* dua tahap (`PENDING_MANAGER` → `PENDING_HR` → `APPROVED`/`REJECTED`/`CANCELLED`). |
| 12 | LeaveBalance | `prisma/schema.prisma` (model `LeaveBalance`) + `src/lib/services/leave.service.ts`, `src/app/(dashboard)/leave/_components/leave-balance-card.tsx` | Saldo cuti per karyawan per `LeaveType` per tahun + fungsi `ensureLeaveBalances`. |
| 13 | PayrollRun | `prisma/schema.prisma` (model `PayrollRun`) + `src/lib/actions/payroll.actions.ts`, `src/lib/services/payroll.service.ts`, `src/lib/validations/payroll.ts`, `src/app/(dashboard)/payroll/page.tsx`, `src/app/(dashboard)/payroll/[periodId]/page.tsx`, `src/app/(dashboard)/payroll/_components/import-payroll-form.tsx`, `src/app/api/payroll/template/route.ts` | *Entity* periode *payroll* + tombol *finalize* dan unduh *template* Excel. |
| 14 | PayrollEntry | `prisma/schema.prisma` (model `PayrollEntry`) + `src/lib/services/payroll-import.service.ts` (`parsePayrollWorkbook`, `matchRowsToEmployees`, `persistImportedPayroll`), `src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx`, `finalize-button.tsx`, `src/app/(dashboard)/payslip/page.tsx`, `src/app/api/payroll/payslip/[entryId]/route.ts`, `src/app/api/payroll-report/route.ts`, `src/lib/pdf/payslip-pdf.tsx` | *Snapshot* gaji per karyawan per periode + generator PDF slip gaji. |
| 15 | Vacancy | `prisma/schema.prisma` (model `Vacancy`) + `src/lib/actions/recruitment.actions.ts`, `src/lib/services/recruitment.service.ts`, `src/lib/validations/recruitment.ts`, `src/app/(dashboard)/recruitment/page.tsx`, `src/app/(dashboard)/recruitment/new/page.tsx`, `src/app/(dashboard)/recruitment/_components/vacancy-table.tsx`, `src/app/(dashboard)/recruitment/new/_components/create-vacancy-form.tsx` | *Entity* lowongan + *toggle* status `OPEN`/`CLOSED`. |
| 16 | Candidate | `prisma/schema.prisma` (model `Candidate`) + `src/lib/actions/recruitment.actions.ts`, `src/lib/services/recruitment.service.ts`, `src/app/(dashboard)/recruitment/[vacancyId]/page.tsx`, `src/app/(dashboard)/recruitment/[vacancyId]/_components/kanban-board.tsx`, `add-candidate-dialog.tsx`, `src/app/(dashboard)/recruitment/candidates/[candidateId]/page.tsx`, `src/app/(dashboard)/recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx`, `src/app/api/recruitment/cv/route.ts`, `src/app/api/recruitment/offer-letter/[candidateId]/route.ts`, `src/lib/pdf/offer-letter-pdf.tsx` | *Entity* kandidat + *Kanban* drag-and-drop tahap kandidat, *upload* CV, generator PDF *offer letter*, dan konversi kandidat menjadi karyawan. |
| 17 | Interview | `prisma/schema.prisma` (model `Interview`) + `src/lib/actions/recruitment.actions.ts`, `src/app/(dashboard)/recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx` | *Entity* jadwal *interview* kandidat (komposisi terhadap `Candidate`). |

Selain ketujuh belas kelas inti tersebut, terdapat dua artefak pendukung yang tidak muncul sebagai kelas pada *class diagram* tetapi dimanfaatkan secara konsisten di seluruh modul: (a) *enum* bersama pada `src/types/enums.ts` yang menjadi mirror *client-safe* dari *enum* Prisma (`Role`, `Gender`, `ContractType`, `PTKPStatus`, `LeaveStatus`, `PayrollStatus`, `CandidateStage`, dst.); dan (b) helper `createAuditLog` di `src/lib/prisma.ts` yang dipanggil oleh seluruh *server action* HR/Admin untuk menulis ke kelas `AuditLog`. Dengan pemetaan pada Tabel 4.39, hubungan antara model konseptual pada *class diagram* dan struktur kode aktual menjadi eksplisit, sehingga pengembangan modul-modul selanjutnya pada sub-bab implementasi berikutnya (4.7.3 *Coding & Unit Testing* dan seterusnya) dapat merujuk langsung ke berkas-berkas tersebut tanpa ambiguitas.
