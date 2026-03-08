import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfferLetterData {
  candidateName: string;
  position: string;
  department: string;
  offerSalary: number;
  offerNotes?: string | null;
  generatedDate: string; // ISO string
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

function formatRupiah(value: number): string {
  const formatted = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${formatted}`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    padding: 60,
    color: "#1e293b",
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingBottom: 12,
  },
  company: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    marginVertical: 16,
    textAlign: "center",
    letterSpacing: 1,
  },
  body: {
    lineHeight: 1.6,
  },
  paragraph: {
    marginVertical: 8,
    fontSize: 11,
  },
  recipient: {
    marginBottom: 12,
  },
  detailBlock: {
    marginTop: 12,
    marginLeft: 20,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailLabel: {
    fontFamily: "Helvetica-Bold",
    width: 120,
  },
  detailColon: {
    width: 16,
  },
  detailValue: {
    flex: 1,
  },
  closing: {
    marginTop: 16,
  },
  dateText: {
    marginTop: 16,
    fontSize: 11,
  },
  signatureBlock: {
    marginTop: 60,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 4,
    alignItems: "center",
  },
  signatureName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 2,
  },
  signatureTitle: {
    fontSize: 9,
    color: "#475569",
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function OfferLetterDocument({ data }: { data: OfferLetterData }) {
  const dateFormatted = new Date(data.generatedDate).toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.company}>PT. Sinergi Asta Nusantara</Text>
          <Text style={styles.subtitle}>Surat Penawaran Kerja</Text>
        </View>

        {/* ── Title ──────────────────────────────────────────────── */}
        <Text style={styles.title}>SURAT PENAWARAN KERJA</Text>

        {/* ── Body ───────────────────────────────────────────────── */}
        <View style={styles.body}>
          {/* Recipient */}
          <View style={styles.recipient}>
            <Text style={styles.paragraph}>Kepada Yth.</Text>
            <Text style={[styles.paragraph, { fontFamily: "Helvetica-Bold", marginTop: 0 }]}>
              {data.candidateName}
            </Text>
          </View>

          {/* Opening */}
          <Text style={styles.paragraph}>Dengan hormat,</Text>
          <Text style={styles.paragraph}>
            Kami dengan senang hati menyampaikan bahwa setelah melalui proses
            seleksi yang telah dilaksanakan, Anda dinyatakan diterima untuk
            bergabung dengan PT. Sinergi Asta Nusantara dengan detail sebagai
            berikut:
          </Text>

          {/* Detail block */}
          <View style={styles.detailBlock}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Posisi</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailValue}>{data.position}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Departemen</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailValue}>{data.department}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Gaji Pokok</Text>
              <Text style={styles.detailColon}>:</Text>
              <Text style={styles.detailValue}>
                {formatRupiah(data.offerSalary)} / bulan
              </Text>
            </View>
            {data.offerNotes ? (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Keterangan</Text>
                <Text style={styles.detailColon}>:</Text>
                <Text style={styles.detailValue}>{data.offerNotes}</Text>
              </View>
            ) : null}
          </View>

          {/* Closing */}
          <Text style={styles.closing}>
            Harap konfirmasi penerimaan penawaran ini paling lambat 7 (tujuh)
            hari kalender sejak surat ini diterima. Apabila ada pertanyaan,
            silakan hubungi tim Human Resources kami.
          </Text>

          <Text style={styles.paragraph}>
            Kami berharap dapat segera bekerja sama dengan Anda.
          </Text>

          {/* Date */}
          <Text style={styles.dateText}>Jakarta, {dateFormatted}</Text>
        </View>

        {/* ── Signature ──────────────────────────────────────────── */}
        <View style={styles.signatureBlock}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureName}>Human Resources</Text>
            <Text style={styles.signatureTitle}>
              PT. Sinergi Asta Nusantara
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
