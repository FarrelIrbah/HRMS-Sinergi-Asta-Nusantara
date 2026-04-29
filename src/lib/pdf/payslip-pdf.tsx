import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayslipData {
  companyName: string;
  payrollCutoff: string; // e.g. "01 - 30 Apr 2026"
  employeeNik: string;
  employeeName: string;
  jobPosition: string;
  organization: string;
  gradeLevel: string;
  ptkpStatus: string;
  npwp: string | null;

  // Earnings
  basicSalary: number;
  tunjanganKomunikasi: number;
  tunjanganKehadiran: number;
  tunjanganJabatan: number;
  tunjanganLainnya: number;
  taxAllowance: number;
  thr: number;
  totalEarnings: number;

  // Deductions
  bpjsKesehatanEmployee: number;
  jhtEmployee: number;
  jaminanPensiunEmployee: number;
  pph21: number;
  potonganKeterlambatan: number;
  potonganKoperasi: number;
  potonganLainnya: number;
  totalDeductions: number;

  takeHomePay: number;

  // Benefits
  jkk: number;
  jkm: number;
  jhtCompany: number;
  jaminanPensiunCompany: number;
  bpjsKesehatanCompany: number;
  totalBenefits: number;

  // Attendance
  actualWorkingDay: number;
  scheduleWorkingDay: number;
  dayoff: number;
  nationalHoliday: number;
  companyHoliday: number;
  specialHoliday: number;
  attendanceCodes: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatRupiah(value: number): string {
  return `Rp${formatNumber(value)}`;
}

function formatDay(value: number): string {
  return `${value}d`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const COLORS = {
  text: "#1f2937",
  muted: "#6b7280",
  subtle: "#9ca3af",
  divider: "#e5e7eb",
  thinDivider: "#f3f4f6",
  red: "#dc2626",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 36,
    color: COLORS.text,
  },

  // Top bar
  confidentialRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  confidentialText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.red,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
  },
  payslipTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    letterSpacing: 1,
  },

  // Info grid
  infoGrid: {
    flexDirection: "row",
    marginBottom: 18,
  },
  infoCol: {
    flex: 1,
    paddingRight: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
    alignItems: "flex-start",
  },
  infoLabel: {
    width: 80,
    color: COLORS.muted,
  },
  infoSep: {
    width: 8,
    color: COLORS.muted,
  },
  infoValue: {
    flex: 1,
  },

  // Two column section
  twoCol: {
    flexDirection: "row",
    gap: 16,
  },
  col: {
    flex: 1,
  },

  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: 6,
  },

  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  lineLabel: {
    color: COLORS.text,
  },
  lineAmount: {
    color: COLORS.text,
    textAlign: "right",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
  },
  totalAmount: {
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },

  // Take home pay
  thpRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 22,
    paddingTop: 12,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  thpLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    marginRight: 18,
  },
  thpAmount: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
  },

  // Footer notes
  footerNote: {
    fontSize: 7,
    color: COLORS.muted,
    marginTop: 4,
  },
  footerSection: {
    marginTop: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.thinDivider,
  },
  footerText: {
    fontSize: 6.5,
    color: COLORS.subtle,
    marginBottom: 4,
    lineHeight: 1.4,
  },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoSep}>:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function MoneyLine({
  label,
  amount,
  hideZero = false,
}: {
  label: string;
  amount: number;
  hideZero?: boolean;
}) {
  if (hideZero && amount === 0) return null;
  return (
    <View style={styles.lineItem}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineAmount}>{formatNumber(amount)}</Text>
    </View>
  );
}

