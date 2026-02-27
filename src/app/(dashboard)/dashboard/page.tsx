export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di HRMS PT. Sinergi Asta Nusantara
        </p>
      </div>
      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <p className="text-sm text-muted-foreground">
          Halaman dashboard akan menampilkan ringkasan data karyawan, kehadiran,
          dan informasi penting lainnya.
        </p>
      </div>
    </div>
  );
}
