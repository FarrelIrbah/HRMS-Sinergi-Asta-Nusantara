---
plan: "06-03-employee-detail-recruitment-kanban-redesign"
phase: "06-ui-enhancement"
status: complete
completed: "2026-04-15"
type: feature
files_changed:
  - src/app/(dashboard)/employees/[id]/page.tsx
  - src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx
  - src/app/(dashboard)/employees/[id]/_components/personal-info-tab.tsx
  - src/app/(dashboard)/employees/[id]/_components/employment-details-tab.tsx
  - src/app/(dashboard)/employees/[id]/_components/tax-bpjs-tab.tsx
  - src/app/(dashboard)/employees/[id]/_components/documents-tab.tsx
  - src/app/(dashboard)/employees/[id]/_components/emergency-contacts-tab.tsx
  - src/app/(dashboard)/employees/[id]/_components/salary-tab.tsx
  - src/app/(dashboard)/recruitment/[vacancyId]/page.tsx
  - src/app/(dashboard)/recruitment/[vacancyId]/_components/kanban-board.tsx
  - src/components/ui/collapsible.tsx
revision_note: "Revision 2026-04-15: Split kanban ke zona Aktif (4-col grid) + zona Hasil Akhir (Collapsible 2-col). Tidak ada horizontal scroll."
skills_applied:
  - frontend-design
  - shadcn-ui
  - ui-ux-pro-max
  - web-accessibility
  - web-design-guidelines
---

# Feature 06-03: Employee Detail + Recruitment Kanban Redesign

Lanjutan dari plan 06-02 (Manajemen SDM Module Redesign). Menerapkan design
language yang sama — canvas `bg-slate-50`, palette emerald primary, tone-coded
card headers, dan typography hierarchy — ke tiga halaman detail:

1. **`/employees/[id]`** (Lihat Detail Karyawan) — halaman profil karyawan
   read-only untuk role `EMPLOYEE` dan `MANAGER`.
2. **`/employees/[id]`** (Edit Karyawan) — halaman yang sama dalam mode editable
   untuk role `HR_ADMIN` dan `SUPER_ADMIN`. Mode ditentukan oleh prop `readOnly`
   yang di-pass ke tiap tab.
3. **`/recruitment/[vacancyId]`** (Lihat Detail Rekrutmen) — halaman drag-n-drop
   kanban kandidat per lowongan.

## Tujuan

- **Konsistensi visual** dengan plan 06-01 (Super Admin Dashboard) dan 06-02
  (Modul SDM): canvas slate-50, card shadow-sm, tone-coded icon squares, meta
  grid dengan `<dl>` semantik.
- **Informative hero card** yang menampilkan foto/avatar, nama, status,
  identitas singkat, dan quick metadata (email, telp, dept, posisi, kontrak,
  tanggal join) sebelum tab bar.
- **Tab navigation modern**: active state emerald, count badges pada tab yang
  memiliki data (Dokumen, Kontak Darurat), horizontal scroll wrapper di mobile.
- **Kanban yang lebih readable**: kolom 280px dengan header berwarna per stage
  (slate/sky/amber/violet/emerald/rose), drop zone highlight on drag-over, kartu
  kandidat dengan avatar initial, badge meta (CV, jumlah wawancara, waktu
  wawancara berikutnya), drag grip yang eksplisit.
- **Aksesibel** (WCAG AA): aria-labels pada landmark, kartu, drop zones, dan
  tombol drag; keyboard sensor untuk @dnd-kit; focus-visible ring; struktur
  semantik `<nav>`, `<section>`, `<header>`, `<dl>/<dt>/<dd>`.

---

## Halaman 1 & 2: Employee Detail / Edit (`/employees/[id]`)

> Halaman yang sama dipakai untuk dua mode. `HR_ADMIN`/`SUPER_ADMIN` mendapat
> form editable; `EMPLOYEE` (self) dan `MANAGER` mendapat versi read-only (field
> `disabled`, tombol simpan disembunyikan, badge "Baca" ditampilkan).

### Sebelum

