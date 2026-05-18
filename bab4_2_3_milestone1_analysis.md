# BAB IV ANALISIS DAN PERANCANGAN SISTEM (lanjutan)

## 4.2 Milestone 1: Requirements Review

Pada *Milestone 1: Requirements Review* dilakukan peninjauan kembali terhadap hasil tahap *requirements* untuk memastikan bahwa *domain model* dan *use case* yang telah dirumuskan benar-benar dapat memenuhi seluruh kebutuhan fungsional (SRS) sistem HRMS PT Sinergi Asta Nusantara. Peninjauan dilakukan dengan menelusuri keterkaitan antara setiap kebutuhan fungsional dengan *use case* yang mendukungnya serta *domain object* yang terlibat di dalam interaksi tersebut.

Berdasarkan hasil peninjauan, seluruh kebutuhan fungsional pada Tabel 4.1 telah memiliki *use case* yang sesuai pada Tabel 4.2, dan setiap *use case* dapat dipetakan ke himpunan *domain object* yang konkret pada *domain model* (Gambar 4.9). Dengan demikian, *domain model* dan *use case* dinilai telah memenuhi kebutuhan fungsional sistem dan siap dijadikan landasan untuk tahap *analysis and preliminary design*.

Untuk mendokumentasikan kesimpulan tersebut, disusun matriks keterlacakan (*traceability matrix*) yang menghubungkan SRS, *use case*, dan *domain object*. Matriks ini ditampilkan pada Tabel 4.35.

**Tabel 4.35 *Traceability Matrix* — SRS, *Use Case*, dan *Domain Model***

| No | SRS ID | Use Case ID | Domain Model |
|----|--------|-------------|--------------|
| 1 | SRS-HRMS-F-01 | UC-HRMS-01 | User |
| 2 | SRS-HRMS-F-02 | UC-HRMS-02 | User |
| 3 | SRS-HRMS-F-03 | UC-HRMS-03 | User, Employee, AttendanceRecord, LeaveRequest, PayrollEntry |
| 4 | SRS-HRMS-F-04 | UC-HRMS-04 | User, AuditLog |
| 5 | SRS-HRMS-F-05 | UC-HRMS-05 | Department, AuditLog |
| 6 | SRS-HRMS-F-06 | UC-HRMS-06 | Position, Department, AuditLog |
| 7 | SRS-HRMS-F-07 | UC-HRMS-07 | OfficeLocation, AuditLog |
| 8 | SRS-HRMS-F-08 | UC-HRMS-08 | LeaveType, AuditLog |
| 9 | SRS-HRMS-F-09 | UC-HRMS-09 | AuditLog, User |
| 10 | SRS-HRMS-F-10 | UC-HRMS-10 | Employee, Department, Position |
| 11 | SRS-HRMS-F-11 | UC-HRMS-11 | User, Employee, Department, Position, AuditLog |
| 12 | SRS-HRMS-F-12 | UC-HRMS-12 | Employee, AuditLog |
| 13 | SRS-HRMS-F-13 | UC-HRMS-12 | Employee, Department, Position, OfficeLocation, AuditLog |
| 14 | SRS-HRMS-F-14 | UC-HRMS-12 | Employee, AuditLog |
| 15 | SRS-HRMS-F-15 | UC-HRMS-13 | EmployeeDocument, Employee |
| 16 | SRS-HRMS-F-16 | UC-HRMS-14 | EmergencyContact, Employee, AuditLog |
| 17 | SRS-HRMS-F-17 | UC-HRMS-15 | Employee, User, AuditLog |
| 18 | SRS-HRMS-F-18 | UC-HRMS-16 | Vacancy, Department |
| 19 | SRS-HRMS-F-19 | UC-HRMS-17 | Candidate, Vacancy |
| 20 | SRS-HRMS-F-20 | UC-HRMS-18 | Candidate |
| 21 | SRS-HRMS-F-21 | UC-HRMS-19 | Interview, Candidate |
| 22 | SRS-HRMS-F-22 | UC-HRMS-20 | Candidate |
| 23 | SRS-HRMS-F-23 | UC-HRMS-21 | Candidate, User, Employee, AuditLog |
| 24 | SRS-HRMS-F-24 | UC-HRMS-22 | AttendanceRecord, Employee, OfficeLocation |
| 25 | SRS-HRMS-F-25 | UC-HRMS-22 | AttendanceRecord, Employee |
| 26 | SRS-HRMS-F-26 | UC-HRMS-23 | AttendanceRecord, Employee, Department, OfficeLocation |
| 27 | SRS-HRMS-F-27 | UC-HRMS-24 | AttendanceRecord, User, AuditLog |
| 28 | SRS-HRMS-F-28 | UC-HRMS-25 | AttendanceRecord, Employee |
| 29 | SRS-HRMS-F-29 | UC-HRMS-26 | LeaveRequest, LeaveType, LeaveBalance, Employee |
| 30 | SRS-HRMS-F-30 | UC-HRMS-27 | LeaveRequest, User, LeaveBalance, AuditLog |
| 31 | SRS-HRMS-F-31 | UC-HRMS-28 | LeaveRequest |
| 32 | SRS-HRMS-F-32 | UC-HRMS-26 | LeaveBalance, LeaveRequest, LeaveType |
| 33 | SRS-HRMS-F-33 | UC-HRMS-29 | LeaveRequest, LeaveType |
| 34 | SRS-HRMS-F-34 | UC-HRMS-30 | PayrollRun |
| 35 | SRS-HRMS-F-35 | UC-HRMS-30 | PayrollRun, PayrollEntry, Employee, AuditLog |
| 36 | SRS-HRMS-F-36 | UC-HRMS-30 | PayrollRun, PayrollEntry |
| 37 | SRS-HRMS-F-37 | UC-HRMS-31 | PayrollRun, AuditLog |
| 38 | SRS-HRMS-F-38 | UC-HRMS-32 | PayrollEntry, Employee |
| 39 | SRS-HRMS-F-39 | UC-HRMS-32 | PayrollEntry, PayrollRun, Employee |

Seluruh 39 kebutuhan fungsional telah tertelusur ke 32 *use case* yang seluruhnya memiliki *route* atau *server action* yang nyata di basis kode (lihat Tabel 4.2 dan referensi *server action* di sub-bab 4.1.5.3). Dengan demikian, *Milestone 1* dinyatakan selesai dan tahap berikutnya, yaitu *Analysis/Preliminary Design*, dapat dilakukan.

## 4.3 Tahap Analysis/Preliminary Design

Tahap *analysis/preliminary design* dalam ICONIX Process memiliki dua aktivitas utama, yaitu *robustness analysis* dan *update domain model*. *Robustness analysis* berperan sebagai jembatan antara *use case* dan *sequence diagram* dengan cara mengidentifikasi tiga jenis objek pada setiap *use case*: objek *boundary* yang berinteraksi langsung dengan pengguna, objek *control* yang menangani logika dan koordinasi, serta objek *entity* yang merepresentasikan data persisten. Selanjutnya, hasil analisis tersebut menjadi dasar untuk memperbarui *domain model* sehingga muncul atribut-atribut yang sebelumnya tidak terlihat pada *domain model* awal.

### 4.3.1 Robustness Analysis

Pada bagian ini disajikan *robustness diagram* untuk seluruh 32 *use case* sistem HRMS PT SAN. Setiap *robustness diagram* diberi pengenal **RD-HRMS-XX** yang merujuk pada nomor *use case* terkait.

**1. *Robustness Diagram* Login (RD-HRMS-01)**

*Robustness diagram* Login memberikan gambaran ketika pengguna (Superadmin, HR Admin, *Manager*, atau *Employee*) memasukkan kredensial pada halaman *login*. Halaman *login* (`/login`) sebagai *boundary* meneruskan masukan ke kontroler validasi `loginSchema` dan kemudian ke kontroler `signIn(credentials)` yang melakukan `bcrypt.compare` pada *hash password* milik entitas `User`. Bila valid, kontroler membentuk JWT *session* dan mengarahkan pengguna ke `/dashboard`; bila tidak, *boundary* notifikasi menampilkan pesan kesalahan. Gambar 4.24 menunjukkan *robustness diagram* Login.

