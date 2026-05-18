**Lampiran 4. Perancangan Uji Black Box Testing**

| No | Identifikasi SRS | Identifikasi STP | Kelas Uji | Butir Uji | Aktor | Tingkat Pengujian | Jenis Pengujian |
|----|------------------|------------------|-----------|-----------|-------|-------------------|-----------------|
| 1 | SRS-HRMS-F-01 | STP-001 | Pengujian Terhadap Fitur *Login* | User dapat melihat halaman *login* | Superadmin, HR Admin, Manager, Employee | Pengujian Aplikasi | *Black Box* |
| | | STP-002 | | User dapat *login* dengan kombinasi *email* dan *password* yang valid | Superadmin, HR Admin, Manager, Employee | Pengujian Aplikasi | *Black Box* |
| | | STP-003 | | User dapat melihat pesan kesalahan saat *email* atau *password* salah | Superadmin, HR Admin, Manager, Employee | Pengujian Aplikasi | *Black Box* |
| 2 | SRS-HRMS-F-02 | STP-004 | Pengujian Terhadap Fitur *Logout* | User dapat keluar dari sesi sistem | Superadmin, HR Admin, Manager, Employee | Pengujian Aplikasi | *Black Box* |
| 3 | SRS-HRMS-F-03 | STP-005 | Pengujian Terhadap Fitur *Dashboard* | User dapat melihat halaman *dashboard* sesuai peran pengguna | Superadmin, HR Admin, Manager, Employee | Pengujian Aplikasi | *Black Box* |
| 4 | SRS-HRMS-F-04 | STP-006 | Pengujian Terhadap Fitur Pengelolaan Akun Pengguna | User dapat melihat halaman daftar pengguna sistem | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-007 | | User dapat menambahkan data pengguna baru | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-008 | | User dapat mengubah data pengguna | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-009 | | User dapat mengaktifkan atau menonaktifkan akun pengguna | Superadmin | Pengujian Aplikasi | *Black Box* |
| 5 | SRS-HRMS-F-05 | STP-010 | Pengujian Terhadap Fitur Pengelolaan *Master* Departemen | User dapat menambahkan data departemen | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-011 | | User dapat mengubah data departemen | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-012 | | User dapat menghapus data departemen | Superadmin | Pengujian Aplikasi | *Black Box* |
| 6 | SRS-HRMS-F-06 | STP-013 | Pengujian Terhadap Fitur Pengelolaan *Master* Jabatan | User dapat menambahkan data jabatan yang terikat pada satu departemen | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-014 | | User dapat mengubah data jabatan | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-015 | | User dapat menghapus data jabatan | Superadmin | Pengujian Aplikasi | *Black Box* |
| 7 | SRS-HRMS-F-07 | STP-016 | Pengujian Terhadap Fitur Pengelolaan *Master* Lokasi Kantor | User dapat menambahkan data lokasi kantor lengkap dengan *IP allowlist*, koordinat GPS, radius, dan jam kerja | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-017 | | User dapat mengubah data lokasi kantor | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-018 | | User dapat menghapus data lokasi kantor | Superadmin | Pengujian Aplikasi | *Black Box* |
| 8 | SRS-HRMS-F-08 | STP-019 | Pengujian Terhadap Fitur Pengelolaan *Master* Jenis Cuti | User dapat menambahkan data jenis cuti dengan kuota tahunan, status berbayar, dan restriksi *gender* | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-020 | | User dapat mengubah data jenis cuti | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-021 | | User dapat menghapus data jenis cuti | Superadmin | Pengujian Aplikasi | *Black Box* |
| 9 | SRS-HRMS-F-09 | STP-022 | Pengujian Terhadap Fitur *Log Audit* | User dapat melihat halaman daftar *log audit* | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-023 | | User dapat melihat detail satu entri *log audit* beserta perbandingan nilai sebelum dan sesudah | Superadmin | Pengujian Aplikasi | *Black Box* |
| | | STP-024 | | User dapat memfilter *log audit* berdasarkan pengguna, modul, dan rentang tanggal | Superadmin | Pengujian Aplikasi | *Black Box* |
| 10 | SRS-HRMS-F-10 | STP-025 | Pengujian Terhadap Fitur Daftar Karyawan | User dapat melihat halaman daftar karyawan dengan *pagination* | HR Admin, Manager, Employee | Pengujian Aplikasi | *Black Box* |
| | | STP-026 | | User dapat mencari karyawan berdasarkan nama atau NIK dan memfilter berdasarkan departemen, jabatan, tipe kontrak, dan status aktif | HR Admin, Manager | Pengujian Aplikasi | *Black Box* |
| 11 | SRS-HRMS-F-11 | STP-027 | Pengujian Terhadap Fitur Penambahan Data Karyawan | User dapat menambahkan data karyawan baru sekaligus pembentukan akun pengguna terkait | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-028 | | User dapat melihat pesan validasi saat *field* wajib kosong atau *password* awal tidak memenuhi aturan | HR Admin | Pengujian Aplikasi | *Black Box* |
| 12 | SRS-HRMS-F-12 | STP-029 | Pengujian Terhadap Fitur Pemutakhiran Informasi Personal Karyawan | User dapat mengubah informasi personal karyawan (nama, tempat/tanggal lahir, *gender*, agama, status pernikahan, alamat, nomor HP) | HR Admin | Pengujian Aplikasi | *Black Box* |
| 13 | SRS-HRMS-F-13 | STP-030 | Pengujian Terhadap Fitur Pemutakhiran Informasi Kepegawaian | User dapat mengubah informasi kepegawaian (departemen, jabatan, tipe kontrak, tanggal masuk, lokasi kantor) | HR Admin | Pengujian Aplikasi | *Black Box* |
| 14 | SRS-HRMS-F-14 | STP-031 | Pengujian Terhadap Fitur Pemutakhiran Informasi Pajak dan BPJS | User dapat mengubah informasi NPWP, status PTKP, nomor BPJS Kesehatan, BPJS Ketenagakerjaan, dan *tax borne by company* | HR Admin | Pengujian Aplikasi | *Black Box* |
| 15 | SRS-HRMS-F-15 | STP-032 | Pengujian Terhadap Fitur Pengelolaan Dokumen Karyawan | User dapat mengunggah dokumen karyawan dengan format PDF/JPEG/PNG ukuran maksimum 5 MB | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-033 | | User dapat mengunduh dokumen karyawan | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-034 | | User dapat menghapus dokumen karyawan | HR Admin | Pengujian Aplikasi | *Black Box* |
| 16 | SRS-HRMS-F-16 | STP-035 | Pengujian Terhadap Fitur Pengelolaan Kontak Darurat | User dapat menambahkan kontak darurat karyawan | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-036 | | User dapat mengubah kontak darurat karyawan | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-037 | | User dapat menghapus kontak darurat karyawan | HR Admin | Pengujian Aplikasi | *Black Box* |
| 17 | SRS-HRMS-F-17 | STP-038 | Pengujian Terhadap Fitur Penonaktifan Karyawan | User dapat menonaktifkan karyawan dengan mencatat tanggal dan alasan *termination* | HR Admin | Pengujian Aplikasi | *Black Box* |
| 18 | SRS-HRMS-F-18 | STP-039 | Pengujian Terhadap Fitur Pengelolaan Lowongan Pekerjaan | User dapat melihat halaman daftar lowongan pekerjaan | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-040 | | User dapat membuat lowongan pekerjaan baru | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-041 | | User dapat mengubah status lowongan menjadi OPEN atau CLOSED | HR Admin | Pengujian Aplikasi | *Black Box* |
| 19 | SRS-HRMS-F-19 | STP-042 | Pengujian Terhadap Fitur Penambahan Kandidat | User dapat menambahkan kandidat pada satu lowongan | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-043 | | User dapat mengunggah berkas CV kandidat | HR Admin | Pengujian Aplikasi | *Black Box* |
| 20 | SRS-HRMS-F-20 | STP-044 | Pengujian Terhadap Fitur *Kanban Board* Tahap Kandidat | User dapat mengubah tahap kandidat dengan *drag-and-drop* pada *kanban board* | HR Admin | Pengujian Aplikasi | *Black Box* |
| 21 | SRS-HRMS-F-21 | STP-045 | Pengujian Terhadap Fitur Penjadwalan *Interview* | User dapat menjadwalkan *interview* untuk seorang kandidat | HR Admin | Pengujian Aplikasi | *Black Box* |
| 22 | SRS-HRMS-F-22 | STP-046 | Pengujian Terhadap Fitur Penawaran Kerja | User dapat mencatat *offer salary* dan *offer notes* untuk seorang kandidat | HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-047 | | User dapat menerbitkan *offer letter* kandidat dalam format PDF | HR Admin | Pengujian Aplikasi | *Black Box* |
| 23 | SRS-HRMS-F-23 | STP-048 | Pengujian Terhadap Fitur Konversi Kandidat menjadi Karyawan | User dapat mengonversi kandidat dengan tahap DITERIMA menjadi entitas karyawan | HR Admin | Pengujian Aplikasi | *Black Box* |
| 24 | SRS-HRMS-F-24 | STP-049 | Pengujian Terhadap Fitur Pencatatan Kehadiran | User dapat melakukan *clock in* dengan verifikasi *IP allowlist* dan koordinat GPS | Employee | Pengujian Aplikasi | *Black Box* |
| | | STP-050 | | User dapat melakukan *clock out* untuk mengakhiri jam kerja | Employee | Pengujian Aplikasi | *Black Box* |
| 25 | SRS-HRMS-F-25 | STP-051 | Pengujian Terhadap Fitur Riwayat Absensi Pribadi | User dapat melihat riwayat absensi pribadi beserta status keterlambatan, pulang cepat, dan lembur | Employee | Pengujian Aplikasi | *Black Box* |
| 26 | SRS-HRMS-F-26 | STP-052 | Pengujian Terhadap Fitur Rekap Absensi Bulanan | User dapat melihat rekap absensi bulanan seluruh karyawan | HR Admin, Manager | Pengujian Aplikasi | *Black Box* |
| | | STP-053 | | User dapat memfilter rekap absensi berdasarkan bulan dan tahun | HR Admin, Manager | Pengujian Aplikasi | *Black Box* |
| 27 | SRS-HRMS-F-27 | STP-054 | Pengujian Terhadap Fitur Koreksi Manual Absensi | User dapat melakukan *manual override* catatan absensi karyawan disertai alasan | HR Admin | Pengujian Aplikasi | *Black Box* |
| 28 | SRS-HRMS-F-28 | STP-055 | Pengujian Terhadap Fitur Ekspor Rekap Absensi | User dapat mengekspor rekap absensi dalam format CSV/Excel atau PDF | HR Admin, Manager | Pengujian Aplikasi | *Black Box* |
| 29 | SRS-HRMS-F-29 | STP-056 | Pengujian Terhadap Fitur Pengajuan Cuti | User dapat mengajukan cuti dengan memilih jenis cuti, tanggal mulai, tanggal selesai, dan mengisi alasan | Employee | Pengujian Aplikasi | *Black Box* |
| 30 | SRS-HRMS-F-30 | STP-057 | Pengujian Terhadap Fitur Persetujuan Cuti Dua Tahap | User dapat menyetujui pengajuan cuti sesuai antrian masing-masing | Manager, HR Admin | Pengujian Aplikasi | *Black Box* |
| | | STP-058 | | User dapat menolak pengajuan cuti dengan mengisi alasan penolakan | Manager, HR Admin | Pengujian Aplikasi | *Black Box* |
| 31 | SRS-HRMS-F-31 | STP-059 | Pengujian Terhadap Fitur Pembatalan Cuti | User dapat membatalkan pengajuan cuti sebelum disetujui | Employee | Pengujian Aplikasi | *Black Box* |
| 32 | SRS-HRMS-F-32 | STP-060 | Pengujian Terhadap Fitur Saldo dan Riwayat Cuti | User dapat melihat saldo dan riwayat cuti pribadi per jenis cuti per tahun | Employee | Pengujian Aplikasi | *Black Box* |
| 33 | SRS-HRMS-F-33 | STP-061 | Pengujian Terhadap Fitur Laporan Cuti | User dapat melihat laporan cuti berbentuk KPI dan grafik tren bulanan | HR Admin | Pengujian Aplikasi | *Black Box* |
| 34 | SRS-HRMS-F-34 | STP-062 | Pengujian Terhadap Fitur Unduhan *Template* Excel | User dapat mengunduh *template* Excel untuk impor penggajian | HR Admin | Pengujian Aplikasi | *Black Box* |
| 35 | SRS-HRMS-F-35 | STP-063 | Pengujian Terhadap Fitur Impor *Payroll* | User dapat mengimpor data *payroll* dari berkas Excel/CSV dengan pencocokan NIK | HR Admin | Pengujian Aplikasi | *Black Box* |
| 36 | SRS-HRMS-F-36 | STP-064 | Pengujian Terhadap Fitur Detail Periode *Payroll* | User dapat melihat detail periode *payroll* beserta seluruh komponen *earnings*, *deductions*, *benefits*, dan THP | HR Admin | Pengujian Aplikasi | *Black Box* |
| 37 | SRS-HRMS-F-37 | STP-065 | Pengujian Terhadap Fitur Finalisasi *Payroll* | User dapat memfinalisasi periode *payroll* yang mengubah status dari DRAFT menjadi FINALIZED | HR Admin | Pengujian Aplikasi | *Black Box* |
| 38 | SRS-HRMS-F-38 | STP-066 | Pengujian Terhadap Fitur Unduh Slip Gaji PDF | User dapat mengunduh slip gaji per karyawan dalam format PDF | Employee, HR Admin, Manager | Pengujian Aplikasi | *Black Box* |
| 39 | SRS-HRMS-F-39 | STP-067 | Pengujian Terhadap Fitur Daftar Slip Gaji | User dapat melihat daftar slip gaji yang dapat diakses oleh karyawan terkait | Employee, HR Admin, Manager | Pengujian Aplikasi | *Black Box* |