- Layout flat — tidak ada canvas terpisah, tidak ada breadcrumb.
- Header hanya nama, role pill, dan badge status tanpa context lain.
- Tidak ada foto/avatar karyawan.
- Metadata seperti email/telp/dept tidak terlihat sebelum mengklik tab.
- Tab bar memakai default shadcn styling (abu-abu, monokrom).
- Tab content cards memakai CardHeader polos tanpa ikon atau deskripsi.
- Form submit button menempel di bawah card tanpa affordance sticky.
- Tunjangan, dokumen, dan kontak darurat memakai list flat tanpa empty state
  yang informatif.

### Sesudah

#### Page Shell (`employees/[id]/page.tsx`)

- **Canvas**: `-m-4 min-h-[calc(100vh-4rem)] bg-slate-50 p-4 md:-m-6 md:p-6` —
  konsisten dengan 06-01/06-02.
- **Breadcrumb**: `<nav aria-label="Breadcrumb">` — link balik ke
  `/employees` dengan ikon `ArrowLeft`.
- **Inactive banner**: jika karyawan RESIGN/TERMINATED, ditampilkan alert
  rose-50 dengan `CircleX` icon di atas profile card.
- **Profile Hero Card** (`Card shadow-sm border-slate-200`):
  - `Avatar h-16 w-16` dengan `AvatarFallback` emerald-100 text-emerald-700 +
    inisial (ex: "BS" dari "Budi Santoso").
  - Judul `text-2xl font-semibold` + `Badge outline` status (AKTIF emerald,
    RESIGN slate, TERMINATED rose) dengan icon `CircleCheck`/`CircleX`.
  - Mode chip di pojok kanan: "Mode Edit" (emerald) atau "Mode Baca" (slate).
  - NIK dalam `font-mono tabular-nums` untuk kesan identifier.
  - Meta grid `<dl>` 4 kolom (`sm:grid-cols-4`) berisi MetaItem:
    - `Mail` — email
    - `Phone` — nomor telepon (fallback `—` jika null)
    - `Building2` — nama department
    - `Briefcase` — nama posisi
    - `FileSignature` — jenis kontrak (pakai `CONTRACT_TYPE_LABELS`)
    - `CalendarDays` — tanggal bergabung (format `dd MMM yyyy`, locale `id`)
    - `UserCircle` — role

#### Tab Bar (`employee-profile-tabs.tsx`)

- `TabsList` memakai `bg-white shadow-sm border-slate-200` dengan padding ringan.
- Tiap tab memakai **icon + label + count badge** (khusus Dokumen & Kontak
  Darurat). Icons: `UserRound` (Pribadi), `Briefcase` (Kepegawaian), `Receipt`
  (Pajak & BPJS), `FileText` (Dokumen), `PhoneCall` (Kontak Darurat), `Wallet`
  (Gaji — hanya tampil untuk HR_ADMIN/SUPER_ADMIN).
- Active state: `data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700`.
- Horizontal scroll wrapper untuk mobile: `overflow-x-auto` — tab bar tidak
  pecah ke baris kedua.

#### Tab Content Cards

Setiap tab memakai struktur yang sama:

```
<Card>
  <CardHeader> — ikon tone-coded + title + description + badge "Baca" (if readOnly)
  <CardContent> — form/data
<SaveBar> — hanya tampil jika NOT readOnly, berisi hint text + tombol simpan emerald-600
```

Tone per tab:
| Tab | Icon | Tone |
|---|---|---|
| Pribadi | `UserRound` | emerald |
| Kepegawaian | `Briefcase` | sky |
| Pajak & BPJS | `Receipt` | violet |
| Dokumen | `FileText` | amber |
| Kontak Darurat | `PhoneCall` | rose |
| Gaji | `Wallet` / `Coins` | emerald / sky |

**Highlights per tab:**

- **Pribadi**: email ditampilkan dalam kotak abu-abu (bg-slate-50, border-slate-200)
  karena tidak editable. Badge "Baca" di pojok kanan header saat readonly.
- **Kepegawaian**: NIK mono + badge status full-outline (emerald/slate). Form
  grid 1→2 kolom responsif.
- **Pajak & BPJS**: PPh21 checkbox sekarang di dalam callout card violet-50/40
  dengan icon `Info` violet — memperjelas implikasi pengaturan ini (pajak tetap
  dihitung & dilaporkan, hanya tidak dipotong dari gaji).