```plantuml
@startuml robustness_uc01_login
title Robustness Diagram — UC-HRMS-01 Login

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Pengguna" as A
boundary "Halaman\nLogin" as B1
control "Validasi\nInput" as C1
control "Autentikasi\nCredentials" as C2
entity "User" as E1
control "Verifikasi\nPassword" as C3
control "Membuat\nSesi JWT" as C4
boundary "Halaman\nDashboard" as B2
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> BErr : Tidak
C1 --> C2 : Ya
C2 --> E1
C2 --> C3
C3 --> BErr : Tidak
C3 --> C4 : Ya
C4 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.24 *Robustness Diagram* Login (RD-HRMS-01)**

**2. *Robustness Diagram* Logout (RD-HRMS-02)**

*Robustness diagram* Logout memberikan gambaran ketika pengguna mengakhiri sesinya. *Header* sebagai *boundary* memanggil kontroler `signOut()` yang menghapus JWT *cookie*. Gambar 4.25 menunjukkan *robustness diagram* Logout.

```plantuml
@startuml robustness_uc02_logout
title Robustness Diagram — UC-HRMS-02 Logout

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Pengguna" as A
boundary "Header\nProfil" as B1
control "Memanggil\nsignOut" as C1
control "Menghapus\nSesi JWT" as C2
boundary "Halaman\nLogin" as B2

A --> B1
B1 --> C1
C1 --> C2
C2 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.25 *Robustness Diagram* Logout (RD-HRMS-02)**

**3. *Robustness Diagram* Melihat Dashboard (RD-HRMS-03)**

*Robustness diagram* Melihat *Dashboard* memberikan gambaran ketika pengguna membuka `/dashboard`. Berdasarkan peran yang tersimpan pada sesi JWT, kontroler `getDashboardData` mendispatch pemanggilan ke salah satu dari `getSuperAdminDashboardData`, `getHrAdminDashboardData`, `getManagerDashboardData`, atau `getEmployeeDashboardData`, yang masing-masing membaca entitas terkait. Gambar 4.26 menunjukkan *robustness diagram* Melihat *Dashboard*.

```plantuml
@startuml robustness_uc03_dashboard
title Robustness Diagram — UC-HRMS-03 Melihat Dashboard

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Pengguna" as A
boundary "Halaman\nDashboard" as B1
control "Dispatcher\nPeran" as C1
control "Mengambil\nData Dashboard" as C2
entity "User" as E1
entity "Employee" as E2
entity "AttendanceRecord" as E3
entity "LeaveRequest" as E4
entity "PayrollEntry" as E5
boundary "Menampilkan\nRingkasan" as B2

A --> B1
B1 --> C1
C1 --> C2
C2 --> E1
C2 --> E2
C2 --> E3
C2 --> E4
C2 --> E5
C2 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.26 *Robustness Diagram* Melihat Dashboard (RD-HRMS-03)**

**4. *Robustness Diagram* Mengelola Pengguna Sistem (RD-HRMS-04)**

*Robustness diagram* Mengelola Pengguna Sistem memberikan gambaran ketika Superadmin menambah, mengubah, atau mengaktifkan/menonaktifkan akun pengguna. Halaman `/users` dan `UserFormDialog` sebagai *boundary* memanggil kontroler `createUserAction`, `updateUserAction`, atau `toggleUserActiveAction`. Kontroler validasi `createUserSchema`/`updateUserSchema` memvalidasi masukan sebelum perubahan disimpan ke entitas `User` dan dicatat pada `AuditLog`. Gambar 4.27 menunjukkan *robustness diagram* Mengelola Pengguna Sistem.

```plantuml
@startuml robustness_uc04_users
title Robustness Diagram — UC-HRMS-04 Mengelola Pengguna Sistem

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Superadmin" as A
boundary "Halaman\nPengguna" as B1
control "Menampilkan\nForm Tambah" as C1
boundary "Form Tambah\nPengguna" as B2
control "Validasi\nInput" as C2
control "Hash\nPassword" as C3
control "Menyimpan\nUser" as C4
entity "User" as E1
control "Mencatat\nAudit Log" as C5
entity "AuditLog" as E2
control "Mengaktifkan/\nMenonaktifkan User" as CTog
control "Menampilkan\nForm Edit" as CEdit
boundary "Form Edit\nPengguna" as BEdit
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> C4
C4 --> E1
C4 --> C5
C5 --> E2
B1 --> CEdit
CEdit --> BEdit
BEdit --> C2
B1 --> CTog
CTog --> E1
CTog --> C5
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.27 *Robustness Diagram* Mengelola Pengguna Sistem (RD-HRMS-04)**

**5. *Robustness Diagram* Mengelola Master Departemen (RD-HRMS-05)**

*Robustness diagram* Mengelola *Master* Departemen memberikan gambaran ketika Superadmin mengelola data departemen pada tab Departemen di halaman `/master-data`. *Boundary* `DepartmentFormDialog` mengirim data ke kontroler `createDepartmentAction`, `updateDepartmentAction`, atau `deleteDepartmentAction`, yang memvalidasi melalui `departmentSchema` dan memodifikasi entitas `Department` (penghapusan bersifat *soft delete* melalui kolom `deletedAt`). Gambar 4.28 menunjukkan *robustness diagram* Mengelola *Master* Departemen.

```plantuml
@startuml robustness_uc05_department
title Robustness Diagram — UC-HRMS-05 Mengelola Master Departemen

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Superadmin" as A
boundary "Tab\nDepartemen" as B1
control "Menampilkan\nForm Tambah" as C1
boundary "Form Tambah\nDepartemen" as B2
control "Validasi\nInput" as C2
control "Menyimpan\ndata Departemen" as C3
entity "Department" as E1
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E2
control "Menghapus\ndata Departemen" as CDel
control "Menampilkan\nForm Edit" as CEdit
boundary "Form Edit\nDepartemen" as BEdit
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> C4
C4 --> E2
B1 --> CEdit
CEdit --> BEdit
BEdit --> C2
B1 --> CDel
CDel --> E1
CDel --> C4
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.28 *Robustness Diagram* Mengelola *Master* Departemen (RD-HRMS-05)**

**6. *Robustness Diagram* Mengelola Master Jabatan (RD-HRMS-06)**

*Robustness diagram* Mengelola *Master* Jabatan memberikan gambaran ketika Superadmin menambah/mengubah/menghapus jabatan yang terikat pada satu departemen. *Boundary* `PositionFormDialog` memuat *dropdown* departemen yang dimuat dari entitas `Department`, lalu memanggil kontroler `createPositionAction`/`updatePositionAction`/`deletePositionAction`. Gambar 4.29 menunjukkan *robustness diagram* Mengelola *Master* Jabatan.

```plantuml
@startuml robustness_uc06_position
title Robustness Diagram — UC-HRMS-06 Mengelola Master Jabatan

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Superadmin" as A
boundary "Tab\nJabatan" as B1
control "Menampilkan\nForm Tambah" as C1
boundary "Form Tambah\nJabatan" as B2
control "Validasi\nInput" as C2
control "Menyimpan\ndata Jabatan" as C3
entity "Position" as E1
entity "Department" as E2
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E3
control "Menghapus\ndata Jabatan" as CDel
control "Menampilkan\nForm Edit" as CEdit
boundary "Form Edit\nJabatan" as BEdit
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> E2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> C4
C4 --> E3
B1 --> CEdit
CEdit --> BEdit
BEdit --> C2
B1 --> CDel
CDel --> E1
CDel --> C4
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.29 *Robustness Diagram* Mengelola *Master* Jabatan (RD-HRMS-06)**

**7. *Robustness Diagram* Mengelola Master Lokasi Kantor (RD-HRMS-07)**

*Robustness diagram* Mengelola *Master* Lokasi Kantor memberikan gambaran ketika Superadmin mengelola lokasi kantor untuk validasi kehadiran. *Boundary* `OfficeLocationFormDialog` mengirim data (nama, alamat, `allowedIPs`, koordinat GPS, `radiusMeters`, jam kerja) ke kontroler `createOfficeLocationAction`/`updateOfficeLocationAction`/`deleteOfficeLocationAction`. Gambar 4.30 menunjukkan *robustness diagram* Mengelola *Master* Lokasi Kantor.

