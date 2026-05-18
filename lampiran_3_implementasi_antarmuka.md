**Lampiran 3. Hasil Implementasi Antarmuka**

1. Halaman Login

[Sisipkan gambar di sini]

Halaman Login merupakan halaman publik yang menjadi pintu masuk ke sistem HRMS PT Sinergi Asta Nusantara dan dapat diakses oleh seluruh pengguna terdaftar tanpa memandang peran. Pada halaman ini ditampilkan panel kiri bermuatan informasi singkat mengenai sistem beserta tiga fitur utama (absensi real-time, pengajuan cuti, dan slip gaji digital), sedangkan panel kanan memuat formulir login dengan kolom isian email dan password. Pengguna dapat mengisi kedua kolom tersebut, menampilkan atau menyembunyikan password melalui tombol toggle ikon mata, lalu menekan tombol "Masuk" untuk melakukan autentikasi melalui NextAuth Credentials Provider. Apabila autentikasi berhasil, sistem akan mengarahkan pengguna ke halaman dashboard sesuai peran masing-masing, sementara jika gagal akan ditampilkan pesan kesalahan "Email atau password salah" di bagian atas formulir. Validasi formulir dilakukan menggunakan skema Zod (`loginSchema`) sehingga kolom email wajib berformat email yang valid dan password tidak boleh kosong sebelum permintaan dikirim ke server.

2. Halaman Dashboard Super Admin

[Sisipkan gambar di sini]

Halaman Dashboard Super Admin merupakan halaman utama yang ditampilkan kepada pengguna dengan peran Super Admin setelah berhasil masuk ke sistem. Pada halaman ini ditampilkan empat kartu ringkasan statistik utama (Total Karyawan, Hadir Hari Ini, Sedang Cuti, dan Tidak Hadir), visualisasi data dalam bentuk grafik tren kehadiran mingguan, distribusi karyawan per departemen dalam bentuk pie chart, ringkasan periode penggajian terbaru, kartu statistik rekrutmen (Lowongan Aktif dan Interview Terjadwal) beserta distribusi tahapan kandidat, daftar pengajuan cuti yang menunggu persetujuan, daftar karyawan baru, serta daftar ulang tahun karyawan yang akan datang. Pengguna dapat mengeklik tautan pada setiap kartu untuk berpindah ke halaman modul terkait, seperti detail penggajian atau daftar pengajuan cuti. Halaman ini bersifat read-only sebagai ikhtisar lintas modul dan secara otomatis memuat data terbaru dari layanan `getSuperAdminDashboardData` setiap kali halaman diakses. Seluruh data ditampilkan menggunakan komponen kartu shadcn/ui dengan grafik dari pustaka Recharts.

3. Halaman Dashboard HR Admin

[Sisipkan gambar di sini]

Halaman Dashboard HR Admin merupakan halaman utama yang ditampilkan setelah pengguna dengan peran HR Admin berhasil masuk ke sistem. Pada halaman ini ditampilkan empat kartu ringkasan statistik utama (Total Karyawan, Hadir Hari Ini, Sedang Cuti, dan Rekrutmen Aktif), grafik tren kehadiran dan penggajian, distribusi karyawan per departemen, kartu ringkasan rekrutmen, daftar pengajuan cuti pending yang menunggu persetujuan HR, daftar karyawan baru, daftar ulang tahun mendatang, serta daftar kontrak karyawan yang akan segera berakhir. Pengguna dapat mengeklik kartu pengajuan cuti pending untuk langsung berpindah ke halaman Kelola Cuti, mengeklik baris karyawan untuk melihat profil, atau menggunakan kartu kontrak akan berakhir sebagai pengingat untuk tindakan perpanjangan kontrak. Halaman ini menyajikan informasi operasional harian yang relevan dengan tanggung jawab HR Admin tanpa menampilkan kontrol pengaturan sistem. Visualisasi data menggunakan Recharts dengan legenda warna untuk membedakan kategori "Hadir" (hijau) dan "Terlambat" (kuning).

4. Halaman Dashboard Manager

[Sisipkan gambar di sini]

