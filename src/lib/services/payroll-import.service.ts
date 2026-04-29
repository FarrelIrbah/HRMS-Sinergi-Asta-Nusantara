/**
 * Payroll Import Service
 *
 * Parses an uploaded xlsx/csv buffer (Talenta-style payslip columns)
 * into structured rows + validation errors. Performs structural validation
 * only — does not match NIK to Employee. Caller (server action) does the DB lookup.
 */
import * as XLSX from "xlsx";

// ─── Column Contract ──────────────────────────────────────────────────────────
//
// IMPORTANT: order/labels must match the template generator exactly.

export const PAYROLL_COLUMNS = [
  "NIK",
  "Nama Karyawan",
  "Job Position",
  "Organization",
  "Grade / Level",
  "PTKP",
  "NPWP",
  "Basic Salary",
  "Tunjangan Komunikasi",
  "Tunjangan Kehadiran",
  "Tunjangan Jabatan",
  "Tunjangan Lainnya",
  "Tax Allowance",
  "THR",
  "BPJS Kesehatan Employee",
  "JHT Employee",
  "Jaminan Pensiun Employee",
  "PPH 21",
  "Potongan Keterlambatan",
  "Potongan Koperasi",
  "Potongan Lainnya",
  "JKK",
  "JKM",
  "JHT Company",
  "Jaminan Pensiun Company",
  "BPJS Kesehatan Company",
  "Actual Working Day",
  "Schedule Working Day",
  "Dayoff",
  "National Holiday",
  "Company Holiday",
  "Special Holiday",
  "Attendance Codes",
] as const;

export type PayrollColumn = (typeof PAYROLL_COLUMNS)[number];

const REQUIRED_TEXT_COLS: PayrollColumn[] = [
  "NIK",
  "Nama Karyawan",
  "Job Position",
  "Organization",
  "Grade / Level",
  "PTKP",
];

const NUMBER_COLS: PayrollColumn[] = [
  "Basic Salary",
  "Tunjangan Komunikasi",
  "Tunjangan Kehadiran",
  "Tunjangan Jabatan",
  "Tunjangan Lainnya",
  "Tax Allowance",
  "THR",
  "BPJS Kesehatan Employee",
  "JHT Employee",
  "Jaminan Pensiun Employee",
  "PPH 21",
  "Potongan Keterlambatan",
  "Potongan Koperasi",
  "Potongan Lainnya",
  "JKK",
  "JKM",
  "JHT Company",
  "Jaminan Pensiun Company",
  "BPJS Kesehatan Company",
];

const INT_COLS: PayrollColumn[] = [
  "Actual Working Day",
  "Schedule Working Day",
  "Dayoff",
  "National Holiday",
  "Company Holiday",
  "Special Holiday",
];

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface ParsedPayrollRow {
  rowNumber: number; // 1-based, excludes header (row 1 of data → rowNumber 1)
  nik: string;
  employeeName: string;
  jobPosition: string;
  organization: string;
  gradeLevel: string;
  ptkpStatus: string;
  npwp: string | null;

  basicSalary: number;
  tunjanganKomunikasi: number;
  tunjanganKehadiran: number;
  tunjanganJabatan: number;
  tunjanganLainnya: number;
  taxAllowance: number;
  thr: number;

  bpjsKesehatanEmployee: number;
  jhtEmployee: number;
  jaminanPensiunEmployee: number;
  pph21: number;
  potonganKeterlambatan: number;
  potonganKoperasi: number;
  potonganLainnya: number;

  jkk: number;
  jkm: number;
  jhtCompany: number;
  jaminanPensiunCompany: number;
  bpjsKesehatanCompany: number;

  actualWorkingDay: number;
  scheduleWorkingDay: number;
  dayoff: number;
  nationalHoliday: number;
  companyHoliday: number;
  specialHoliday: number;
  attendanceCodes: string;

  // Computed totals
  totalEarnings: number;
  totalDeductions: number;
  totalBenefits: number;
  takeHomePay: number;
}

export interface PayrollImportError {
  rowNumber: number | null; // null = file-level error
  column?: PayrollColumn | string;
  message: string;
}