function DayLine({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.lineItem}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineAmount}>{formatDay(value)}</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PayslipDocument({ data }: { data: PayslipData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Confidential banner ─────────────────────────────────── */}
        <View style={styles.confidentialRow}>
          <Text style={styles.confidentialText}>*CONFIDENTIAL</Text>
        </View>

        {/* ── Title row ───────────────────────────────────────────── */}
        <View style={styles.titleRow}>
          <Text style={styles.companyName}>{data.companyName}</Text>
          <Text style={styles.payslipTitle}>PAYSLIP</Text>
        </View>

        {/* ── Info grid ───────────────────────────────────────────── */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <InfoLine label="Payroll cut off" value={data.payrollCutoff} />
            <InfoLine
              label="ID / Name"
              value={`${data.employeeNik} / ${data.employeeName}`}
            />
            <InfoLine label="Job position" value={data.jobPosition || "-"} />
            <InfoLine label="Organization" value={data.organization || "-"} />
          </View>
          <View style={styles.infoCol}>
            <InfoLine label="Grade / Level" value={data.gradeLevel || "-"} />
            <InfoLine label="PTKP" value={data.ptkpStatus || "-"} />
            <InfoLine label="NPWP" value={data.npwp || "-"} />
          </View>
        </View>

        {/* ── Earnings & Deductions ───────────────────────────────── */}
        <View style={styles.twoCol}>
          {/* Earnings */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Earnings</Text>
            <MoneyLine label="Basic Salary" amount={data.basicSalary} />
            <MoneyLine
              label="Tunjangan Komunikasi"
              amount={data.tunjanganKomunikasi}
              hideZero
            />
            <MoneyLine
              label="Tunjangan Kehadiran"
              amount={data.tunjanganKehadiran}
              hideZero
            />
            <MoneyLine
              label="Tunjangan Jabatan"
              amount={data.tunjanganJabatan}
              hideZero
            />
            <MoneyLine
              label="Tunjangan Lainnya"
              amount={data.tunjanganLainnya}
              hideZero
            />
            <MoneyLine
              label="Tax Allowance"
              amount={data.taxAllowance}
              hideZero
            />
            <MoneyLine label="THR" amount={data.thr} hideZero />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total earnings</Text>
              <Text style={styles.totalAmount}>
                {formatNumber(data.totalEarnings)}
              </Text>
            </View>
          </View>

          {/* Deductions */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Deductions</Text>
            <MoneyLine
              label="BPJS Kesehatan Employee"
              amount={data.bpjsKesehatanEmployee}
              hideZero
            />
            <MoneyLine
              label="JHT Employee"
              amount={data.jhtEmployee}
              hideZero
            />
            <MoneyLine
              label="Jaminan Pensiun Employee"
              amount={data.jaminanPensiunEmployee}
              hideZero
            />
            <MoneyLine
              label="Potongan Keterlambatan"
              amount={data.potonganKeterlambatan}
              hideZero
            />
            <MoneyLine
              label="Potongan Koperasi"
              amount={data.potonganKoperasi}
              hideZero
            />
            <MoneyLine
              label="Potongan Lainnya"
              amount={data.potonganLainnya}
              hideZero
            />
            <MoneyLine label="PPH 21" amount={data.pph21} hideZero />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total deductions</Text>
              <Text style={styles.totalAmount}>
                {formatNumber(data.totalDeductions)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Take Home Pay ───────────────────────────────────────── */}
        <View style={styles.thpRow}>
          <Text style={styles.thpLabel}>Take Home Pay</Text>
          <Text style={styles.thpAmount}>{formatRupiah(data.takeHomePay)}</Text>
        </View>

        {/* ── Benefits & Attendance ───────────────────────────────── */}
        <View style={styles.twoCol}>
          {/* Benefits */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Benefits*</Text>
            <MoneyLine label="JKK" amount={data.jkk} hideZero />
            <MoneyLine label="JKM" amount={data.jkm} hideZero />
            <MoneyLine
              label="JHT Company"
              amount={data.jhtCompany}
              hideZero
            />
            <MoneyLine
              label="Jaminan Pensiun Company"
              amount={data.jaminanPensiunCompany}
              hideZero
            />
            <MoneyLine
              label="BPJS Kesehatan Company"
              amount={data.bpjsKesehatanCompany}
              hideZero
            />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total benefits</Text>
              <Text style={styles.totalAmount}>
                {formatNumber(data.totalBenefits)}
              </Text>
            </View>
          </View>

          {/* Attendance Summary */}
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Attendance Summary</Text>
            <DayLine
              label="Actual Working Day"
              value={data.actualWorkingDay}
            />
            <DayLine
              label="Schedule Working Day"
              value={data.scheduleWorkingDay}
            />
            <DayLine label="Dayoff" value={data.dayoff} />
            <DayLine label="National Holiday" value={data.nationalHoliday} />
            <DayLine label="Company Holiday" value={data.companyHoliday} />
            <DayLine label="Special Holiday" value={data.specialHoliday} />
            {data.attendanceCodes ? (
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>Attendance/Time Off Code</Text>
                <Text style={styles.lineAmount}>{data.attendanceCodes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <View style={styles.footerSection}>
          <Text style={styles.footerNote}>
            *These are the benefits you&apos;ll get from the company, but not
            included in your take-home pay (THP).
          </Text>
          <Text style={[styles.footerText, { marginTop: 6 }]}>
            THIS IS COMPUTER GENERATED PRINTOUT AND NO SIGNATURE IS REQUIRED
          </Text>
          <Text style={styles.footerText}>
            PLEASE NOTE THAT THE CONTENTS OF THIS STATEMENT SHOULD BE TREATED
            WITH ABSOLUTE CONFIDENTIALITY EXCEPT TO THE EXTENT YOU ARE REQUIRED
            TO MAKE DISCLOSURE FOR ANY TAX, LEGAL, OR REGULATORY PURPOSES. ANY
            BREACH OF THIS CONFIDENTIALITY OBLIGATION WILL BE DEALT WITH
            SERIOUSLY, WHICH MAY INVOLVE DISCIPLINARY ACTION BEING TAKEN.
          </Text>
          <Text style={styles.footerText}>
            HARAP DIPERHATIKAN, ISI PERNYATAAN INI ADALAH RAHASIA KECUALI ANDA
            DIMINTA UNTUK MENGUNGKAPKANNYA UNTUK KEPERLUAN PAJAK, HUKUM, ATAU
            KEPENTINGAN PEMERINTAH. SETIAP PELANGGARAN ATAS KEWAJIBAN MENJAGA
            KERAHASIAAN INI AKAN DIKENAKAN SANKSI, YANG MUNGKIN BERUPA TINDAKAN
            KEDISIPLINAN.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