Halaman Dashboard Manager merupakan halaman utama yang ditampilkan setelah pengguna dengan peran Manager berhasil masuk ke sistem dan secara khusus dibatasi pada data anggota tim di departemen yang dipimpinnya. Pada halaman ini ditampilkan empat kartu ringkasan statistik tim (Anggota Tim, Hadir Hari Ini, Cuti Hari Ini, dan Tidak Hadir), grafik tren kehadiran tim, daftar pengajuan cuti pending yang membutuhkan persetujuan Manager, daftar anggota tim yang sedang cuti, daftar status kehadiran anggota tim hari ini, serta daftar ulang tahun anggota tim mendatang. Pengguna dapat berpindah ke halaman Kelola Cuti untuk menindaklanjuti pengajuan dari kartu pending cuti, atau mengeklik nama anggota tim untuk melihat detail kehadiran. Halaman ini secara otomatis memfilter data berdasarkan `departmentId` Manager melalui layanan `getManagerDashboardData` sehingga Manager tidak melihat data lintas departemen. Tampilan menggunakan kartu statistik dengan ikon Lucide dan grafik Recharts.

5. Halaman Dashboard Karyawan

[Sisipkan gambar di sini]

Halaman Dashboard Karyawan merupakan halaman utama yang ditampilkan setelah pengguna dengan peran Karyawan berhasil masuk ke sistem dan menyajikan informasi yang sifatnya personal. Pada halaman ini ditampilkan empat kartu ringkasan pribadi (Hadir Bulan Ini, Keterlambatan, Sisa Cuti, dan Lembur), grafik kehadiran mingguan dengan legenda "Tepat waktu" dan "Terlambat", daftar slip gaji terbaru, daftar saldo cuti per jenis cuti, jadwal cuti pribadi yang akan datang, daftar rekan kerja yang sedang cuti, serta daftar ulang tahun rekan kerja mendatang. Pengguna dapat mengeklik tombol "Ajukan Cuti" untuk langsung membuka halaman pengajuan cuti, atau mengeklik baris slip gaji untuk melihat dan mengunduh slip gaji yang relevan. Halaman ini bersifat read-only dengan data yang dimuat berdasarkan `userId` pengguna sehingga setiap karyawan hanya melihat informasi miliknya sendiri. Apabila terdapat informasi penting (misal saldo cuti rendah), sistem menampilkan kartu notifikasi berwarna kuning di bagian atas halaman.

6. Halaman Daftar Karyawan

[Sisipkan gambar di sini]

Halaman Daftar Karyawan merupakan halaman yang digunakan oleh Super Admin, HR Admin, dan Manager untuk melihat data karyawan yang terdaftar dalam sistem, dengan ketentuan Manager hanya dapat melihat karyawan di departemennya sendiri sedangkan Karyawan langsung dialihkan ke halaman profil pribadinya. Pada halaman ini ditampilkan lima kartu ringkasan statistik (Aktif, PKWT, PKWTT, Baru Bulan Ini, dan Nonaktif), serta tabel data karyawan yang memuat NIK, nama lengkap, email, departemen, jabatan, tipe kontrak, dan status aktif. Pengguna dapat melakukan pencarian karyawan berdasarkan nama atau NIK, memfilter berdasarkan departemen, jabatan, tipe kontrak, dan status aktif, serta mengeklik baris karyawan untuk membuka halaman profil. Khusus untuk HR Admin dan Super Admin tersedia tombol "Tambah Karyawan" yang mengarahkan ke halaman formulir pembuatan karyawan baru. Halaman ini dilengkapi dengan fitur pagination pada bagian bawah tabel yang menggunakan parameter URL (`nuqs`) sehingga kondisi filter dapat dibagikan melalui tautan.

7. Halaman Tambah Karyawan

[Sisipkan gambar di sini]

