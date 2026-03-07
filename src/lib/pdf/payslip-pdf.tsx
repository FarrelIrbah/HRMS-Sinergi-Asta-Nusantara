import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayslipData {
  // Header
  companyName: string;       // "PT Sinergi Asta Nusantara"
  periodLabel: string;       // "Januari 2026"
  // Employee info
  employeeNik: string;
  employeeName: string;
  position: string;
  department: string;
  // Earnings
  baseSalary: number;
  allowanceItems: { name: string; amount: number }[];
  overtimePay: number;
  thrAmount: number;
  grossPay: number;
  // BPJS deductions (employee portion)
  bpjsKesEmp: number;
  bpjsJhtEmp: number;
  bpjsJpEmp: number;
  // BPJS employer contribution (info only)
  bpjsKesEmpr: number;
  bpjsJhtEmpr: number;
  bpjsJpEmpr: number;
  bpjsJkk: number;
  bpjsJkm: number;
  // Tax
  pph21: number;
  // Totals
  totalDeductions: number;
  netPay: number;
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  // Indonesian format: Rp 1.234.567
  const formatted = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 28,
    color: "#1e293b",
  },

  // Header
  headerContainer: {
    alignItems: "center",
    marginBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 10,
  },
  companyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    marginBottom: 2,
  },
  slipTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 2,
  },
  periodLabel: {
    fontSize: 9,
    color: "#475569",
  },

  // Employee info section
  infoSection: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 8,
  },
  infoSectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoRow: {
    flexDirection: "row",
    width: "50%",
    marginBottom: 3,
  },
  infoLabel: {
    width: "45%",
    color: "#64748b",
  },
  infoSep: {
    width: "5%",
    color: "#64748b",
  },
  infoValue: {
    width: "50%",
    fontFamily: "Helvetica-Bold",
  },

  // Tables (earnings and deductions)
  tableSection: {
    marginBottom: 10,
  },
  tableSectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  tableRowTotal: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "#1e293b",
  },
  tableRowTotalText: {
    fontFamily: "Helvetica-Bold",
    color: "white",
  },
  tableLabel: {
    flex: 1,
  },
  tableAmount: {
    width: 110,
    textAlign: "right",
  },
  tableAmountTotal: {
    width: 110,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    color: "white",
  },

  // Employer contributions (info box)
  infoBox: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    padding: 8,
    backgroundColor: "#f8fafc",
  },
  infoBoxTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoBoxRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  infoBoxLabel: {
    flex: 1,
    color: "#475569",
  },
  infoBoxAmount: {
    width: 110,
    textAlign: "right",
    color: "#475569",
  },

  // Take-home pay box
  netPayBox: {
    borderWidth: 2,
    borderColor: "#1e293b",
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  netPayLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  netPayAmount: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function PayslipDocument({ data }: { data: PayslipData }) {
  const {
    companyName,
    periodLabel,
    employeeNik,
    employeeName,
    position,
    department,
    baseSalary,
    allowanceItems,
    overtimePay,
    thrAmount,
    grossPay,
    bpjsKesEmp,
    bpjsJhtEmp,
    bpjsJpEmp,
    bpjsKesEmpr,
    bpjsJhtEmpr,
    bpjsJpEmpr,
    bpjsJkk,
    bpjsJkm,
    pph21,
    totalDeductions,
    netPay,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.headerContainer}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.slipTitle}>SLIP GAJI</Text>
          <Text style={styles.periodLabel}>Periode: {periodLabel}</Text>
        </View>

        {/* ── Employee Info ──────────────────────────────────────── */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Informasi Karyawan</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NIK</Text>
              <Text style={styles.infoSep}>:</Text>
              <Text style={styles.infoValue}>{employeeNik}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Jabatan</Text>
              <Text style={styles.infoSep}>:</Text>
              <Text style={styles.infoValue}>{position}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoSep}>:</Text>
              <Text style={styles.infoValue}>{employeeName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Departemen</Text>
              <Text style={styles.infoSep}>:</Text>
              <Text style={styles.infoValue}>{department}</Text>
            </View>
          </View>
        </View>

        {/* ── Earnings Table ─────────────────────────────────────── */}
        <View style={styles.tableSection}>
          <Text style={styles.tableSectionTitle}>Penghasilan</Text>

          {/* Gaji Pokok */}
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Gaji Pokok</Text>
            <Text style={styles.tableAmount}>{formatRupiah(baseSalary)}</Text>
          </View>

          {/* Allowance items */}
          {allowanceItems.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 0 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.tableLabel}>{item.name}</Text>
              <Text style={styles.tableAmount}>{formatRupiah(item.amount)}</Text>
            </View>
          ))}

          {/* Lembur (only if > 0) */}
          {overtimePay > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Lembur</Text>
              <Text style={styles.tableAmount}>{formatRupiah(overtimePay)}</Text>
            </View>
          )}

          {/* THR (only if > 0) */}
          {thrAmount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>THR</Text>
              <Text style={styles.tableAmount}>{formatRupiah(thrAmount)}</Text>
            </View>
          )}

          {/* Total Bruto */}
          <View style={styles.tableRowTotal}>
            <Text style={[styles.tableLabel, styles.tableRowTotalText]}>
              Total Penghasilan Bruto
            </Text>
            <Text style={styles.tableAmountTotal}>{formatRupiah(grossPay)}</Text>
          </View>
        </View>

        {/* ── Deductions Table ───────────────────────────────────── */}
        <View style={styles.tableSection}>
          <Text style={styles.tableSectionTitle}>Potongan Karyawan</Text>

          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>BPJS Kesehatan (Karyawan)</Text>
            <Text style={styles.tableAmount}>{formatRupiah(bpjsKesEmp)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableLabel}>JHT Karyawan</Text>
            <Text style={styles.tableAmount}>{formatRupiah(bpjsJhtEmp)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>JP Karyawan</Text>
            <Text style={styles.tableAmount}>{formatRupiah(bpjsJpEmp)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableLabel}>PPh 21</Text>
            <Text style={styles.tableAmount}>{formatRupiah(pph21)}</Text>
          </View>

          {/* Total Deductions */}
          <View style={styles.tableRowTotal}>
            <Text style={[styles.tableLabel, styles.tableRowTotalText]}>
              Total Potongan
            </Text>
            <Text style={styles.tableAmountTotal}>
              {formatRupiah(totalDeductions)}
            </Text>
          </View>
        </View>

        {/* ── Employer Contributions Info ────────────────────────── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>
            Kontribusi Perusahaan — Informasi
          </Text>
          <View style={styles.infoBoxRow}>
            <Text style={styles.infoBoxLabel}>BPJS Kesehatan (Perusahaan)</Text>
            <Text style={styles.infoBoxAmount}>{formatRupiah(bpjsKesEmpr)}</Text>
          </View>
          <View style={styles.infoBoxRow}>
            <Text style={styles.infoBoxLabel}>JHT Perusahaan</Text>
            <Text style={styles.infoBoxAmount}>{formatRupiah(bpjsJhtEmpr)}</Text>
          </View>
          <View style={styles.infoBoxRow}>
            <Text style={styles.infoBoxLabel}>JP Perusahaan</Text>
            <Text style={styles.infoBoxAmount}>{formatRupiah(bpjsJpEmpr)}</Text>
          </View>
          <View style={styles.infoBoxRow}>
            <Text style={styles.infoBoxLabel}>JKK</Text>
            <Text style={styles.infoBoxAmount}>{formatRupiah(bpjsJkk)}</Text>
          </View>
          <View style={styles.infoBoxRow}>
            <Text style={styles.infoBoxLabel}>JKM</Text>
            <Text style={styles.infoBoxAmount}>{formatRupiah(bpjsJkm)}</Text>
          </View>
        </View>

        {/* ── Take-home Pay ──────────────────────────────────────── */}
        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>
            GAJI BERSIH (TAKE HOME PAY)
          </Text>
          <Text style={styles.netPayAmount}>{formatRupiah(netPay)}</Text>
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dokumen ini digenerate secara otomatis oleh sistem. Tidak memerlukan tanda tangan.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