```plantuml
@startuml robustness_uc07_office
title Robustness Diagram — UC-HRMS-07 Mengelola Master Lokasi Kantor

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Superadmin" as A
boundary "Tab Lokasi\nKantor" as B1
control "Menampilkan\nForm Tambah" as C1
boundary "Form Tambah\nLokasi Kantor" as B2
control "Validasi\nInput" as C2
control "Menyimpan\nLokasi Kantor" as C3
entity "OfficeLocation" as E1
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E2
control "Menghapus\nLokasi Kantor" as CDel
control "Menampilkan\nForm Edit" as CEdit
boundary "Form Edit\nLokasi Kantor" as BEdit
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> C4
C4 --> E2
B1 --> CEdit
CEdit --> BEdit
BEdit --> C2
B1 --> CDel
CDel --> E1
CDel --> C4
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.30 *Robustness Diagram* Mengelola *Master* Lokasi Kantor (RD-HRMS-07)**

**8. *Robustness Diagram* Mengelola Master Jenis Cuti (RD-HRMS-08)**

*Robustness diagram* Mengelola *Master* Jenis Cuti memberikan gambaran ketika Superadmin menambah/mengubah/menghapus jenis cuti beserta kuotanya. *Boundary* `LeaveTypeFormDialog` mengirim data (nama, kuota tahunan, *isPaid*, restriksi *gender*) ke kontroler terkait. Gambar 4.31 menunjukkan *robustness diagram* Mengelola *Master* Jenis Cuti.

```plantuml
@startuml robustness_uc08_leavetype
title Robustness Diagram — UC-HRMS-08 Mengelola Master Jenis Cuti

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Superadmin" as A
boundary "Tab Jenis\nCuti" as B1
control "Menampilkan\nForm Tambah" as C1
boundary "Form Tambah\nJenis Cuti" as B2
control "Validasi\nInput" as C2
control "Menyimpan\nJenis Cuti" as C3
entity "LeaveType" as E1
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E2
control "Menghapus\nJenis Cuti" as CDel
control "Menampilkan\nForm Edit" as CEdit
boundary "Form Edit\nJenis Cuti" as BEdit
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> C4
C4 --> E2
B1 --> CEdit
CEdit --> BEdit
BEdit --> C2
B1 --> CDel
CDel --> E1
CDel --> C4
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.31 *Robustness Diagram* Mengelola *Master* Jenis Cuti (RD-HRMS-08)**

**9. *Robustness Diagram* Melihat Log Audit (RD-HRMS-09)**

*Robustness diagram* Melihat *Log Audit* memberikan gambaran ketika Superadmin menelusuri jejak audit. Halaman `/audit-log` sebagai *boundary* memanggil kontroler `getAuditLogs` yang membaca entitas `AuditLog` beserta relasi `User` pelaku. Detail per *entry* diakses melalui `/audit-log/[id]` dengan kontroler `getAuditLogById`. Gambar 4.32 menunjukkan *robustness diagram* Melihat *Log Audit*.

```plantuml
@startuml robustness_uc09_auditlog
title Robustness Diagram — UC-HRMS-09 Melihat Log Audit

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Superadmin" as A
boundary "Halaman\nLog Audit" as B1
control "Mengambil\nDaftar Log" as C1
entity "AuditLog" as E1
entity "User" as E2
boundary "Tabel\nLog Audit" as B2
control "Menampilkan\nDetail Log" as C2
boundary "Halaman\nDetail Log" as B3

A --> B1
B1 --> C1
C1 --> E1
C1 --> E2
C1 --> B2
B2 --> C2
C2 --> E1
C2 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.32 *Robustness Diagram* Melihat *Log Audit* (RD-HRMS-09)**

**10. *Robustness Diagram* Melihat Daftar Karyawan (RD-HRMS-10)**

*Robustness diagram* Melihat Daftar Karyawan memberikan gambaran ketika HR Admin, *Manager*, atau *Employee* mengakses `/employees`. *Boundary* halaman daftar karyawan memanggil kontroler `getEmployees` (HR/Superadmin) atau `getEmployeesForManager` (Manager). Kontroler membaca entitas `Employee` beserta relasi `Department` dan `Position`. Gambar 4.33 menunjukkan *robustness diagram* Melihat Daftar Karyawan.

```plantuml
@startuml robustness_uc10_listemployees
title Robustness Diagram — UC-HRMS-10 Melihat Daftar Karyawan

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin /\nManager /\nEmployee" as A
boundary "Halaman\nDaftar Karyawan" as B1
control "Memproses\nFilter" as C1
control "Mengambil\ndata Karyawan" as C2
entity "Employee" as E1
entity "Department" as E2
entity "Position" as E3
boundary "Tabel\nKaryawan" as B2

A --> B1
B1 --> C1
C1 --> C2
C2 --> E1
C2 --> E2
C2 --> E3
C2 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.33 *Robustness Diagram* Melihat Daftar Karyawan (RD-HRMS-10)**

**11. *Robustness Diagram* Menambah Data Karyawan (RD-HRMS-11)**

*Robustness diagram* Menambah Data Karyawan memberikan gambaran ketika HR Admin mengisi *form* di `/employees/new`. *Boundary* `CreateEmployeeForm` mengirim data ke `createEmployeeAction`, yang memvalidasi melalui `createEmployeeSchema`, melakukan `bcrypt.hash` pada *password* awal, lalu membuat entitas `User` dan `Employee` dalam satu transaksi, serta mencatat `AuditLog`. Gambar 4.34 menunjukkan *robustness diagram* Menambah Data Karyawan.

```plantuml
@startuml robustness_uc11_createemployee
title Robustness Diagram — UC-HRMS-11 Menambah Data Karyawan

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman\nDaftar Karyawan" as B1
control "Menampilkan\nForm Tambah" as C1
boundary "Form Tambah\nKaryawan" as B2
control "Validasi\nInput" as C2
control "Generate\nNIK" as C3
control "Hash\nPassword" as C4
control "Menyimpan\ndata Karyawan" as C5
entity "User" as E1
entity "Employee" as E2
control "Mencatat\nAudit Log" as C6
entity "AuditLog" as E3
boundary "Halaman\nProfil Karyawan" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> C4
C4 --> E1
C4 --> C5
C5 --> E2
C5 --> C6
C6 --> E3
C5 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.34 *Robustness Diagram* Menambah Data Karyawan (RD-HRMS-11)**

**12. *Robustness Diagram* Mengubah Profil Karyawan (RD-HRMS-12)**

*Robustness diagram* Mengubah Profil Karyawan memberikan gambaran ketika HR Admin memutakhirkan informasi pada salah satu dari tiga *tab* (Personal, Kepegawaian, Pajak & BPJS) di halaman `/employees/[id]`. Tiap *tab* memanggil kontroler yang berbeda — `updatePersonalInfoAction`, `updateEmploymentAction`, atau `updateTaxBpjsAction` — dengan skema validasi tersendiri. Gambar 4.35 menunjukkan *robustness diagram* Mengubah Profil Karyawan.

```plantuml
@startuml robustness_uc12_updateprofile
title Robustness Diagram — UC-HRMS-12 Mengubah Profil Karyawan

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman Profil\nKaryawan" as B1
control "Memilih\nTab" as C1
boundary "Form Edit\nTab Aktif" as B2
control "Validasi\nInput" as C2
control "Memperbarui\nProfil Karyawan" as C3
entity "Employee" as E1
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E2
boundary "Notifikasi\nBerhasil" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> C4
C4 --> E2
C3 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.35 *Robustness Diagram* Mengubah Profil Karyawan (RD-HRMS-12)**

**13. *Robustness Diagram* Mengelola Dokumen Karyawan (RD-HRMS-13)**

*Robustness diagram* Mengelola Dokumen Karyawan memberikan gambaran ketika HR Admin mengunggah, mengunduh, atau menghapus dokumen pada *tab* "Dokumen". *Boundary* mengirim *file* ke API *route* `POST/GET/DELETE /api/employees/[id]/documents`, yang menyimpan berkas ke *filesystem* lokal dan mencatat metadata pada entitas `EmployeeDocument`. Gambar 4.36 menunjukkan *robustness diagram* Mengelola Dokumen Karyawan.

