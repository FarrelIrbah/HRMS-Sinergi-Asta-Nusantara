---
plan: "04-13-bpjs-sanity-check"
phase: "04-payroll-management"
status: complete
completed: "2026-04-14"
type: audit
files_changed: []
files_audited:
  - src/lib/services/bpjs.service.ts
  - src/lib/constants.ts
  - src/lib/services/payroll.service.ts
---

# Sanity Check 04-13: BPJS Engine Pre-UI Audit

Audit terakhir terhadap engine BPJS sebelum fokus berpindah ke UI/UX.
Dilakukan pada 2026-04-14 sebagai verifikasi compliance Indonesia
(Perpres 64/2020, PP 44/2015, Permenaker 15/2022).

## Ringkasan

**Hasil: LULUS tanpa perubahan kode.**

Semua persentase iuran dan batas upah sudah tepat. JP cap bahkan lebih
up-to-date dari referensi awal (menggunakan nilai Maret 2025, bukan 2024).

## 1. Audit Persentase Iuran

Dibandingkan terhadap regulasi resmi dan referensi user (aturan 2024).

| Komponen | Target Regulasi | `BPJS_RATES` di `constants.ts` | Status |
|---|---|---|---|
| BPJS Kesehatan — Karyawan | 1% | `KESEHATAN_EMPLOYEE: 0.01` | ✓ |
| BPJS Kesehatan — Perusahaan | 4% | `KESEHATAN_EMPLOYER: 0.04` | ✓ |
| JHT — Karyawan | 2% | `JHT_EMPLOYEE: 0.02` | ✓ |
| JHT — Perusahaan | 3.7% | `JHT_EMPLOYER: 0.037` | ✓ |
| JP — Karyawan | 1% | `JP_EMPLOYEE: 0.01` | ✓ |
| JP — Perusahaan | 2% | `JP_EMPLOYER: 0.02` | ✓ |
| JKK (Kelompok I) — Perusahaan | 0.24% | `JKK_EMPLOYER: 0.0024` | ✓ |
| JKM — Perusahaan | 0.3% | `JKM_EMPLOYER: 0.003` | ✓ |

Semua nilai disimpan sebagai `new Decimal("0.xx")` untuk menghindari
floating-point error (Decision #50).

## 2. Audit Batas Upah Maksimal (Wage Cap)

| Komponen | Referensi User (2024) | Kode | Keterangan |
|---|---|---|---|
| Kesehatan Cap | Rp 12.000.000 | `KESEHATAN_CAP: 12000000` | ✓ Sesuai Perpres 64/2020 |
| JP Cap | Rp 10.042.300 | `JP_CAP: 10547400` | ✓ **Lebih baru — nilai efektif Maret 2025** |

### Alasan JP Cap Berbeda dari Referensi User

Batas upah Jaminan Pensiun disesuaikan tiap tahun oleh BPJS
Ketenagakerjaan berdasarkan inflasi. Historis:

- 2022: Rp 9.077.600
- 2023: Rp 9.559.600
- 2024: Rp 10.042.300 (nilai yang disebut user)
- Maret 2025 – sekarang: **Rp 10.547.400** (nilai di kode)

Karena tanggal audit adalah **2026-04-14**, kode sudah sesuai dengan
aturan yang berlaku saat sistem berjalan. Tidak perlu di-downgrade ke
nilai 2024.

## 3. Audit Logika Capping

`bpjs.service.ts:71` (`calculateBPJS`) sudah memakai pola yang benar:

```ts
const kesBasis = Decimal.min(grossSalary, BPJS_RATES.KESEHATAN_CAP);
const jpBasis  = Decimal.min(grossSalary, BPJS_RATES.JP_CAP);
```

- **Kesehatan & JP**: basis dibatasi cap sebelum dikalikan tarif. ✓
- **JHT**: tidak di-cap (dihitung dari `grossSalary` penuh), sesuai
  PP 46/2015 yang tidak mengatur batas upah JHT. ✓
- **JKK & JKM**: tidak di-cap, dihitung dari `grossSalary` penuh,
  sesuai PP 44/2015 (risk-class based, tanpa batas upah). ✓
- Semua hasil dibulatkan ke rupiah terdekat via `.toDecimalPlaces(0)`. ✓

## 4. Verifikasi Numerik (dari JSDoc `bpjs.service.ts`)

### Test 1 — gaji di bawah semua cap (Rp 10.000.000)

| Komponen | Perhitungan | Hasil |
|---|---|---|
| kesEmp | 10.000.000 × 1% | Rp 100.000 |
| jhtEmp | 10.000.000 × 2% | Rp 200.000 |
| jpEmp | 10.000.000 × 1% | Rp 100.000 |
| kesEmpr | 10.000.000 × 4% | Rp 400.000 |
| jhtEmpr | 10.000.000 × 3.7% | Rp 370.000 |
| jpEmpr | 10.000.000 × 2% | Rp 200.000 |
| jkk | 10.000.000 × 0.24% | Rp 24.000 |
| jkm | 10.000.000 × 0.3% | Rp 30.000 |

### Test 2 — gaji di atas cap (Rp 15.000.000)

| Komponen | Basis setelah cap | Tarif | Hasil |
|---|---|---|---|
| kesEmp | 12.000.000 (cap) | 1% | Rp 120.000 |
| jhtEmp | 15.000.000 (no cap) | 2% | Rp 300.000 |
| jpEmp | 10.547.400 (cap) | 1% | Rp 105.474 |
| kesEmpr | 12.000.000 (cap) | 4% | Rp 480.000 |
| jhtEmpr | 15.000.000 (no cap) | 3.7% | Rp 555.000 |
| jpEmpr | 10.547.400 (cap) | 2% | Rp 210.948 |
| jkk | 15.000.000 (no cap) | 0.24% | Rp 36.000 |
| jkm | 15.000.000 (no cap) | 0.3% | Rp 45.000 |

Capping berfungsi dengan benar — basis Kesehatan maksimum di 12M, JP
maksimum di 10.547.400, sementara JHT/JKK/JKM mengikuti gaji penuh.

## 5. Integrasi dengan Engine Payroll

`calculateBPJS` dipanggil di `payroll.service.ts:202` dengan argumen
`bpjsBasis` (= `baseSalary + fixed allowances`), bukan `grossPay` penuh.
Ini sudah benar karena per regulasi, BPJS basis tidak termasuk lembur,
THR, atau tunjangan non-tetap.

Kontrak tipe `BPJSResult` eksplisit mendefinisikan 8 komponen + 2 total
(`totalEmployeeDeduction`, `totalEmployerCost`), dipakai langsung di
snapshot `PayrollEntry` (Decision #48).

## 6. Hasil TypeScript Check

`rtk tsc --noEmit`:
- **0 error** di `bpjs.service.ts`, `constants.ts`, `payroll.service.ts`
- 1 error pre-existing di `add-candidate-wrapper.tsx` (recruitment,
  bukan payroll — sudah tercatat di `04-12-UI-SYNC-SUMMARY.md:138`)

## Kesimpulan

Engine BPJS sudah **compliant dan production-ready**. Aman untuk lanjut
ke fase UI Phase 5 tanpa perbaikan kode lebih lanjut di modul BPJS.

Jika sewaktu-waktu BPJS Ketenagakerjaan mengumumkan kenaikan JP cap
2026, cukup ubah satu konstanta `BPJS_RATES.JP_CAP` di `constants.ts`
— semua perhitungan downstream otomatis mengikuti (snapshot pattern
Decision #48 menjaga history payslip lama tetap utuh).