Halaman Tambah Karyawan merupakan halaman formulir yang digunakan oleh HR Admin dan Super Admin untuk mendaftarkan karyawan baru beserta akun pengguna sistemnya sekaligus. Pada halaman ini ditampilkan formulir berisi kolom isian yang dikelompokkan ke dalam beberapa bagian, yaitu data wajib (nama lengkap, email, password awal, departemen, jabatan, tipe kontrak PKWT/PKWTT, dan tanggal bergabung) serta data opsional (NIK KTP 16 digit, tempat lahir, tanggal lahir, jenis kelamin, status pernikahan, agama, alamat, nomor HP, NPWP, status PTKP, nomor BPJS Kesehatan, dan nomor BPJS Ketenagakerjaan). Pengguna dapat mengisi seluruh kolom yang tersedia kemudian menekan tombol "Simpan" untuk menyimpan data karyawan baru, atau menekan tautan "Kembali ke Daftar Karyawan" untuk membatalkan. Validasi formulir dilakukan menggunakan skema Zod `createEmployeeSchema` yang antara lain memastikan password awal memiliki minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, dan angka. Apabila penyimpanan berhasil, sistem menampilkan notifikasi toast melalui pustaka Sonner kemudian mengalihkan pengguna kembali ke halaman daftar karyawan.

8. Halaman Profil Karyawan

[Sisipkan gambar di sini]

Halaman Profil Karyawan merupakan halaman yang menampilkan detail lengkap satu karyawan dengan mode tampilan berbeda sesuai peran pengakses, yaitu mode edit untuk HR Admin dan Super Admin, serta mode read-only untuk Karyawan (terbatas pada profilnya sendiri) dan Manager (terbatas pada anggota tim di departemennya). Pada halaman ini ditampilkan kartu profil utama yang memuat avatar inisial, nama, NIK, status aktif/nonaktif, badge mode akses, serta meta data ringkas (email, nomor HP, departemen, jabatan, tipe kontrak, tanggal bergabung), dilanjutkan dengan lima tab konten yaitu Informasi Pribadi, Detail Kepegawaian, Pajak & BPJS, Dokumen, dan Kontak Darurat. Pengguna dengan mode edit dapat memperbarui data per tab melalui tombol "Simpan Perubahan", mengunggah dan menghapus dokumen karyawan (KTP, NPWP, BPJS, Kontrak, Foto, dan Lainnya dengan batas 5 MB tipe PDF/JPEG/PNG), serta menambah, mengubah, atau menghapus kontak darurat. Tombol "Nonaktifkan Karyawan" tersedia untuk karyawan aktif yang akan membuka dialog konfirmasi berisi kolom tanggal pemberhentian dan alasan. Apabila karyawan berstatus nonaktif, sistem menampilkan banner peringatan berwarna merah di bagian atas halaman.

9. Halaman Absensi

[Sisipkan gambar di sini]

Halaman Absensi merupakan halaman yang digunakan oleh seluruh pengguna yang memiliki profil karyawan untuk melakukan pencatatan jam masuk dan jam pulang serta melihat riwayat kehadiran pribadinya. Pada halaman ini ditampilkan informasi lokasi kantor beserta jam kerja, lima kartu ringkasan kehadiran (Hari Ini, Hadir Minggu Ini, Terlambat, Rata-rata per Hari, dan Lembur Bulan Ini), kartu absensi hari ini yang berisi tombol Clock In/Clock Out beserta ringkasan mingguan, serta tabel riwayat 7 hari terakhir lengkap dengan badge status (On Time, Late, Early Out, Overtime). Pengguna dapat menekan tombol Clock In atau Clock Out untuk melakukan pencatatan kehadiran yang akan memverifikasi alamat IP melawan daftar IP yang diizinkan dan koordinat GPS terhadap radius lokasi kantor. Halaman ini akan menampilkan pesan khusus apabila pengguna tidak memiliki profil karyawan atau lokasi kantor belum dikonfigurasi. Validasi geolokasi dijalankan di sisi klien menggunakan API `navigator.geolocation`, lalu data dikirim ke server action `clockInAction` atau `clockOutAction` untuk diverifikasi ulang sebelum disimpan.

10. Halaman Admin Absensi

[Sisipkan gambar di sini]