```plantuml
@startuml robustness_uc13_documents
title Robustness Diagram — UC-HRMS-13 Mengelola Dokumen Karyawan

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Tab\nDokumen" as B1
control "Memilih\nFile" as C1
control "Validasi MIME\n& Ukuran" as C2
control "Menyimpan\nFile" as C3
control "Menyimpan\nMetadata" as C4
entity "EmployeeDocument" as E1
boundary "Notifikasi\nBerhasil" as B2
control "Mengunduh\nDokumen" as CDown
control "Menghapus\nDokumen" as CDel
boundary "Berkas\nDokumen" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> C4
C4 --> E1
C4 --> B2
B1 --> CDown
CDown --> E1
CDown --> B3
B1 --> CDel
CDel --> E1
CDel --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.36 *Robustness Diagram* Mengelola Dokumen Karyawan (RD-HRMS-13)**

**14. *Robustness Diagram* Mengelola Kontak Darurat (RD-HRMS-14)**

*Robustness diagram* Mengelola Kontak Darurat memberikan gambaran ketika HR Admin menambah, mengubah, atau menghapus kontak darurat karyawan. *Boundary* `EmergencyContactsTab` mengirim data ke kontroler `createEmergencyContactAction`, `updateEmergencyContactAction`, atau `deleteEmergencyContactAction`, yang divalidasi melalui `emergencyContactSchema`. Gambar 4.37 menunjukkan *robustness diagram* Mengelola Kontak Darurat.

```plantuml
@startuml robustness_uc14_emergency
title Robustness Diagram — UC-HRMS-14 Mengelola Kontak Darurat

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Tab Kontak\nDarurat" as B1
control "Menampilkan\nForm Tambah" as C1
boundary "Form Kontak\nDarurat" as B2
control "Validasi\nInput" as C2
control "Menyimpan\nKontak Darurat" as C3
entity "EmergencyContact" as E1
boundary "Notifikasi\nBerhasil" as B3
control "Menghapus\nKontak Darurat" as CDel
control "Menampilkan\nForm Edit" as CEdit
boundary "Form Edit\nKontak" as BEdit
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> B3
B1 --> CEdit
CEdit --> BEdit
BEdit --> C2
B1 --> CDel
CDel --> E1
CDel --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.37 *Robustness Diagram* Mengelola Kontak Darurat (RD-HRMS-14)**

**15. *Robustness Diagram* Menonaktifkan Karyawan (RD-HRMS-15)**

*Robustness diagram* Menonaktifkan Karyawan memberikan gambaran ketika HR Admin menonaktifkan karyawan beserta tanggal dan alasannya. *Boundary* `DeactivateEmployeeDialog` mengirim data ke `deactivateEmployeeAction` yang memvalidasi `deactivateEmployeeSchema`, lalu memperbarui `isActive=false`, `terminationDate`, `terminationReason` pada entitas `Employee` dan mengupdate `User.isActive=false`. Gambar 4.38 menunjukkan *robustness diagram* Menonaktifkan Karyawan.

```plantuml
@startuml robustness_uc15_deactivate
title Robustness Diagram — UC-HRMS-15 Menonaktifkan Karyawan

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman Profil\nKaryawan" as B1
control "Menampilkan\nDialog Konfirmasi" as C1
boundary "Dialog\nNonaktifkan" as B2
control "Validasi\nInput" as C2
control "Menonaktifkan\nKaryawan" as C3
entity "Employee" as E1
entity "User" as E2
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E3
boundary "Notifikasi\nBerhasil" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> E2
C3 --> C4
C4 --> E3
C3 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.38 *Robustness Diagram* Menonaktifkan Karyawan (RD-HRMS-15)**

**16. *Robustness Diagram* Mengelola Lowongan (RD-HRMS-16)**

*Robustness diagram* Mengelola Lowongan memberikan gambaran ketika HR Admin membuat/mengubah lowongan atau mengubah status OPEN/CLOSED. Halaman `/recruitment` dan `/recruitment/new` sebagai *boundary* memanggil `createVacancyAction`, `updateVacancyAction`, atau `toggleVacancyStatusAction`. Gambar 4.39 menunjukkan *robustness diagram* Mengelola Lowongan.

```plantuml
@startuml robustness_uc16_vacancy
title Robustness Diagram — UC-HRMS-16 Mengelola Lowongan

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman\nRekrutmen" as B1
control "Menampilkan\nForm Tambah" as C1
boundary "Form Tambah\nLowongan" as B2
control "Validasi\nInput" as C2
control "Menyimpan\nLowongan" as C3
entity "Vacancy" as E1
entity "Department" as E2
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E3
boundary "Notifikasi\nBerhasil" as B3
control "Mengubah\nStatus Lowongan" as CTog
control "Menampilkan\nForm Edit" as CEdit
boundary "Form Edit\nLowongan" as BEdit
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> E2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> C4
C4 --> E3
C3 --> B3
B1 --> CEdit
CEdit --> BEdit
BEdit --> C2
B1 --> CTog
CTog --> E1
CTog --> C4
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.39 *Robustness Diagram* Mengelola Lowongan (RD-HRMS-16)**

**17. *Robustness Diagram* Mengelola Kandidat (RD-HRMS-17)**

*Robustness diagram* Mengelola Kandidat memberikan gambaran ketika HR Admin menambahkan kandidat baru beserta CV-nya. *Boundary* `AddCandidateDialog` mengirim *file* CV ke `POST /api/recruitment/cv`, lalu memanggil `createCandidateAction` dengan `cvPath` hasil unggahan. Entitas `Candidate` dibuat dengan `stage = MELAMAR` dan terhubung ke `Vacancy`. Gambar 4.40 menunjukkan *robustness diagram* Mengelola Kandidat.

```plantuml
@startuml robustness_uc17_candidate
title Robustness Diagram — UC-HRMS-17 Mengelola Kandidat

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman Detail\nLowongan" as B1
control "Menampilkan\nDialog Tambah" as C1
boundary "Dialog Tambah\nKandidat" as B2
control "Mengunggah\nCV" as C2
control "Validasi\nInput" as C3
control "Menyimpan\nKandidat" as C4
entity "Candidate" as E1
entity "Vacancy" as E2
boundary "Notifikasi\nBerhasil" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> BErr : Tidak
C3 --> C4 : Ya
C4 --> E1
C4 --> E2
C4 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.40 *Robustness Diagram* Mengelola Kandidat (RD-HRMS-17)**

**18. *Robustness Diagram* Mengubah Tahap Kandidat (RD-HRMS-18)**

*Robustness diagram* Mengubah Tahap Kandidat memberikan gambaran ketika HR Admin menggeser kartu kandidat antar kolom *kanban*. *Boundary* `KanbanBoard` (berbasis dnd-kit) memanggil kontroler `updateCandidateStageAction` yang memvalidasi `updateCandidateStageSchema` dan memperbarui *field* `stage` pada entitas `Candidate`. Gambar 4.41 menunjukkan *robustness diagram* Mengubah Tahap Kandidat.

```plantuml
@startuml robustness_uc18_stage
title Robustness Diagram — UC-HRMS-18 Mengubah Tahap Kandidat

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Kanban\nBoard" as B1
control "Menangkap\nDrag & Drop" as C1
control "Validasi\nTahap" as C2
control "Memperbarui\nTahap Kandidat" as C3
entity "Candidate" as E1
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E2
boundary "Notifikasi\nBerhasil" as B2
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> C4
C4 --> E2
C3 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.41 *Robustness Diagram* Mengubah Tahap Kandidat (RD-HRMS-18)**

**19. *Robustness Diagram* Menjadwalkan Interview (RD-HRMS-19)**

*Robustness diagram* Menjadwalkan *Interview* memberikan gambaran ketika HR Admin menjadwalkan *interview* untuk seorang kandidat di `/recruitment/candidates/[candidateId]`. *Boundary* `CandidateDetailClient` mengirim data ke `createInterviewAction` yang memvalidasi `createInterviewSchema` dan menyimpan entitas `Interview`. Gambar 4.42 menunjukkan *robustness diagram* Menjadwalkan *Interview*.

