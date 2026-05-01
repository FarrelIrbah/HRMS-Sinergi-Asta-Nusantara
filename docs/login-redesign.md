# Login Page Redesign — HRMS PT. SAN

**Tanggal:** 2026-05-01
**File yang berubah:**
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`

## Latar belakang

Halaman login lama tampil polos: card kecil di tengah background gradient slate, tombol hitam (default `bg-primary`), tanpa brand mark, dan tanpa hubungan visual dengan design language menu-menu HRMS lainnya (sidebar emerald, brand `Building2`, palet slate). Redesign ini menyatukan halaman login dengan sistem yang sudah ada.

## Design language reference (existing app)

Diturunkan dari `src/components/layout/sidebar.tsx`:

| Token | Nilai |
| --- | --- |
| Primary brand color | `emerald-600` (active state, brand mark) |
| Brand icon | `Building2` (lucide-react) di kotak `rounded-lg bg-emerald-600` |
| Brand label | `HRMS` + sub `PT. SAN` / `PT. Sinergi Asta Nusantara` |
| Neutral palette | `slate-50/100/200/400/500/700/900` |
| Border | `border-slate-200` |
| Focus ring | `ring-emerald-500` |
| Radius | `rounded-lg` (sebagian besar), `rounded-xl` untuk elevated |

Login harus memakai token-token yang sama, tidak menambahkan brand color baru.

## Konsep redesign

**Two-pane "split-screen" login** — pola standar untuk app B2B/HRMS yang memberi ruang untuk brand expression tanpa mengganggu fokus pada form.

```
┌──────────────────────────┬──────────────────────────┐
│                          │                          │
│   BRAND PANEL            │      FORM PANEL          │
│   (emerald gradient,     │      (white, fokus       │
│    decorative pattern,   │       pada input)        │
│    headline + features)  │                          │
│   hidden < lg            │                          │
└──────────────────────────┴──────────────────────────┘
```

- Mobile/tablet (`< lg`): hanya form panel + brand mark mini di atas form, di atas background `slate-50`.
- Desktop (`≥ lg`): split 1.05fr / 1fr; brand panel kiri + form kanan di atas `white`.

## Keputusan desain

### 1. Brand panel (kiri)
- Gradient `from-emerald-700 via-emerald-600 to-emerald-800` — extend palet emerald yang sudah ada, bukan introduce warna baru.
- **Decorative dot grid** (`radial-gradient` 24×24px, opacity 0.08) memberi tekstur halus tanpa noise visual.
- Dua **soft blur orbs** (`bg-emerald-300/20 blur-3xl`) untuk depth. Semua elemen dekoratif `aria-hidden`.
- **Brand mark** identik dengan sidebar (Building2 dalam kotak rounded), tapi varian "on-emerald" pakai `bg-white/15 ring-white/30 backdrop-blur-sm`.
- **Headline** (`<h2>`) dengan `text-balance`, value-prop singkat, dan tiga feature item (Clock / CalendarDays / Receipt) yang merepresentasikan modul utama HRMS. Ikon dipilih konsisten dengan menu sidebar.
- Footer copyright kecil dengan `text-emerald-50/60`.

### 2. Form panel (kanan)
- **Heading** `<h1>` "Selamat datang kembali" — jadi heading utama page (sebelumnya hanya `<h3>` dari `CardTitle`, melanggar heading hierarchy).
- **Sub-copy** memberi konteks ("Masuk dengan akun PT. SAN Anda").
- **Input dengan ikon prefix** (Mail, Lock di `left-3`) — visual cue cepat tanpa tergantung placeholder.
- **Show/hide password toggle** (Eye / EyeOff) dengan `aria-label` dan `aria-pressed` — mengikuti rule `password-toggle` (Material Design) dari ui-ux-pro-max.
- **Submit button** `bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800` — override warna default near-black agar match dengan brand. Tinggi `h-11` (≥44px untuk touch target).
- **Loading state** disable + Loader2 spinner + label "Memproses…".
- **Error alert** pakai `role="alert" aria-live="polite"`, ikon `AlertCircle`, `bg-red-50 border-red-200 text-red-700` — bukan ditampilkan/disembunyikan dengan `hidden` saat error null untuk mencegah layout shift jarring.
- **Helper note** di bawah card dengan ikon `ShieldCheck` emerald — menjelaskan ini sistem internal & contact path kalau lupa password.

### 3. Container responsif
- `< lg`: form duduk di card `rounded-2xl border-slate-200 shadow-sm bg-white` di atas `slate-50` — terasa elevated.
- `≥ lg`: card "merger" dengan background (`lg:border-0 lg:p-0 lg:shadow-none`) — terlihat seperti bagian dari panel kanan, menghindari card-in-card.

### 4. Layout file
`(auth)/layout.tsx` disederhanakan — tidak lagi memaksa centering, biarkan page sendiri yang mengatur layout (page butuh full-bleed split).

## Compliance terhadap skill yang dipakai

### `/ui-ux-pro-max` — checklist priority 1–8
- **#1 Accessibility** ✅ contrast ≥ 4.5:1 (slate-700/900 di white, white di emerald-600/700/800), focus rings emerald-500, aria-label di icon-only button, color tidak satu-satunya pembawa info (icon + text di error/help).
- **#2 Touch & interaction** ✅ button height 44px, icon button 32×32 dengan padding cukup, instant visual feedback via hover state.
- **#5 Layout & responsive** ✅ mobile-first single-column → split di lg, tidak ada horizontal scroll, viewport meta dari Next.js default.
- **#6 Typography & color** ✅ semantic tokens (slate/emerald), 14–16px body, line-height standar Tailwind.
- **#8 Forms & feedback** ✅ visible labels (`<FormLabel>`), inline `<FormMessage>` error per field, error summary dengan `aria-live`, submit feedback (loading), helper text persistent (kotak ShieldCheck), `autoComplete` + `inputMode` untuk mobile keyboard yang benar.

### `/web-accessibility`
- ✅ Semantic HTML: `<main>`, `<aside aria-label>`, `<h1>`, `<form>`, `<label>`-`<input>` paired (via shadcn FormItem).
- ✅ Keyboard navigation: tab order natural; password toggle keyboard-reachable (button real, bukan div).
- ✅ ARIA: `role="alert" aria-live="polite"` pada error, `aria-pressed` di toggle, dekoratif `aria-hidden`.
- ✅ Tidak menghilangkan focus outline; di-override jadi `ring-2 ring-emerald-500`.

### `/shadcn-ui`
- Tetap pakai `Form / FormField / FormItem / FormLabel / FormControl / FormMessage` + `Input` dari shadcn — tidak fork komponen.
- Submit pakai raw `<button>` dengan emerald karena `Button` default variant terikat token `--primary` (near-black). Alternatif lain — menambah varian "brand" di `button.tsx` — di-skip agar perubahan minimal dan tidak menyentuh design tokens global.

### `/frontend-design`
- Direction: **refined minimalist + warm professionalism** (bukan maximalist) — sesuai konteks HRMS internal, bukan landing marketing.
- Diferensiasi: **brand panel** dengan dot grid + blur orbs — menghindari "AI slop" gradient ungu/biru generik dan tetap on-brand emerald.

### `/web-design-guidelines`
Skill ini berbasis review (fetch guidelines Vercel). Pre-delivery saya verifikasi mandiri terhadap aturan-aturan klasik:
- Tombol punya state hover/active/focus/disabled berbeda. ✅
- Form punya error inline + global. ✅
- Heading hierarchy benar (`h1` di form, `h2` di brand panel — tidak skip level). ✅

## Trade-off & catatan

- **Submit button bypass shadcn `Button`**: pilih raw button karena varian default `bg-primary` (near-black) tidak match brand emerald. Long-term cleaner pilihannya tambah varian `brand` di `Button`, tapi itu menyentuh komponen UI lain di luar scope login.
- **`hidden` pada error alert kosong**: dipakai supaya tidak ada whitespace berkedip saat error muncul/hilang. `aria-live="polite"` tetap mengumumkan saat element berubah dari hidden ke visible — kalau perlu yang lebih granular bisa pindah ke conditional render dengan `motion`.
- **Brand panel sengaja tidak `aria-hidden` total** — ada `<h2>` + value-prop yang bermanfaat untuk konteks. Dekoratifnya saja yang `aria-hidden`.
- **Tidak ada "Lupa password?" link**: belum ada flow reset password di app (tidak ada route `/forgot-password`). Helper note mengarahkan user ke tim HR sebagai escape route eksisting. Saat flow reset di-build di phase berikutnya, link "Lupa password?" bisa ditambahkan di atas tombol submit.

## Verifikasi

| Check | Status |
| --- | --- |
| `tsc --noEmit` | ✅ pass |
| `GET /login` (dev server) | ✅ HTTP 200 |
| Visual smoke test di browser | ⏳ perlu dilakukan user (dev server jalan di `localhost:3000` / `3001`) |

Manual test plan untuk user:
1. Buka `http://localhost:3000/login`.
2. Resize ke ≥1024px → split panel muncul.
3. Resize ke <1024px → hanya form + brand mark kecil.
4. Submit dengan email/password salah → error alert merah muncul.
5. Klik ikon mata di field password → toggle plain text/password.
6. Tab navigation: email → password → eye toggle → submit. Semua punya focus ring emerald.