Halaman Admin Absensi merupakan halaman yang digunakan oleh HR Admin, Super Admin, dan Manager untuk melihat rekap kehadiran bulanan seluruh karyawan, dengan ketentuan Manager hanya dapat melihat karyawan di departemennya. Pada halaman ini ditampilkan lima kartu ringkasan statistik (Total Karyawan, Pernah Hadir, Pernah Terlambat, Rata-rata Jam, dan Total Lembur) serta tabel rekap yang dikelompokkan per karyawan beserta jumlah hari kerja, hari terlambat, dan total menit lembur. Pengguna dapat memfilter rekap berdasarkan bulan dan tahun melalui dropdown filter, serta mengeklik baris karyawan untuk melihat detail kehadiran per tanggal. Khusus untuk HR Admin dan Super Admin tersedia tombol ekspor rekap ke CSV/Excel serta tombol "Input Manual" yang akan membuka dialog formulir untuk mencatat kehadiran secara manual lengkap dengan kolom alasan override. Setiap manual override akan mencatat identitas pengguna yang melakukan override dan alasannya pada tabel `attendance_records` untuk keperluan audit.

11. Halaman Detail Absensi Karyawan

[Sisipkan gambar di sini]

Halaman Detail Absensi Karyawan merupakan halaman yang digunakan oleh HR Admin, Super Admin, dan Manager untuk melihat rincian kehadiran satu karyawan tertentu pada bulan dan tahun yang dipilih. Pada halaman ini ditampilkan identitas karyawan, empat kartu ringkasan kehadiran bulanan (Hadir, Terlambat, Rata-rata Jam, dan Total Lembur), serta tabel rincian harian yang memuat tanggal, jam clock-in, jam clock-out, total menit kerja, menit keterlambatan, menit pulang cepat, menit lembur, dan badge status. Pengguna dapat memfilter tampilan berdasarkan bulan dan tahun, serta menekan tombol "Kembali" untuk kembali ke halaman rekap admin. Halaman ini bersifat read-only sebagai pelengkap halaman rekap dan menggunakan time zone Asia/Jakarta dalam penampilan waktu agar konsisten dengan jam kerja kantor. Apabila terdapat catatan manual override, status pada baris akan ditandai sehingga pengguna mengetahui catatan tersebut bukan hasil clock-in/out reguler.

12. Halaman Cuti

[Sisipkan gambar di sini]

Halaman Cuti merupakan halaman yang digunakan oleh seluruh pengguna yang memiliki profil karyawan untuk mengajukan cuti, memantau saldo cuti, serta melihat riwayat pengajuan cuti pribadi. Pada halaman ini ditampilkan empat kartu ringkasan cuti (Sisa Cuti, Terpakai, Menunggu Approval, dan Total Alokasi), kartu saldo cuti per jenis cuti, panel formulir pengajuan cuti beserta panel informasi jenis cuti, serta tabel riwayat pengajuan beserta status (Pending Manager, Pending HR, Approved, Rejected, Cancelled). Pengguna dapat memilih jenis cuti dari dropdown, memilih rentang tanggal melalui komponen calendar (`react-day-picker`), mengisi alasan cuti, lalu menekan tombol "Ajukan Cuti" untuk mengirimkan pengajuan, atau menekan tombol "Batalkan" pada baris pengajuan yang masih pending untuk membatalkan. Sistem secara otomatis menghitung `workingDays` (hari kerja Senin–Jumat) dan memvalidasi sisa saldo cuti sebelum pengajuan diterima. Jenis cuti dengan pembatasan gender (`genderRestriction`) hanya tampil pada dropdown apabila gender karyawan sesuai.

13. Halaman Kelola Cuti

[Sisipkan gambar di sini]