```plantuml
@startuml robustness_uc19_interview
title Robustness Diagram — UC-HRMS-19 Menjadwalkan Interview

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman Detail\nKandidat" as B1
control "Menampilkan\nForm Interview" as C1
boundary "Form Tambah\nInterview" as B2
control "Validasi\nInput" as C2
control "Menyimpan\nInterview" as C3
entity "Interview" as E1
entity "Candidate" as E2
boundary "Notifikasi\nBerhasil" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> E2
C3 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.42 *Robustness Diagram* Menjadwalkan *Interview* (RD-HRMS-19)**

**20. *Robustness Diagram* Mengelola Penawaran Kerja (RD-HRMS-20)**

*Robustness diagram* Mengelola Penawaran Kerja memberikan gambaran ketika HR Admin mencatat *offer salary* dan *offer notes* lalu menghasilkan PDF *offer letter*. *Boundary* `CandidateDetailClient` memanggil `updateOfferAction` untuk memperbarui entitas `Candidate`, kemudian memanggil API *route* `GET /api/recruitment/offer-letter/[candidateId]` yang merender PDF melalui `offer-letter-pdf.tsx`. Gambar 4.43 menunjukkan *robustness diagram* Mengelola Penawaran Kerja.

```plantuml
@startuml robustness_uc20_offer
title Robustness Diagram — UC-HRMS-20 Mengelola Penawaran Kerja

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman Detail\nKandidat" as B1
control "Validasi\nOffer" as C1
control "Menyimpan\nPenawaran" as C2
entity "Candidate" as E1
boundary "Notifikasi\nBerhasil" as B2
control "Membuat\nOffer Letter" as CPdf
boundary "Berkas PDF\nOffer Letter" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> BErr : Tidak
C1 --> C2 : Ya
C2 --> E1
C2 --> B2
B1 --> CPdf
CPdf --> E1
CPdf --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.43 *Robustness Diagram* Mengelola Penawaran Kerja (RD-HRMS-20)**

**21. *Robustness Diagram* Mengonversi Kandidat menjadi Karyawan (RD-HRMS-21)**

*Robustness diagram* Mengonversi Kandidat menjadi Karyawan memberikan gambaran ketika HR Admin mengonversi kandidat dengan tahap DITERIMA menjadi entitas `Employee`. *Boundary* `CandidateDetailClient` memanggil `convertCandidateToEmployeeAction`, yang membuat `User` (peran EMPLOYEE) dan `Employee` baru menggunakan data kandidat, mengisi `Candidate.hiredAt`, serta mencatat `AuditLog`. Gambar 4.44 menunjukkan *robustness diagram* Mengonversi Kandidat menjadi Karyawan.

```plantuml
@startuml robustness_uc21_convert
title Robustness Diagram — UC-HRMS-21 Mengonversi Kandidat menjadi Karyawan

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman Detail\nKandidat" as B1
control "Cek Tahap\nKandidat" as C1
control "Hash\nPassword Awal" as C2
control "Membuat\nUser & Employee" as C3
entity "Candidate" as E1
entity "User" as E2
entity "Employee" as E3
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E4
boundary "Notifikasi\nBerhasil" as B2
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> BErr : Tidak
C1 --> C2 : Ya
C2 --> C3
C3 --> E2
C3 --> E3
C3 --> E1
C3 --> C4
C4 --> E4
C3 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.44 *Robustness Diagram* Mengonversi Kandidat menjadi Karyawan (RD-HRMS-21)**

**22. *Robustness Diagram* Mencatat Kehadiran (RD-HRMS-22)**

*Robustness diagram* Mencatat Kehadiran memberikan gambaran ketika *Employee* menekan tombol "Absen Masuk"/"Absen Pulang" pada `/attendance`. *Boundary* `ClockInButton` mengambil koordinat GPS dari *browser* dan memanggil `clockInAction`/`clockOutAction`. Kontroler memvalidasi lokasi melalui `verifyLocation` terhadap entitas `OfficeLocation` (IP *allowlist* + radius GPS), menghitung *flags* keterlambatan melalui `calculateAttendanceFlags`, lalu menyimpan entitas `AttendanceRecord`. Gambar 4.45 menunjukkan *robustness diagram* Mencatat Kehadiran.

```plantuml
@startuml robustness_uc22_clock
title Robustness Diagram — UC-HRMS-22 Mencatat Kehadiran

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Employee" as A
boundary "Halaman\nAbsensi" as B1
control "Mengambil\nKoordinat GPS" as C1
control "Verifikasi\nLokasi" as C2
entity "OfficeLocation" as E1
control "Menghitung\nFlags Absensi" as C3
control "Menyimpan\nClock In/Out" as C4
entity "Employee" as E2
entity "AttendanceRecord" as E3
boundary "Notifikasi\nBerhasil" as B2
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> C2
C2 --> E1
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> C4
C4 --> E2
C4 --> E3
C4 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.45 *Robustness Diagram* Mencatat Kehadiran (RD-HRMS-22)**

**23. *Robustness Diagram* Melihat Rekap Absensi (RD-HRMS-23)**

*Robustness diagram* Melihat Rekap Absensi memberikan gambaran ketika HR Admin atau *Manager* membuka `/attendance-admin`. *Boundary* `AttendanceSummaryTable` dengan filter periode memanggil kontroler `getMonthlyAttendanceRecap` yang membaca entitas `AttendanceRecord`, `Employee`, dan `Department`. Untuk peran *Manager*, kontroler membatasi data ke `departmentId` *manager* tersebut. Gambar 4.46 menunjukkan *robustness diagram* Melihat Rekap Absensi.

```plantuml
@startuml robustness_uc23_recap
title Robustness Diagram — UC-HRMS-23 Melihat Rekap Absensi

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin /\nManager" as A
boundary "Halaman Admin\nAbsensi" as B1
control "Memproses\nFilter Periode" as C1
control "Mengagregasi\nRekap Bulanan" as C2
entity "AttendanceRecord" as E1
entity "Employee" as E2
entity "Department" as E3
boundary "Tabel Ringkasan\nAbsensi" as B2
control "Membuka Detail\nKaryawan" as CDet
boundary "Halaman Detail\nKaryawan" as B3

A --> B1
B1 --> C1
C1 --> C2
C2 --> E1
C2 --> E2
C2 --> E3
C2 --> B2
B2 --> CDet
CDet --> E1
CDet --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.46 *Robustness Diagram* Melihat Rekap Absensi (RD-HRMS-23)**

**24. *Robustness Diagram* Koreksi Manual Absensi (RD-HRMS-24)**

*Robustness diagram* Koreksi Manual Absensi memberikan gambaran ketika HR Admin melakukan *manual override* terhadap catatan absensi. *Boundary* `ManualRecordDialog` mengirim data (karyawan, tanggal, jam, alasan) ke `manualOverrideAction` yang memvalidasi `manualAttendanceSchema`, lalu menyimpan/memutakhirkan entitas `AttendanceRecord` dengan *flag* `isManualOverride=true`, `overrideById`, dan `overrideReason`. Gambar 4.47 menunjukkan *robustness diagram* Koreksi Manual Absensi.

```plantuml
@startuml robustness_uc24_override
title Robustness Diagram — UC-HRMS-24 Koreksi Manual Absensi

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman Admin\nAbsensi" as B1
control "Menampilkan\nDialog Koreksi" as C1
boundary "Dialog Koreksi\nManual" as B2
control "Validasi\nInput" as C2
control "Menghitung\nFlags Absensi" as C3
control "Menyimpan\nKoreksi Manual" as C4
entity "AttendanceRecord" as E1
entity "User" as E2
control "Mencatat\nAudit Log" as C5
entity "AuditLog" as E3
boundary "Notifikasi\nBerhasil" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> C4
C4 --> E1
C4 --> E2
C4 --> C5
C5 --> E3
C4 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.47 *Robustness Diagram* Koreksi Manual Absensi (RD-HRMS-24)**

**25. *Robustness Diagram* Mengekspor Rekap Absensi (RD-HRMS-25)**

*Robustness diagram* Mengekspor Rekap Absensi memberikan gambaran ketika HR Admin atau *Manager* mengunduh rekap absensi. *Boundary* `ExportButtons` memanggil API *route* `GET /api/attendance/export` (CSV/Excel) atau merender PDF melalui `attendance-pdf.tsx`. Gambar 4.48 menunjukkan *robustness diagram* Mengekspor Rekap Absensi.