- **Dokumen**: upload area memakai border dashed slate-300 + icon `UploadCloud`
  emerald; tabel dengan badge tipe dokumen amber-50 ring-amber-100, hover row
  slate-50/60, ghost icon buttons (Download/Delete) dengan aria-label.
- **Kontak Darurat**: grid kartu 1→2→3 kolom; relationship sebagai badge
  rose-50 ring-rose-100; telepon jadi `tel:` link dengan hover underline
  emerald; action buttons fade-in on hover (`opacity-60 group-hover:opacity-100`);
  form emerald-tinted (bg-emerald-50/40) dengan icon header.
- **Gaji**: dua card terpisah — Gaji Pokok (Wallet/emerald) dan Tunjangan
  (Coins/sky). Input `Rp` prefix di dalam field (`font-mono tabular-nums`).
  Baris tunjangan di dalam mini-card slate-50/40 dengan tombol hapus rose.
  Empty state dashed border + icon `CircleDollarSign`.

#### Save Bar Pattern

Semua tab editable memakai save bar di bawah card:

```tsx
<div className="flex items-center justify-end gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
  <p className="mr-auto text-xs text-slate-500">{hint}</p>
  <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">…</Button>
</div>
```

Hint text memberikan konteks (contoh: "Perubahan data perpajakan mempengaruhi
perhitungan slip gaji berikutnya").

---

## Halaman 3: Recruitment Detail + Kanban (`/recruitment/[vacancyId]`)

### Sebelum

- Header flat — hanya judul & department, tidak ada context lain.
- Status lowongan sebagai solid badge default.
- Tidak ada ringkasan pipeline sebelum kanban.
- Kolom kanban: lebar 210px, latar `bg-muted/40` monokrom, tidak ada
  differensiasi warna antar stage.
- Kartu kandidat: hanya nama + email dengan border default; tidak ada indicator
  CV, jumlah wawancara, atau jadwal wawancara berikutnya.
- Tidak ada drag grip affordance — seluruh kartu jadi handle (mengaburkan klik
  ke detail).
- Tidak ada empty state per kolom.
- Tidak ada feedback on drag-over (kolom target tidak berubah warna).
- Tidak ada toast feedback pada stage change.

### Sesudah

#### Page Shell (`recruitment/[vacancyId]/page.tsx`)

- Canvas `bg-slate-50` konsisten, breadcrumb → `/recruitment`.
- **Vacancy Hero Card**:
  - Ikon `Briefcase` emerald-600 square `h-12 w-12`.
  - Status badge outline: OPEN = emerald (`CircleCheck`), CLOSED = slate
    (`CircleX`).
  - Meta grid 4 kolom: CalendarDays (dibuka), CalendarClock (ditutup — `—`
    bila null), Users (total kandidat), KanbanSquare (jumlah tahap aktif,
    exclude DITERIMA/DITOLAK).
- **Pipeline Summary strip**: 4 kartu tile untuk tahap aktif saja
  (`grid-cols-2 sm:grid-cols-4`) — tile DITERIMA/DITOLAK dihilangkan karena
  ringkasan count-nya sudah tampil di trigger Collapsible "Hasil Akhir".
- **Kanban dibungkus Card**: header ikon `KanbanSquare` + judul "Pipeline
  Kandidat" + hint text "Tarik & lepaskan kartu untuk mengubah tahap".

#### Kanban Board (`kanban-board.tsx`) — Revisi: Active/Terminal Split

> **Revisi 2026-04-15 (zero horizontal scroll)**: versi awal pakai 6 kolom
> sejajar `w-[280px]` (~1700px total) yang memaksa horizontal scroll. Direvisi
> dengan memisahkan pipeline menjadi dua zona sesuai pola ATS modern (Lever,
> Greenhouse, Workable): **Active (4 tahap berjalan)** sebagai kanban utama
> auto-fit, dan **Terminal (2 tahap akhir)** sebagai Collapsible di bawah.

##### Color-coded stages

Palette STAGE_TONES didefinisikan sekali dengan mapping tiap stage ke object
berisi: `header` (bg+border), `dot`, `count`, `columnBg`, `columnBorder`,
`columnOver` (drop highlight), `avatarBg`, `avatarText`, `accentText`.

| Stage | Tone | Zona |
|---|---|---|
| MELAMAR | slate | Active |
| SELEKSI_BERKAS | sky | Active |
| INTERVIEW | amber | Active |
| PENAWARAN | violet | Active |
| DITERIMA | emerald | Terminal |
| DITOLAK | rose | Terminal |

##### Active Zone — `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`

4 kolom aktif memakai CSS Grid `lg:grid-cols-4` sehingga lebar kolom **mengikuti
viewport** (bukan fixed 280px). Di layar 1280px main content, tiap kolom ~225px;
di layar 1440px+ jadi ~260px. Tidak ada scroll horizontal lagi.

- `<section>` dengan `aria-label="Kolom <Label>"` per kolom
- Header `rounded-t-lg` dengan dot + label uppercase + count badge tone-coded
- Body `rounded-b-lg` dengan background tone-coded opacity 40%, `min-h-[340px]`
- **Drop highlight**: saat `isOver`, body → `bg-{tone}-100/70 ring-2 ring-{tone}-300`
- **Empty state**: dashed box dengan icon `UserPlus` + hint

##### Terminal Zone — `<Collapsible>`

DITERIMA dan DITOLAK dipisah jadi section tersendiri karena keduanya adalah
**terminal states** — kandidat jarang kembali ke pipeline aktif sehingga tidak
perlu memakan real estate yang sama dengan tahap aktif.

- **Trigger**: tombol full-width mirip card header dengan `<Flag>` icon slate,
  label "Hasil Akhir", total count badge, dan **inline summary**:
  `● 1 diterima · ● 0 ditolak` (dot emerald + dot rose).
- **Avatar preview stack** (md+, saat tertutup): stack inisial 3 kandidat
  pertama per stage dengan `+N` indicator — memberi glanceable preview tanpa
  perlu expand.
- **Content**: `grid grid-cols-1 md:grid-cols-2` dengan 2 kolom terminal yang
  lebih pendek (`min-h-[200px]`) — sesuai volume rendah.
- **Auto-expand on drag**: state `effectiveOpen = terminalOpen || isDragging`
  — saat user mulai drag kartu dari zona aktif, Collapsible otomatis terbuka
  sehingga drop zone DITERIMA/DITOLAK langsung reachable tanpa klik toggle dulu.
- **ChevronDown** di trigger berotasi 180° saat terbuka (`rotate-180`).

##### Rationale (why split, not uniform)

| Aspek | Uniform 6-col horizontal-scroll | Active/Terminal split |
|---|---|---|
| Horizontal scroll | Ya (~1700px) | **Tidak** (fit viewport) |
| Konsistensi mental model | Semua stage equal weight | Mencerminkan alur nyata (active vs closed) |
| Focus pengguna | Harus scroll untuk lihat semua | 4 stage aktif visible instan |
| Terminal stages | Sama besar dengan aktif | Collapsed by default — rendah noise |
| Industry pattern | Uncommon di ATS modern | Pattern standar (Lever, Greenhouse, Workable) |
| Drag terminal | Perlu scroll horizontal dulu | Auto-expand on dragstart |

##### Candidate Card

Struktur baru dibagi 2 bagian untuk memisahkan drag handle dari area klik:

1. **Drag handle row** (`border-b border-slate-100`):
   - Tombol `GripVertical` di kiri — satu-satunya surface drag (`{...listeners}`).
     Menghindari konflik drag vs click-to-detail.
   - Stage chip di kanan (dot + label kompak).
2. **Body** (`<Link>` ke `/recruitment/candidates/[id]`):
   - `Avatar h-9 w-9` dengan `AvatarFallback` tone-coded + inisial (ex "FA"
     dari "Farrel Amir").
   - Nama `font-semibold` + email dengan icon `Mail`.
   - Nomor telepon (jika ada) dengan icon `Phone` font-mono.
   - Row meta chips:
     - `FileText` slate chip bila `cvPath` ada.
     - `Users` amber chip dengan jumlah wawancara.
     - `CalendarClock` sky chip dengan `formatDistanceToNow` wawancara terdekat
       (locale `id`, ex: "dalam 3 hari").
   - Hover `bg-slate-50/60`, focus-visible ring emerald.

##### DnD improvements

- `useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })`
  — keyboard DnD fallback (space untuk pick, arrow keys untuk move, enter untuk
  drop).
- **Drag overlay**: memakai card yang sama dengan tone dari stage aktual
  kandidat + ring emerald-200 supaya jelas ini yang dipindahkan.
- `e.stopPropagation()` + `e.onPointerDown` di Link body supaya klik detail
  tidak memicu drag.
- **Toast feedback**: berhasil → `toast.success("Kandidat dipindahkan ke
  Interview")`, gagal → rollback + `toast.error(result.error)`.

---

## Design Tokens

Semua perubahan menggunakan token dari 06-01/06-02 yang sudah established:

- **Canvas**: `-m-4 min-h-[calc(100vh-4rem)] bg-slate-50 p-4 md:-m-6 md:p-6`
- **Card**: `border-slate-200 shadow-sm`
- **Icon square**: `h-9 w-9 rounded-lg bg-{tone}-50 text-{tone}-700 ring-1 ring-{tone}-100`
- **Primary button**: `bg-emerald-600 hover:bg-emerald-700`
- **Soft outline badge**: `border-{tone}-200 bg-{tone}-50 text-{tone}-700`
- **Mono identifier**: `font-mono tabular-nums`
- **Save bar**: `rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm`

## Accessibility Checklist

- [x] `<nav aria-label="Breadcrumb">` pada kedua halaman
- [x] `<dl>/<dt>/<dd>` untuk key-value metadata
- [x] `<section aria-label>` pada kolom kanban dan pipeline summary
- [x] `<header>` di kolom kanban untuk landmark
- [x] `aria-hidden="true"` pada ikon dekoratif
- [x] `aria-label` eksplisit pada tombol icon-only (drag handle, edit, delete,
      download)
- [x] Keyboard sensor untuk @dnd-kit (space + arrow + enter)
- [x] `aria-dropeffect="move"` pada drop zones
- [x] Focus-visible ring emerald pada link & button
- [x] Empty state menjelaskan kondisi tidak informatif ("Belum ada kandidat,
      dokumen, kontak darurat") dan cara bertindak
- [x] Status karyawan inactive diumumkan via banner rose sebelum profile
- [x] Kontras warna teks di atas bg tone ≥ WCAG AA (text-{tone}-700 di atas
      bg-{tone}-50)

## Type-check

```
rtk tsc --noEmit
→ 0 errors on redesigned files
→ 1 pre-existing error di add-candidate-wrapper.tsx (dead code, tidak diimpor
  di mana pun — sisa dari refactor 05-04)
```

## Dependency Notes

- **Install baru (revisi)**: `shadcn-ui add collapsible` — menambahkan
  `src/components/ui/collapsible.tsx` (thin wrapper Radix) dan
  `@radix-ui/react-collapsible` sebagai dependency. Dipakai untuk zona Terminal.
- Komponen shadcn lain (Avatar, Badge, Card, Tabs, Tooltip, Separator) sudah
  tersedia sebelumnya.
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` sudah ada dari
  plan 05-04.
- `date-fns` + `date-fns/locale` (id) sudah dipakai di seluruh project.

## Files Changed (10)

**Employee Detail / Edit:**
1. `src/app/(dashboard)/employees/[id]/page.tsx` — page shell + profile hero
2. `src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx` — tab bar
3. `src/app/(dashboard)/employees/[id]/_components/personal-info-tab.tsx`
4. `src/app/(dashboard)/employees/[id]/_components/employment-details-tab.tsx`
5. `src/app/(dashboard)/employees/[id]/_components/tax-bpjs-tab.tsx`
6. `src/app/(dashboard)/employees/[id]/_components/documents-tab.tsx`
7. `src/app/(dashboard)/employees/[id]/_components/emergency-contacts-tab.tsx`
8. `src/app/(dashboard)/employees/[id]/_components/salary-tab.tsx`

**Recruitment Kanban:**
9. `src/app/(dashboard)/recruitment/[vacancyId]/page.tsx` — vacancy hero + pipeline summary
10. `src/app/(dashboard)/recruitment/[vacancyId]/_components/kanban-board.tsx` — tone-coded columns + rich cards + a11y

## Next

Modul lain (Absensi, Izin, Payroll, Settings) belum diredesign menyeluruh.
Pattern yang dipakai di 06-01/06-02/06-03 (canvas slate, tone-coded card
headers, save bar, MetaItem + `<dl>`) siap direplikasi di modul berikutnya
untuk konsistensi end-to-end.