Halaman Kelola Cuti merupakan halaman yang digunakan oleh HR Admin, Super Admin, dan Manager untuk meninjau dan menindaklanjuti pengajuan cuti yang masuk ke antrian masing-masing, dimana Manager melihat antrian `PENDING_MANAGER` sedangkan HR Admin dan Super Admin melihat antrian `PENDING_HR` sesuai alur dua tahap persetujuan. Pada halaman ini ditampilkan empat kartu ringkasan status (Menunggu, Disetujui, Ditolak, dan Dibatalkan) serta tabel pengajuan cuti yang memuat nama karyawan, NIK, departemen, jenis cuti, tanggal mulai, tanggal selesai, jumlah hari kerja, alasan, dan status. Pengguna dapat memfilter daftar berdasarkan status dan tahun, kemudian menekan tombol "Setujui" atau "Tolak" pada setiap baris yang akan membuka dialog konfirmasi berisi kolom catatan opsional (untuk setuju) atau alasan wajib (untuk tolak). Pengajuan yang telah disetujui Manager secara otomatis berpindah ke antrian HR untuk persetujuan tahap kedua, dan pengajuan yang disetujui HR akan mengubah saldo `usedDays` pada tabel `leave_balances`. Manager hanya dapat melihat dan menyetujui pengajuan dari karyawan di departemennya melalui pembatasan `departmentId`.

14. Halaman Laporan Cuti

[Sisipkan gambar di sini]

Halaman Laporan Cuti merupakan halaman yang digunakan oleh HR Admin dan Super Admin untuk melihat laporan cuti agregat dalam satu tahun tertentu. Pada halaman ini ditampilkan empat kartu KPI (Jumlah Karyawan Pengaju, Hari Cuti Disetujui, Pengajuan Pending, dan Pengajuan Ditolak), grafik tren bulanan dengan tiga seri data (Disetujui, Pending, dan Ditolak) menggunakan Recharts, serta tabel rincian pengajuan cuti yang menampilkan nama karyawan, departemen, jenis cuti, jumlah hari, dan status. Pengguna dapat memfilter laporan berdasarkan tahun dan departemen melalui komponen filter di bagian atas tabel. Halaman ini bersifat read-only sebagai sarana analitis bagi HR untuk memantau pola pengajuan cuti, dan secara otomatis menghitung agregasi melalui fungsi `computeKpis` dan `computeMonthlyTrend` di sisi server. Bulan ditampilkan dalam label bahasa Indonesia singkat ("Jan", "Feb", "Mar", dan seterusnya).

15. Halaman Penggajian

[Sisipkan gambar di sini]

Halaman Penggajian merupakan halaman yang digunakan oleh HR Admin dan Super Admin untuk mengimpor hasil perhitungan penggajian dari berkas Excel/CSV serta melihat riwayat periode penggajian yang pernah dijalankan. Pada halaman ini ditampilkan empat kartu ringkasan (Total Periode, Difinalisasi, Draft, dan Periode Terbaru), formulir impor penggajian yang berisi pemilihan bulan dan tahun beserta tautan unduh template Excel dan kolom unggah berkas, serta tabel riwayat penggajian dengan kolom Periode, Status (Draft/Difinalisasi), dan Jumlah Karyawan. Pengguna dapat menekan tombol "Unduh Template" untuk mengunduh template Excel kosong yang sudah berisi struktur kolom, mengunggah berkas Excel/CSV yang sudah diisi untuk diparse dan dicocokkan terhadap NIK karyawan, serta mengeklik baris periode untuk membuka halaman detail penggajian periode tersebut. Periode dengan status Draft dapat di-impor ulang untuk menimpa data sebelumnya, sementara periode Finalized bersifat immutable. Hasil impor disimpan sebagai snapshot lengkap pada tabel `payroll_entries` sehingga tidak terpengaruh perubahan data karyawan setelahnya.

16. Halaman Detail Penggajian

[Sisipkan gambar di sini]

Halaman Detail Penggajian merupakan halaman yang digunakan oleh HR Admin dan Super Admin untuk meninjau seluruh entri penggajian dalam satu periode tertentu beserta melakukan finalisasi. Pada halaman ini ditampilkan badge status periode (Draft atau Difinalisasi), empat kartu ringkasan (Jumlah Karyawan, Total Earnings, Total Deductions, dan Total Take Home Pay dalam format Rupiah ringkas), serta tabel entri yang menampilkan NIK, nama karyawan, jabatan, organisasi, total pendapatan, total potongan, total benefit, dan take home pay per karyawan. Pengguna dapat menekan tombol "Finalisasi" pada periode berstatus Draft untuk mengunci data secara permanen melalui dialog konfirmasi, atau mengeklik baris entri untuk mengunduh slip gaji PDF karyawan yang bersangkutan via endpoint `/api/payroll/payslip/[entryId]`. Setelah periode difinalisasi, tombol finalisasi disembunyikan dan deskripsi halaman berubah menjadi "Periode ini sudah difinalisasi dan tidak dapat diubah." Aksi finalisasi tercatat pada tabel `audit_logs` melalui helper `createAuditLog`.