```plantuml
@startuml robustness_uc25_export
title Robustness Diagram — UC-HRMS-25 Mengekspor Rekap Absensi

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin /\nManager" as A
boundary "Halaman Admin\nAbsensi" as B1
control "Memilih\nFormat Ekspor" as C1
control "Membuat\nBerkas Excel" as C2
control "Membuat\nBerkas PDF" as C3
entity "AttendanceRecord" as E1
entity "Employee" as E2
boundary "Berkas\nEkspor" as B2

A --> B1
B1 --> C1
C1 --> C2
C1 --> C3
C2 --> E1
C2 --> E2
C3 --> E1
C3 --> E2
C2 --> B2
C3 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.48 *Robustness Diagram* Mengekspor Rekap Absensi (RD-HRMS-25)**

**26. *Robustness Diagram* Mengajukan Cuti (RD-HRMS-26)**

*Robustness diagram* Mengajukan Cuti memberikan gambaran ketika *Employee* mengisi *form* di `/leave`. *Boundary* `LeaveRequestForm` mengirim data ke `submitLeaveAction`. Kontroler memvalidasi `submitLeaveSchema`, menghitung `workingDays` melalui `countWorkingDays`, memastikan saldo cuti memadai pada entitas `LeaveBalance`, lalu menyimpan entitas `LeaveRequest` dengan status `PENDING_MANAGER`. Saldo dan riwayat cuti ditampilkan oleh komponen `LeaveBalanceCard` dan `LeaveHistoryTable`. Gambar 4.49 menunjukkan *robustness diagram* Mengajukan Cuti.

```plantuml
@startuml robustness_uc26_submitleave
title Robustness Diagram — UC-HRMS-26 Mengajukan Cuti

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Employee" as A
boundary "Halaman\nCuti" as B1
control "Menampilkan\nSaldo & Form" as C1
boundary "Form Pengajuan\nCuti" as B2
control "Validasi\nInput" as C2
control "Hitung Hari\nKerja" as C3
control "Cek Saldo\nCuti" as C4
control "Menyimpan\nPengajuan" as C5
entity "LeaveType" as E1
entity "LeaveBalance" as E2
entity "LeaveRequest" as E3
control "Mencatat\nAudit Log" as C6
entity "AuditLog" as E4
boundary "Notifikasi\nBerhasil" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> E1
C1 --> E2
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> C4
C4 --> E2
C4 --> BErr : Tidak
C4 --> C5 : Ya
C5 --> E3
C5 --> C6
C6 --> E4
C5 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.49 *Robustness Diagram* Mengajukan Cuti (RD-HRMS-26)**

**27. *Robustness Diagram* Menyetujui / Menolak Cuti (RD-HRMS-27)**

*Robustness diagram* Menyetujui/Menolak Cuti memberikan gambaran ketika *Manager* (tahap pertama) atau HR Admin (tahap kedua) memberikan keputusan pada `/leave/manage`. *Boundary* `LeaveApprovalTable` dan `ApproveRejectDialog` memanggil `approveLeaveAction` atau `rejectLeaveAction`. Bila HR Admin menyetujui, kontroler memperbarui `LeaveBalance.usedDays`. Aktivitas dicatat pada `AuditLog`. Gambar 4.50 menunjukkan *robustness diagram* Menyetujui/Menolak Cuti.

```plantuml
@startuml robustness_uc27_approve
title Robustness Diagram — UC-HRMS-27 Menyetujui / Menolak Cuti

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Manager /\nHR Admin" as A
boundary "Halaman Kelola\nCuti" as B1
control "Menampilkan\nDialog Keputusan" as C1
boundary "Dialog Setujui/\nTolak Cuti" as B2
control "Validasi\nInput" as C2
control "Memperbarui\nStatus Cuti" as C3
control "Memperbarui\nSaldo Cuti" as C4
entity "LeaveRequest" as E1
entity "LeaveBalance" as E2
entity "User" as E3
control "Mencatat\nAudit Log" as C5
entity "AuditLog" as E4
boundary "Notifikasi\nBerhasil" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E1
C3 --> E3
C3 --> C4
C4 --> E2
C3 --> C5
C5 --> E4
C3 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.50 *Robustness Diagram* Menyetujui / Menolak Cuti (RD-HRMS-27)**

**28. *Robustness Diagram* Membatalkan Cuti (RD-HRMS-28)**

*Robustness diagram* Membatalkan Cuti memberikan gambaran ketika *Employee* membatalkan pengajuan cuti yang masih *pending*. *Boundary* `LeaveHistoryTable` memanggil `cancelLeaveAction` yang mengubah `status` menjadi `CANCELLED`. Gambar 4.51 menunjukkan *robustness diagram* Membatalkan Cuti.

```plantuml
@startuml robustness_uc28_cancel
title Robustness Diagram — UC-HRMS-28 Membatalkan Cuti

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Employee" as A
boundary "Tabel Riwayat\nCuti" as B1
control "Cek Status\nPengajuan" as C1
control "Membatalkan\nPengajuan Cuti" as C2
entity "LeaveRequest" as E1
control "Mencatat\nAudit Log" as C3
entity "AuditLog" as E2
boundary "Notifikasi\nBerhasil" as B2
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> BErr : Tidak
C1 --> C2 : Ya
C2 --> E1
C2 --> C3
C3 --> E2
C2 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.51 *Robustness Diagram* Membatalkan Cuti (RD-HRMS-28)**

**29. *Robustness Diagram* Melihat Laporan Cuti (RD-HRMS-29)**

*Robustness diagram* Melihat Laporan Cuti memberikan gambaran ketika HR Admin mengakses `/leave/report`. *Boundary* `LeaveReportKpiCards`, `LeaveReportTrendChart`, dan `LeaveReportFilters` memanggil kontroler agregasi data berbasis `LeaveRequest` dan `LeaveType`. Gambar 4.52 menunjukkan *robustness diagram* Melihat Laporan Cuti.

```plantuml
@startuml robustness_uc29_leavereport
title Robustness Diagram — UC-HRMS-29 Melihat Laporan Cuti

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman\nLaporan Cuti" as B1
control "Memproses\nFilter Periode" as C1
control "Mengagregasi\nData Cuti" as C2
entity "LeaveRequest" as E1
entity "LeaveType" as E2
boundary "KPI &\nTrend Chart" as B2

A --> B1
B1 --> C1
C1 --> C2
C2 --> E1
C2 --> E2
C2 --> B2
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.52 *Robustness Diagram* Melihat Laporan Cuti (RD-HRMS-29)**

**30. *Robustness Diagram* Mengimpor Data Payroll (RD-HRMS-30)**

*Robustness diagram* Mengimpor Data *Payroll* memberikan gambaran ketika HR Admin mengunggah berkas Excel/CSV pada `/payroll`. *Boundary* `ImportPayrollForm` mengirim *file* ke `importPayrollAction`. Kontroler memvalidasi `importPayrollSchema`, kemudian memanggil `parsePayrollWorkbook` untuk parsing struktural, `matchRowsToEmployees` untuk pencocokan NIK, dan `persistImportedPayroll` untuk menyimpan entitas `PayrollRun` dan `PayrollEntry` dengan status DRAFT. *Template* diunduh melalui API *route* `GET /api/payroll/template` yang menjalankan `buildPayrollTemplate`. Gambar 4.53 menunjukkan *robustness diagram* Mengimpor Data *Payroll*.

```plantuml
@startuml robustness_uc30_importpayroll
title Robustness Diagram — UC-HRMS-30 Mengimpor Data Payroll

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman\nPayroll" as B1
control "Validasi\nPeriode & File" as C1
control "Parsing\nWorkbook" as C2
control "Mencocokkan\nNIK" as C3
entity "Employee" as E1
control "Menyimpan\nPayroll DRAFT" as C4
entity "PayrollRun" as E2
entity "PayrollEntry" as E3
control "Mencatat\nAudit Log" as C5
entity "AuditLog" as E4
boundary "Halaman Detail\nPayroll" as B2
control "Mengunduh\nTemplate Excel" as CTpl
boundary "Berkas Template\nExcel" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> BErr : Tidak
C1 --> C2 : Ya
C2 --> BErr : error struktur
C2 --> C3 : Ya
C3 --> E1
C3 --> BErr : NIK tidak cocok
C3 --> C4 : Ya
C4 --> E2
C4 --> E3
C4 --> C5
C5 --> E4
C4 --> B2
B1 --> CTpl
CTpl --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.53 *Robustness Diagram* Mengimpor Data *Payroll* (RD-HRMS-30)**

**31. *Robustness Diagram* Memfinalisasi Payroll (RD-HRMS-31)**

