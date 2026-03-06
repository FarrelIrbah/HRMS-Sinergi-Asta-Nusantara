import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Jakarta";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function minutesToHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}j` : `${h}j ${m}m`;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 24,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#666",
    marginBottom: 16,
  },
  table: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    color: "white",
    padding: "5 4",
    fontFamily: "Helvetica-Bold",
  },
  row: {
    flexDirection: "row",
    padding: "4 4",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  rowAlt: {
    backgroundColor: "#f8fafc",
  },
  colNik: { width: "12%" },
  colName: { width: "20%" },
  colDept: { width: "14%" },
  colDate: { width: "12%" },
  colIn: { width: "8%" },
  colOut: { width: "8%" },
  colTotal: { width: "9%" },
  colLate: { width: "9%" },
  colOT: { width: "8%" },
});

interface AttendanceRow {
  id: string;
  date: Date;
  clockIn: Date | null;
  clockOut: Date | null;
  isLate: boolean;
  lateMinutes: number;
  overtimeMinutes: number;
  totalMinutes: number;
  employee: {
    nik: string;
    namaLengkap: string;
    department: { name: string };
    position: { name: string };
  };
}

interface AttendancePDFDocumentProps {
  data: AttendanceRow[];
  month: number;
  year: number;
}

export function AttendancePDFDocument({ data, month, year }: AttendancePDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>
          Rekap Absensi {MONTHS_ID[month - 1]} {year}
        </Text>
        <Text style={styles.subtitle}>
          PT. Sinergi Asta Nusantara — {data.length} data
        </Text>

        <View style={styles.table}>
          <View style={styles.headerRow}>
            <Text style={styles.colNik}>NIK</Text>
            <Text style={styles.colName}>Nama</Text>
            <Text style={styles.colDept}>Departemen</Text>
            <Text style={styles.colDate}>Tanggal</Text>
            <Text style={styles.colIn}>Masuk</Text>
            <Text style={styles.colOut}>Pulang</Text>
            <Text style={styles.colTotal}>Total</Text>
            <Text style={styles.colLate}>Terlambat</Text>
            <Text style={styles.colOT}>Lembur</Text>
          </View>

          {data.map((row, idx) => (
            <View
              key={row.id}
              style={[styles.row, idx % 2 === 1 ? styles.rowAlt : {}]}
            >
              <Text style={styles.colNik}>{row.employee.nik}</Text>
              <Text style={styles.colName}>{row.employee.namaLengkap}</Text>
              <Text style={styles.colDept}>{row.employee.department.name}</Text>
              <Text style={styles.colDate}>
                {format(toZonedTime(row.date, TZ), "dd/MM/yyyy")}
              </Text>
              <Text style={styles.colIn}>
                {row.clockIn ? format(toZonedTime(row.clockIn, TZ), "HH:mm") : "-"}
              </Text>
              <Text style={styles.colOut}>
                {row.clockOut ? format(toZonedTime(row.clockOut, TZ), "HH:mm") : "-"}
              </Text>
              <Text style={styles.colTotal}>
                {row.totalMinutes > 0 ? minutesToHours(row.totalMinutes) : "-"}
              </Text>
              <Text style={styles.colLate}>
                {row.isLate ? `${row.lateMinutes}m` : "-"}
              </Text>
              <Text style={styles.colOT}>
                {row.overtimeMinutes > 0 ? minutesToHours(row.overtimeMinutes) : "-"}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