17. Halaman Slip Gaji (HR Admin)

[Sisipkan gambar di sini]

Halaman Slip Gaji untuk HR Admin dan Super Admin merupakan halaman yang menampilkan seluruh slip gaji dari periode yang telah difinalisasi untuk semua karyawan. Pada halaman ini ditampilkan empat kartu ringkasan (Total Slip, Periode, Karyawan, dan Periode Terbaru) serta tabel riwayat slip gaji dengan kolom Periode, NIK, Nama Karyawan, Status, dan tombol Aksi berlabel "Unduh PDF". Pengguna dapat menekan tombol "Unduh PDF" pada setiap baris untuk membuka slip gaji karyawan dalam tab baru, yang akan dihasilkan secara dinamis menggunakan `@react-pdf/renderer`. Halaman ini hanya menampilkan entri dari periode berstatus `FINALIZED` sehingga slip dari periode Draft tidak ditampilkan untuk mencegah distribusi data yang belum dikonfirmasi. Apabila belum ada periode yang difinalisasi, sistem menampilkan empty state berisi pesan "Belum ada slip gaji tersedia".

18. Halaman Slip Gaji (Karyawan)

[Sisipkan gambar di sini]

Halaman Slip Gaji untuk Karyawan dan Manager merupakan halaman yang menampilkan riwayat slip gaji pribadi pengguna yang sedang masuk. Pada halaman ini ditampilkan tiga kartu ringkasan (Total Slip Tersedia, Periode Terbaru, dan Periode Terlama) serta tabel slip gaji yang memuat kolom Periode, Status, dan tombol Aksi berlabel "Unduh PDF". Pengguna dapat menekan tombol "Unduh PDF" untuk membuka slip gaji periode terkait dalam tab baru. Halaman ini hanya menampilkan slip gaji yang dimiliki oleh karyawan yang sedang login dengan filter berdasarkan `employeeId`, sehingga seorang karyawan tidak dapat melihat slip gaji karyawan lain. Apabila profil karyawan tidak ditemukan atau belum ada slip gaji yang difinalisasi, halaman menampilkan empty state yang sesuai.

19. Halaman Rekrutmen

[Sisipkan gambar di sini]

Halaman Rekrutmen merupakan halaman yang digunakan oleh HR Admin dan Super Admin untuk mengelola lowongan pekerjaan beserta pipeline kandidat per lowongan. Pada halaman ini ditampilkan lima kartu ringkasan rekrutmen (Lowongan Aktif, Ditutup, Total Kandidat, Interview Terjadwal, dan Hired Bulan Ini) serta tabel lowongan yang memuat judul lowongan, departemen, status (Open/Closed), jumlah kandidat per tahap, tanggal dibuka, dan tanggal ditutup. Pengguna dapat menekan tombol "Buat Lowongan" untuk berpindah ke halaman pembuatan lowongan baru, mengeklik baris lowongan untuk membuka halaman pipeline kandidatnya, atau menekan tombol toggle untuk mengubah status lowongan menjadi terbuka atau ditutup. Halaman ini dilengkapi dengan filter status (OPEN/CLOSED) melalui parameter URL sehingga pengguna dapat memfokuskan tampilan pada lowongan tertentu. Setiap perubahan status atau pembuatan lowongan baru akan otomatis memperbarui kartu ringkasan dan tabel.

20. Halaman Buat Lowongan

[Sisipkan gambar di sini]