*Robustness diagram* Memfinalisasi *Payroll* memberikan gambaran ketika HR Admin meninjau dan memfinalisasi periode *payroll* pada `/payroll/[periodId]`. *Boundary* `PayrollEntryTable` dan `FinalizeButton` memanggil `finalizePayrollAction` yang memvalidasi `finalizePayrollSchema` dan mengubah status `PayrollRun` menjadi `FINALIZED`. Gambar 4.54 menunjukkan *robustness diagram* Memfinalisasi *Payroll*.

```plantuml
@startuml robustness_uc31_finalize
title Robustness Diagram — UC-HRMS-31 Memfinalisasi Payroll

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "HR Admin" as A
boundary "Halaman Detail\nPayroll" as B1
control "Menampilkan\nEntries" as C1
entity "PayrollEntry" as E1
boundary "Tabel\nPayroll Entry" as B2
control "Validasi\nFinalisasi" as C2
control "Memfinalisasi\nPayroll" as C3
entity "PayrollRun" as E2
control "Mencatat\nAudit Log" as C4
entity "AuditLog" as E3
boundary "Notifikasi\nBerhasil" as B3
boundary "Menampilkan\nNotifikasi Gagal" as BErr

A --> B1
B1 --> C1
C1 --> E1
C1 --> B2
B2 --> C2
C2 --> BErr : Tidak
C2 --> C3 : Ya
C3 --> E2
C3 --> C4
C4 --> E3
C3 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.54 *Robustness Diagram* Memfinalisasi *Payroll* (RD-HRMS-31)**

**32. *Robustness Diagram* Melihat dan Mengunduh Slip Gaji (RD-HRMS-32)**

*Robustness diagram* Melihat dan Mengunduh Slip Gaji memberikan gambaran ketika *Employee* (atau HR Admin/Manager) membuka `/payslip`. *Boundary* halaman *payslip* menampilkan daftar `PayrollEntry` milik karyawan, dan tombol unduh memanggil API *route* `GET /api/payroll/payslip/[entryId]` yang merender PDF melalui `payslip-pdf.tsx`. Gambar 4.55 menunjukkan *robustness diagram* Melihat dan Mengunduh Slip Gaji.

```plantuml
@startuml robustness_uc32_payslip
title Robustness Diagram — UC-HRMS-32 Melihat dan Mengunduh Slip Gaji