export interface PayrollImportResult {
  rows: ParsedPayrollRow[];
  errors: PayrollImportError[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value).trim();
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[.,\s]/g, (m) => (m === "," ? "." : ""));
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toInt(value: unknown): number | null {
  const n = toNumber(value);
  if (n === null) return null;
  return Math.round(n);
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

/**
 * Parse an xlsx/csv buffer into payroll rows + validation errors.
 * Structural validation only: column presence, required fields, numeric format,
 * negative-amount check, duplicate NIK. NIK→Employee matching is the caller's job.
 */
export function parsePayrollWorkbook(buffer: Buffer): PayrollImportResult {
  const errors: PayrollImportError[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    return {
      rows: [],
      errors: [{ rowNumber: null, message: "File tidak dapat dibaca — pastikan format Excel (.xlsx) atau CSV." }],
    };
  }

  // Prefer sheet "Payroll" if present, else first sheet
  const sheetName = workbook.SheetNames.includes("Payroll")
    ? "Payroll"
    : workbook.SheetNames[0];
  if (!sheetName) {
    return {
      rows: [],
      errors: [{ rowNumber: null, message: "Workbook tidak memiliki sheet apa pun." }],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const aoa: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  if (aoa.length < 2) {
    return {
      rows: [],
      errors: [{ rowNumber: null, message: "File kosong — minimal harus ada 1 baris header dan 1 baris data." }],
    };
  }

  // ── Validate header ────────────────────────────────────────────────────────
  const headerRow = aoa[0].map(toCell);
  const colIndex = new Map<PayrollColumn, number>();

  for (const col of PAYROLL_COLUMNS) {
    const idx = headerRow.findIndex((h) => h.toLowerCase() === col.toLowerCase());
    if (idx === -1) {
      errors.push({
        rowNumber: null,
        column: col,
        message: `Kolom "${col}" tidak ditemukan di header.`,
      });
    } else {
      colIndex.set(col, idx);
    }
  }

  if (errors.length > 0) {
    return { rows: [], errors };
  }

  // ── Parse rows ─────────────────────────────────────────────────────────────
  const rows: ParsedPayrollRow[] = [];
  const seenNik = new Set<string>();

  for (let r = 1; r < aoa.length; r++) {
    const raw = aoa[r];
    const rowNumber = r; // 1-based excluding header

    const nik = toCell(raw[colIndex.get("NIK")!]);

    // Skip fully empty rows
    if (
      nik === "" &&
      toCell(raw[colIndex.get("Nama Karyawan")!]) === "" &&
      toNumber(raw[colIndex.get("Basic Salary")!]) === 0
    ) {
      continue;
    }

    let rowHasError = false;

    // Required text fields
    for (const col of REQUIRED_TEXT_COLS) {
      const val = toCell(raw[colIndex.get(col)!]);
      if (val === "") {
        errors.push({
          rowNumber,
          column: col,
          message: `Kolom "${col}" wajib diisi.`,
        });
        rowHasError = true;
      }
    }

    // Duplicate NIK in upload
    if (nik !== "" && seenNik.has(nik)) {
      errors.push({
        rowNumber,
        column: "NIK",
        message: `NIK "${nik}" muncul lebih dari sekali di file.`,
      });
      rowHasError = true;
    } else if (nik !== "") {
      seenNik.add(nik);
    }

    // Numeric fields
    const numericValues: Record<string, number> = {};
    for (const col of NUMBER_COLS) {
      const parsed = toNumber(raw[colIndex.get(col)!]);
      if (parsed === null) {
        errors.push({
          rowNumber,
          column: col,
          message: `Kolom "${col}" harus berupa angka.`,
        });
        rowHasError = true;
        continue;
      }
      if (parsed < 0) {
        errors.push({
          rowNumber,
          column: col,
          message: `Kolom "${col}" tidak boleh negatif.`,
        });
        rowHasError = true;
        continue;
      }
      numericValues[col] = parsed;
    }

    // Integer fields
    const intValues: Record<string, number> = {};
    for (const col of INT_COLS) {
      const parsed = toInt(raw[colIndex.get(col)!]);
      if (parsed === null) {
        errors.push({
          rowNumber,
          column: col,
          message: `Kolom "${col}" harus berupa angka bulat.`,
        });
        rowHasError = true;
        continue;
      }
      if (parsed < 0) {
        errors.push({
          rowNumber,
          column: col,
          message: `Kolom "${col}" tidak boleh negatif.`,
        });
        rowHasError = true;
        continue;
      }
      intValues[col] = parsed;
    }

    if (rowHasError) continue;

    const npwpRaw = toCell(raw[colIndex.get("NPWP")!]);
    const attendanceCodes = toCell(raw[colIndex.get("Attendance Codes")!]);

    const totalEarnings =
      numericValues["Basic Salary"] +
      numericValues["Tunjangan Komunikasi"] +
      numericValues["Tunjangan Kehadiran"] +
      numericValues["Tunjangan Jabatan"] +
      numericValues["Tunjangan Lainnya"] +
      numericValues["Tax Allowance"] +
      numericValues["THR"];

    const totalDeductions =
      numericValues["BPJS Kesehatan Employee"] +
      numericValues["JHT Employee"] +
      numericValues["Jaminan Pensiun Employee"] +
      numericValues["PPH 21"] +
      numericValues["Potongan Keterlambatan"] +
      numericValues["Potongan Koperasi"] +
      numericValues["Potongan Lainnya"];

    const totalBenefits =
      numericValues["JKK"] +
      numericValues["JKM"] +
      numericValues["JHT Company"] +
      numericValues["Jaminan Pensiun Company"] +
      numericValues["BPJS Kesehatan Company"];

    const takeHomePay = totalEarnings - totalDeductions;

    rows.push({
      rowNumber,
      nik,
      employeeName: toCell(raw[colIndex.get("Nama Karyawan")!]),
      jobPosition: toCell(raw[colIndex.get("Job Position")!]),
      organization: toCell(raw[colIndex.get("Organization")!]),
      gradeLevel: toCell(raw[colIndex.get("Grade / Level")!]),
      ptkpStatus: toCell(raw[colIndex.get("PTKP")!]),
      npwp: npwpRaw === "" ? null : npwpRaw,

      basicSalary: numericValues["Basic Salary"],
      tunjanganKomunikasi: numericValues["Tunjangan Komunikasi"],
      tunjanganKehadiran: numericValues["Tunjangan Kehadiran"],
      tunjanganJabatan: numericValues["Tunjangan Jabatan"],
      tunjanganLainnya: numericValues["Tunjangan Lainnya"],
      taxAllowance: numericValues["Tax Allowance"],
      thr: numericValues["THR"],

      bpjsKesehatanEmployee: numericValues["BPJS Kesehatan Employee"],
      jhtEmployee: numericValues["JHT Employee"],
      jaminanPensiunEmployee: numericValues["Jaminan Pensiun Employee"],
      pph21: numericValues["PPH 21"],
      potonganKeterlambatan: numericValues["Potongan Keterlambatan"],
      potonganKoperasi: numericValues["Potongan Koperasi"],
      potonganLainnya: numericValues["Potongan Lainnya"],

      jkk: numericValues["JKK"],
      jkm: numericValues["JKM"],
      jhtCompany: numericValues["JHT Company"],
      jaminanPensiunCompany: numericValues["Jaminan Pensiun Company"],
      bpjsKesehatanCompany: numericValues["BPJS Kesehatan Company"],

      actualWorkingDay: intValues["Actual Working Day"],
      scheduleWorkingDay: intValues["Schedule Working Day"],
      dayoff: intValues["Dayoff"],
      nationalHoliday: intValues["National Holiday"],
      companyHoliday: intValues["Company Holiday"],
      specialHoliday: intValues["Special Holiday"],
      attendanceCodes,

      totalEarnings,
      totalDeductions,
      totalBenefits,
      takeHomePay,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push({
      rowNumber: null,
      message: "File tidak memiliki baris data yang valid.",
    });
  }

  return { rows, errors };
}

// ─── Template Generator ───────────────────────────────────────────────────────

export function buildPayrollTemplate(periodLabel: string): Buffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Payroll
  const sample = [
    "EMP-0001",
    "Budi Santoso",
    "Kepala Departemen Business Unit",
    "Property Management",
    "- / Manager",
    "TK/0",
    "12.345.678.9-012.000",
    11_880_000,
    400_000,
    2_040_000,
    3_000_000,
    0,
    1_522_202,
    0,
    120_000,
    297_600,
    110_863,
    1_522_202,
    71_750,
    1_300_000,
    0,
    132_432,
    44_640,
    550_560,
    221_726,
    480_000,
    31,
    31,
    8,
    5,
    0,
    0,
    "H:15d CT:2d A:2d",
  ];

  const ws = XLSX.utils.aoa_to_sheet([
    [...PAYROLL_COLUMNS],
    sample,
  ]);

  // Column widths roughly proportional to header length
  ws["!cols"] = PAYROLL_COLUMNS.map((c) => ({
    wch: Math.max(12, Math.min(28, c.length + 2)),
  }));

  XLSX.utils.book_append_sheet(wb, ws, "Payroll");

  // Sheet 2: Petunjuk
  const guide = [
    [`PETUNJUK PENGISIAN — Template Penggajian ${periodLabel}`],
    [],
    ["1. Isi data setiap karyawan satu baris di sheet \"Payroll\"."],
    ["2. NIK harus persis sama dengan NIK karyawan aktif di sistem."],
    ["3. Kolom angka: gunakan format angka biasa (tanpa Rp, tanpa pemisah ribuan), contoh 11880000."],
    ["4. Kolom kosong di-treat sebagai 0 (untuk angka) atau \"\" (untuk teks)."],
    ["5. Sistem akan menghitung Total Earnings, Total Deductions, Total Benefits, dan Take Home Pay otomatis."],
    [],
    ["KATEGORI KOLOM"],
    ["Identitas — NIK, Nama Karyawan, Job Position, Organization, Grade / Level, PTKP, NPWP"],
    ["Earnings — Basic Salary + Tunjangan Komunikasi/Kehadiran/Jabatan/Lainnya + Tax Allowance + THR"],
    ["THR — isi hanya pada periode pembayaran THR (Lebaran/Natal). Bulan biasa boleh dikosongkan / 0."],
    ["Deductions — BPJS Kes/JHT/JP Employee + PPH 21 + Potongan Keterlambatan/Koperasi/Lainnya"],
    ["Benefits — JKK, JKM, JHT/JP/BPJS Kes Company (porsi perusahaan, tidak masuk THP)"],
    ["Attendance — Actual/Schedule Working Day, Dayoff, Holiday types, Attendance Codes (free text)"],
  ];
  const guideWs = XLSX.utils.aoa_to_sheet(guide);
  guideWs["!cols"] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, guideWs, "Petunjuk");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