Halaman Buat Lowongan merupakan halaman formulir yang digunakan oleh HR Admin dan Super Admin untuk mendaftarkan lowongan pekerjaan baru. Pada halaman ini ditampilkan formulir dengan kolom isian judul lowongan, departemen (dropdown dari daftar departemen aktif), deskripsi pekerjaan, persyaratan kualifikasi, tanggal pembukaan, dan tanggal penutupan opsional. Pengguna dapat melengkapi seluruh kolom kemudian menekan tombol "Simpan" untuk menyimpan lowongan baru dengan status OPEN secara default, atau menekan tautan "Kembali ke Daftar Lowongan" untuk membatalkan. Validasi formulir dilakukan menggunakan skema Zod `createVacancySchema` yang memastikan kolom judul, departemen, deskripsi, persyaratan, dan tanggal pembukaan wajib diisi. Apabila penyimpanan berhasil, sistem menampilkan notifikasi toast lalu mengalihkan pengguna kembali ke halaman daftar lowongan.

21. Halaman Detail Lowongan (Kanban)

[Sisipkan gambar di sini]

Halaman Detail Lowongan merupakan halaman yang digunakan oleh HR Admin dan Super Admin untuk mengelola pipeline kandidat satu lowongan tertentu melalui antarmuka kanban board. Pada halaman ini ditampilkan kartu hero lowongan berisi judul, badge status (Terbuka/Ditutup), departemen, tanggal dibuka, tanggal ditutup, total kandidat, dan jumlah tahap aktif, dilanjutkan dengan empat kartu ringkasan tahap aktif (Melamar, Seleksi Berkas, Interview, Penawaran) serta papan kanban dengan enam kolom (Melamar, Seleksi Berkas, Interview, Penawaran, Diterima, Ditolak). Pengguna dapat menekan tombol "Tambah Kandidat" untuk membuka dialog formulir penambahan kandidat baru beserta opsi unggah CV, menarik dan melepaskan kartu kandidat antar kolom untuk mengubah tahap (`stage`) menggunakan pustaka `@dnd-kit`, serta mengeklik kartu kandidat untuk membuka halaman detail kandidat. Setiap perubahan tahap melalui drag-and-drop akan langsung memperbarui basis data melalui server action `updateCandidateStageAction` dan memperbarui hitungan tahap di kartu ringkasan secara reaktif.

22. Halaman Detail Kandidat

[Sisipkan gambar di sini]

Halaman Detail Kandidat merupakan halaman yang digunakan oleh HR Admin dan Super Admin untuk meninjau informasi lengkap satu kandidat beserta tindakan lanjutan seperti penjadwalan wawancara, pengelolaan penawaran, dan konversi menjadi karyawan. Pada halaman ini ditampilkan breadcrumb navigasi (Rekrutmen › Judul Lowongan › Nama Kandidat), kartu identitas kandidat (nama, email, telepon, tahap, dan tanggal melamar), bagian Catatan internal, bagian CV/Dokumen dengan tautan unduh, bagian Jadwal Wawancara dengan formulir tambah jadwal, serta bagian Penawaran dengan kolom gaji yang ditawarkan dan catatan penawaran. Pengguna dapat menambah jadwal wawancara dengan mengisi tanggal-waktu, nama pewawancara, dan catatan kemudian menekan tombol "Simpan", memperbarui informasi penawaran melalui formulir Penawaran, mengunduh surat penawaran (Offer Letter) dalam format PDF via endpoint `/api/recruitment/offer-letter/[candidateId]`, serta mengonversi kandidat menjadi karyawan ketika tahap mencapai "Diterima". Aksi konversi akan memicu `convertCandidateToEmployeeAction` yang membuat baris baru pada tabel `employees` dan `users` dengan password awal yang dapat ditentukan HR.

23. Halaman Manajemen Pengguna

[Sisipkan gambar di sini]