skinparam backgroundColor white
skinparam shadowing false
skinparam defaultFontSize 12
skinparam boundary { BackgroundColor #FFFFFF BorderColor #333333 }
skinparam control { BackgroundColor #FFE0E0 BorderColor #CC0000 }
skinparam entity { BackgroundColor #FFFFFF BorderColor #333333 }
left to right direction

actor "Employee /\nHR Admin /\nManager" as A
boundary "Halaman\nSlip Gaji" as B1
control "Mengambil\nDaftar Slip" as C1
entity "PayrollEntry" as E1
entity "PayrollRun" as E2
entity "Employee" as E3
boundary "Tabel\nSlip Gaji" as B2
control "Membuat\nPDF Slip Gaji" as C2
boundary "Berkas PDF\nSlip Gaji" as B3

A --> B1
B1 --> C1
C1 --> E1
C1 --> E2
C1 --> E3
C1 --> B2
B2 --> C2
C2 --> E1
C2 --> B3
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.55 *Robustness Diagram* Melihat dan Mengunduh Slip Gaji (RD-HRMS-32)**

### 4.3.2 Updated Domain Model

Berdasarkan hasil *robustness analysis* pada sub-bab 4.3.1, *domain model* awal pada Gambar 4.9 diperbarui dengan menambahkan atribut-atribut yang sebelumnya implisit. Atribut tersebut diperoleh dari telaah skema basis data aktual (`prisma/schema.prisma`) yang mencerminkan kebutuhan data dari kontroler dan *boundary* pada setiap *robustness diagram*. Sebagai contoh, kontroler `verifyLocation` pada RD-HRMS-22 membutuhkan atribut `allowedIPs`, `latitude`, `longitude`, `radiusMeters` pada `OfficeLocation`; kontroler `calculateAttendanceFlags` pada RD-HRMS-22 dan RD-HRMS-24 memunculkan atribut `isLate`, `lateMinutes`, `isEarlyOut`, `earlyOutMinutes`, `overtimeMinutes` pada `AttendanceRecord`; serta kontroler `persistImportedPayroll` pada RD-HRMS-30 memunculkan seluruh komponen *snapshot* gaji pada `PayrollEntry`.

Berikut adalah daftar entitas yang mengalami pengayaan atribut. Setiap atribut ditampilkan beserta tipe datanya seperti yang didefinisikan pada `prisma/schema.prisma`.

1. **User** — `id`, `name`, `email`, `hashedPassword`, `role`, `isActive`, `createdAt`, `updatedAt`.
2. **Employee** — `id`, `nik`, `userId`, `namaLengkap`, `nikKtp`, `tempatLahir`, `tanggalLahir`, `jenisKelamin`, `statusPernikahan`, `agama`, `alamat`, `nomorHp`, `email`, `departmentId`, `positionId`, `officeLocationId`, `contractType`, `joinDate`, `isActive`, `terminationDate`, `terminationReason`, `npwp`, `ptkpStatus`, `bpjsKesehatanNo`, `bpjsKetenagakerjaanNo`, `isTaxBorneByCompany`.
3. **Department** — `id`, `name`, `description`, `deletedAt`.
4. **Position** — `id`, `name`, `departmentId`, `deletedAt`.
5. **OfficeLocation** — `id`, `name`, `address`, `allowedIPs`, `latitude`, `longitude`, `radiusMeters`, `workStartTime`, `workEndTime`, `deletedAt`.
6. **LeaveType** — `id`, `name`, `annualQuota`, `isPaid`, `genderRestriction`, `deletedAt`.
7. **EmployeeDocument** — `id`, `employeeId`, `documentType`, `fileName`, `filePath`, `fileSize`, `mimeType`.
8. **EmergencyContact** — `id`, `employeeId`, `name`, `relationship`, `phone`, `address`.
9. **AttendanceRecord** — `id`, `employeeId`, `officeLocationId`, `date`, `clockIn`, `clockOut`, `clockInIp`, `clockOutIp`, `clockInLat`, `clockInLon`, `isLate`, `lateMinutes`, `isEarlyOut`, `earlyOutMinutes`, `overtimeMinutes`, `totalMinutes`, `isManualOverride`, `overrideById`, `overrideReason`.
10. **LeaveRequest** — `id`, `employeeId`, `leaveTypeId`, `startDate`, `endDate`, `workingDays`, `reason`, `status`, `managerApprovedById`, `managerNotes`, `managerApprovedAt`, `hrApprovedById`, `hrNotes`, `hrApprovedAt`.
11. **LeaveBalance** — `id`, `employeeId`, `leaveTypeId`, `year`, `allocatedDays`, `usedDays`.
12. **PayrollRun** — `id`, `month`, `year`, `status`, `createdBy`.
13. **PayrollEntry** — `id`, `payrollRunId`, `employeeId`, atribut *snapshot* (`employeeNik`, `employeeName`, `jobPosition`, `organization`, `gradeLevel`, `ptkpStatus`, `npwp`), atribut *earnings* (`basicSalary`, `tunjanganKomunikasi`, `tunjanganKehadiran`, `tunjanganJabatan`, `tunjanganLainnya`, `taxAllowance`, `thr`, `totalEarnings`), atribut *deductions* (`bpjsKesehatanEmployee`, `jhtEmployee`, `jaminanPensiunEmployee`, `pph21`, `potonganKeterlambatan`, `potonganKoperasi`, `potonganLainnya`, `totalDeductions`), `takeHomePay`, atribut *benefits* (`jkk`, `jkm`, `jhtCompany`, `jaminanPensiunCompany`, `bpjsKesehatanCompany`, `totalBenefits`), dan ringkasan absensi (`actualWorkingDay`, `scheduleWorkingDay`, `dayoff`, `nationalHoliday`, `companyHoliday`, `specialHoliday`, `attendanceCodes`).
14. **Vacancy** — `id`, `title`, `departmentId`, `description`, `requirements`, `status`, `openDate`, `closeDate`.
15. **Candidate** — `id`, `vacancyId`, `name`, `email`, `phone`, `stage`, `cvPath`, `notes`, `offerSalary`, `offerNotes`, `hiredAt`.
16. **Interview** — `id`, `candidateId`, `scheduledAt`, `interviewerName`, `notes`.
17. **AuditLog** — `id`, `userId`, `action`, `module`, `targetId`, `oldValue`, `newValue`, `createdAt`.

Perubahan utama dari *domain model* awal pada Gambar 4.9 ke *updated domain model* adalah sebagai berikut.

1. **Penambahan atribut deskriptif pada setiap entitas**, yang sebelumnya hanya digambarkan sebagai nama kelas. Atribut diperoleh langsung dari skema Prisma.
2. **Penambahan atribut audit waktu** (`createdAt`, `updatedAt`) yang tidak ditampilkan di sini agar diagram tetap ringkas, namun ada pada seluruh entitas berbasis Prisma.
3. **Penegasan atribut yang dibutuhkan oleh kontroler**, misalnya atribut `allowedIPs`, `latitude`, `longitude`, `radiusMeters` pada `OfficeLocation` yang diperlukan oleh `verifyLocation`, serta atribut `isLate`, `lateMinutes`, `overtimeMinutes`, `isManualOverride`, `overrideById`, `overrideReason` pada `AttendanceRecord` yang merupakan keluaran `calculateAttendanceFlags` dan `manualOverrideAction`.
4. **Pemodelan eksplisit *snapshot* gaji** pada `PayrollEntry` yang mencerminkan keputusan desain *import-based* dengan menyimpan seluruh komponen `earnings`, `deductions`, `benefits`, dan ringkasan absensi sebagai bagian dari satu *entry*.
5. **Penegasan alur dua tahap persetujuan cuti** melalui pemisahan atribut `managerApprovedById`/`managerApprovedAt`/`managerNotes` dan `hrApprovedById`/`hrApprovedAt`/`hrNotes` pada `LeaveRequest`.

*Updated domain model* yang dihasilkan ditunjukkan pada Gambar 4.56.

```plantuml
@startuml updated_domain_model
title Updated Domain Model — HRMS PT Sinergi Asta Nusantara

skinparam classFontStyle bold

class User {
  + id: String
  + name: String
  + email: String
  - hashedPassword: String
  + role: Role
  + isActive: Boolean
}

class Employee {
  + id: String
  + nik: String
  + userId: String
  + namaLengkap: String
  + nikKtp: String?
  + tempatLahir: String?
  + tanggalLahir: DateTime?
  + jenisKelamin: Gender?
  + statusPernikahan: MaritalStatus?
  + agama: Religion?
  + alamat: String?
  + nomorHp: String?
  + email: String
  + departmentId: String
  + positionId: String
  + officeLocationId: String?
  + contractType: ContractType
  + joinDate: DateTime
  + isActive: Boolean
  + terminationDate: DateTime?
  + terminationReason: String?
  + npwp: String?
  + ptkpStatus: PTKPStatus?
  + bpjsKesehatanNo: String?
  + bpjsKetenagakerjaanNo: String?
  + isTaxBorneByCompany: Boolean
}

class Department {
  + id: String
  + name: String
  + description: String?
  + deletedAt: DateTime?
}

class Position {
  + id: String
  + name: String
  + departmentId: String
  + deletedAt: DateTime?
}

class OfficeLocation {
  + id: String
  + name: String
  + address: String?
  + allowedIPs: String[]
  + latitude: Float?
  + longitude: Float?
  + radiusMeters: Int?
  + workStartTime: String?
  + workEndTime: String?
  + deletedAt: DateTime?
}

class LeaveType {
  + id: String
  + name: String
  + annualQuota: Int
  + isPaid: Boolean
  + genderRestriction: String?
  + deletedAt: DateTime?
}

class EmployeeDocument {
  + id: String
  + employeeId: String
  + documentType: DocumentType
  + fileName: String
  + filePath: String
  + fileSize: Int
  + mimeType: String
}

class EmergencyContact {
  + id: String
  + employeeId: String
  + name: String
  + relationship: String
  + phone: String
  + address: String?
}

class AttendanceRecord {
  + id: String
  + employeeId: String
  + officeLocationId: String
  + date: Date
  + clockIn: DateTime?
  + clockOut: DateTime?
  + clockInIp: String?
  + clockOutIp: String?
  + clockInLat: Float?
  + clockInLon: Float?
  + isLate: Boolean
  + lateMinutes: Int
  + isEarlyOut: Boolean
  + earlyOutMinutes: Int
  + overtimeMinutes: Int
  + totalMinutes: Int
  + isManualOverride: Boolean
  + overrideById: String?
  + overrideReason: String?
}

class LeaveRequest {
  + id: String
  + employeeId: String
  + leaveTypeId: String
  + startDate: Date
  + endDate: Date
  + workingDays: Int
  + reason: String
  + status: LeaveStatus
  + managerApprovedById: String?
  + managerNotes: String?
  + managerApprovedAt: DateTime?
  + hrApprovedById: String?
  + hrNotes: String?
  + hrApprovedAt: DateTime?
}

class LeaveBalance {
  + id: String
  + employeeId: String
  + leaveTypeId: String
  + year: Int
  + allocatedDays: Int
  + usedDays: Int
}

class PayrollRun {
  + id: String
  + month: Int
  + year: Int
  + status: PayrollStatus
  + createdBy: String
}

class PayrollEntry {
  + id: String
  + payrollRunId: String
  + employeeId: String
  + employeeNik: String
  + employeeName: String
  + jobPosition: String
  + organization: String
  + gradeLevel: String
  + ptkpStatus: String
  + npwp: String?
  + basicSalary: Decimal
  + tunjanganKomunikasi: Decimal
  + tunjanganKehadiran: Decimal
  + tunjanganJabatan: Decimal
  + tunjanganLainnya: Decimal
  + taxAllowance: Decimal
  + thr: Decimal
  + totalEarnings: Decimal
  + bpjsKesehatanEmployee: Decimal
  + jhtEmployee: Decimal
  + jaminanPensiunEmployee: Decimal
  + pph21: Decimal
  + potonganKeterlambatan: Decimal
  + potonganKoperasi: Decimal
  + potonganLainnya: Decimal
  + totalDeductions: Decimal
  + takeHomePay: Decimal
  + jkk: Decimal
  + jkm: Decimal
  + jhtCompany: Decimal
  + jaminanPensiunCompany: Decimal
  + bpjsKesehatanCompany: Decimal
  + totalBenefits: Decimal
  + actualWorkingDay: Int
  + scheduleWorkingDay: Int
  + dayoff: Int
  + nationalHoliday: Int
  + companyHoliday: Int
  + specialHoliday: Int
  + attendanceCodes: String
}

class Vacancy {
  + id: String
  + title: String
  + departmentId: String
  + description: String
  + requirements: String
  + status: VacancyStatus
  + openDate: DateTime
  + closeDate: DateTime?
}

class Candidate {
  + id: String
  + vacancyId: String
  + name: String
  + email: String
  + phone: String?
  + stage: CandidateStage
  + cvPath: String?
  + notes: String?
  + offerSalary: Decimal?
  + offerNotes: String?
  + hiredAt: DateTime?
}

class Interview {
  + id: String
  + candidateId: String
  + scheduledAt: DateTime
  + interviewerName: String?
  + notes: String?
}

class AuditLog {
  + id: String
  + userId: String
  + action: AuditAction
  + module: String
  + targetId: String
  + oldValue: Json?
  + newValue: Json?
  + createdAt: DateTime
}

User "1" -- "0..1" Employee
User "1" -- "*" AuditLog
Department "1" -- "*" Position
Department "1" -- "*" Employee
Department "1" -- "*" Vacancy
Position "1" -- "*" Employee
OfficeLocation "1" -- "*" Employee
OfficeLocation "1" -- "*" AttendanceRecord
Employee "1" o-- "*" EmployeeDocument
Employee "1" o-- "*" EmergencyContact
Employee "1" -- "*" AttendanceRecord
Employee "1" -- "*" LeaveRequest
Employee "1" -- "*" LeaveBalance
Employee "1" -- "*" PayrollEntry
LeaveType "1" -- "*" LeaveRequest
LeaveType "1" -- "*" LeaveBalance
PayrollRun "1" o-- "*" PayrollEntry
Vacancy "1" o-- "*" Candidate
Candidate "1" o-- "*" Interview
@enduml
```

[Sisipkan gambar di sini]

**Gambar 4.56 *Updated Domain Model* Aplikasi HRMS PT SAN**