Halaman Manajemen Pengguna merupakan halaman yang digunakan secara eksklusif oleh Super Admin untuk mengelola akun pengguna sistem HRMS beserta peran aksesnya. Pada halaman ini ditampilkan tabel pengguna yang memuat kolom nama, email, peran (Role), status aktif, dan tanggal pembuatan akun, serta tombol "Tambah Pengguna" di bagian header. Pengguna dapat menambah pengguna baru melalui dialog formulir yang berisi kolom nama, email, password (minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, dan angka), dan peran (Super Admin, HR Admin, Manager, atau Employee), mengubah data pengguna existing melalui dialog edit, serta mengaktifkan atau menonaktifkan akun melalui aksi toggle dengan dialog konfirmasi. Akun yang dinonaktifkan tidak dapat melakukan login namun datanya tetap tersimpan untuk keperluan referensi historis. Setiap aksi create, update, dan toggle status akan mencatat entri pada tabel `audit_logs`.

24. Halaman Data Master

[Sisipkan gambar di sini]

Halaman Data Master merupakan halaman yang digunakan secara eksklusif oleh Super Admin untuk mengelola data master yang menjadi acuan modul lain dalam sistem. Pada halaman ini ditampilkan empat tab yang dapat dipilih, yaitu Departemen, Jabatan, Lokasi Kantor, dan Jenis Cuti, dengan masing-masing tab memuat tabel data terkait beserta tombol "Tambah" di pojok kanan atas. Pengguna dapat menambah, mengubah, dan menghapus data pada setiap tab melalui dialog formulir, dengan rincian: tab Departemen memuat kolom nama dan deskripsi; tab Jabatan memuat nama dan departemen induk; tab Lokasi Kantor memuat nama, alamat, daftar IP yang diizinkan (array), latitude/longitude/radius untuk verifikasi GPS, serta jam masuk dan jam pulang; tab Jenis Cuti memuat nama, kuota tahunan (0–365), status berbayar/tidak, dan pembatasan gender (Male/Female/Tanpa pembatasan). Penghapusan data dilakukan secara soft delete dengan mengisi kolom `deletedAt` sehingga referensi historis tetap terjaga.

25. Halaman Log Audit

[Sisipkan gambar di sini]

Halaman Log Audit merupakan halaman yang digunakan secara eksklusif oleh Super Admin untuk menelusuri riwayat seluruh aksi penting (CREATE, UPDATE, DELETE) yang dilakukan pengguna terhadap data sistem. Pada halaman ini ditampilkan empat kartu ringkasan (Total Entri, Aksi Buat, Aksi Ubah, dan Aksi Hapus) serta tabel log audit yang memuat kolom waktu, nama pengguna, email pengguna, aksi, modul, dan ID target. Pengguna dapat memfilter log berdasarkan pengguna (dropdown daftar user yang pernah melakukan aksi), modul (dropdown daftar modul yang pernah dicatat), serta rentang tanggal mulai dan tanggal selesai, kemudian mengeklik baris log untuk membuka halaman detail. Halaman ini dilengkapi dengan fitur pagination yang dapat dikonfigurasi melalui parameter `page` dan `pageSize` pada URL. Data audit log tidak dapat diubah atau dihapus oleh siapa pun melalui antarmuka untuk menjaga integritas jejak audit.

26. Halaman Detail Log Audit

[Sisipkan gambar di sini]

Halaman Detail Log Audit merupakan halaman yang digunakan secara eksklusif oleh Super Admin untuk melihat rincian satu entri log audit beserta perubahan nilai yang dicatat. Pada halaman ini ditampilkan badge aksi (CREATE/UPDATE/DELETE) dengan warna yang berbeda, meta informasi (pengguna pelaku, modul yang terdampak, ID target, dan waktu kejadian dengan format lokal Indonesia), serta panel perbandingan nilai sebelum (`oldValue`) dan sesudah (`newValue`) yang ditampilkan dalam bentuk daftar field-by-field. Pengguna dapat membandingkan perubahan per kolom dengan indikator visual (ikon Plus untuk penambahan, Minus untuk penghapusan, dan Equal untuk nilai yang tidak berubah), serta menekan tombol "Kembali" untuk kembali ke daftar log. Halaman ini bersifat sepenuhnya read-only dan menjadi rujukan utama untuk forensik perubahan data, terutama pada modul karyawan, penggajian, dan pengaturan sistem. Apabila aksi yang dicatat adalah CREATE atau DELETE, panel `oldValue` atau `newValue` akan kosong sesuai konteks.
