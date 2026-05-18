# BAB IV ANALISIS DAN PERANCANGAN SISTEM (lanjutan)

### 4.7.3 Implementasi *Source Code*

Implementasi *source code* pada sistem HRMS PT Sinergi Asta Nusantara menggunakan *framework* Next.js 14 dengan bahasa pemrograman TypeScript. Arsitektur aplikasi mengikuti pola yang disediakan oleh Next.js App Router, di mana berkas-berkas dipecah berdasarkan tanggung jawabnya, antara lain berkas halaman (*page*), berkas *server action* untuk logika bisnis, berkas *service* untuk operasi basis data, berkas validasi skema (*Zod schema*), dan berkas komponen antarmuka (*React component*). Selain ketiga lapisan utama tersebut, sistem ini juga memuat *API route* untuk operasi yang menuntut respons HTTP biner (unduh PDF dan ekspor Excel), generator PDF berbasis `@react-pdf/renderer`, *middleware* otorisasi, dan konfigurasi NextAuth. Hasil implementasi kelas pada sistem HRMS ini dapat dilihat pada Tabel 4.40.

**Tabel 4.40 Implementasi *Source Code***

| No | Nama Desain Kelas | Tipe Kelas | Nama File |
|----|-------------------|------------|-----------|
| **Autentikasi & Sistem** | | | |
| 1 | LoginPage | Page | src/app/(auth)/login/page.tsx |
| 2 | AuthLayout | Page | src/app/(auth)/layout.tsx |
| 3 | DashboardLayout | Page | src/app/(dashboard)/layout.tsx |
| 4 | RootPage | Page | src/app/page.tsx |
| 5 | RootLayout | Page | src/app/layout.tsx |
| 6 | NextAuthRouteHandler | API Route | src/app/api/auth/[...nextauth]/route.ts |
| 7 | auth (NextAuth instance) | Auth Config | src/lib/auth.ts |
| 8 | authConfig | Auth Config | src/lib/auth.config.ts |
| 9 | middleware | Middleware | src/middleware.ts |
| 10 | loginSchema | Validation Schema | src/lib/validations/auth.ts |
| 11 | prisma (client + createAuditLog) | Service | src/lib/prisma.ts |
| 12 | Sidebar / MobileSidebar | Component | src/components/layout/sidebar.tsx |
| 13 | Header | Component | src/components/layout/header.tsx |
| 14 | Breadcrumbs | Component | src/components/layout/breadcrumbs.tsx |
| 15 | SessionProvider | Component | src/components/providers/session-provider.tsx |
| **Dashboard** | | | |
| 16 | DashboardPage | Page | src/app/(dashboard)/dashboard/page.tsx |
| 17 | SuperAdminDashboard | Component | src/app/(dashboard)/dashboard/_components/super-admin-dashboard.tsx |
| 18 | HrAdminDashboard | Component | src/app/(dashboard)/dashboard/_components/hr-admin-dashboard.tsx |
| 19 | ManagerDashboard | Component | src/app/(dashboard)/dashboard/_components/manager-dashboard.tsx |
| 20 | EmployeeDashboard | Component | src/app/(dashboard)/dashboard/_components/employee-dashboard.tsx |
| 21 | getDashboardData | Service | src/lib/services/dashboard.service.ts |
| 22 | getSuperAdminDashboardData | Service | src/lib/services/dashboard.service.ts |
| 23 | getHrAdminDashboardData | Service | src/lib/services/dashboard.service.ts |
| 24 | getManagerDashboardData | Service | src/lib/services/dashboard.service.ts |
| 25 | getEmployeeDashboardData | Service | src/lib/services/dashboard.service.ts |
| **User Management** | | | |
| 26 | UserListPage | Page | src/app/(dashboard)/users/page.tsx |
| 27 | UserTable | Component | src/app/(dashboard)/users/_components/user-table.tsx |
| 28 | UserColumns | Component | src/app/(dashboard)/users/_components/user-columns.tsx |
| 29 | UserFormDialog | Component | src/app/(dashboard)/users/_components/user-form-dialog.tsx |
| 30 | UserPageHeader | Component | src/app/(dashboard)/users/_components/user-page-header.tsx |
| 31 | createUserAction | Server Action | src/lib/actions/user.actions.ts |
| 32 | updateUserAction | Server Action | src/lib/actions/user.actions.ts |
| 33 | toggleUserActiveAction | Server Action | src/lib/actions/user.actions.ts |
| 34 | getUsers | Service | src/lib/services/user.service.ts |
| 35 | getUserById | Service | src/lib/services/user.service.ts |
| 36 | createUser | Service | src/lib/services/user.service.ts |
| 37 | updateUser | Service | src/lib/services/user.service.ts |
| 38 | toggleUserActive | Service | src/lib/services/user.service.ts |
| 39 | createUserSchema | Validation Schema | src/lib/validations/user.ts |
| 40 | updateUserSchema | Validation Schema | src/lib/validations/user.ts |
| **Employee Data Management** | | | |
| 41 | EmployeeListPage | Page | src/app/(dashboard)/employees/page.tsx |
| 42 | NewEmployeePage | Page | src/app/(dashboard)/employees/new/page.tsx |
| 43 | EmployeeProfilePage | Page | src/app/(dashboard)/employees/[id]/page.tsx |
| 44 | EmployeeTable | Component | src/app/(dashboard)/employees/_components/employee-table.tsx |
| 45 | EmployeeColumns | Component | src/app/(dashboard)/employees/_components/employee-columns.tsx |
| 46 | EmployeeFilters | Component | src/app/(dashboard)/employees/_components/employee-filters.tsx |
| 47 | CreateEmployeeForm | Component | src/app/(dashboard)/employees/new/_components/create-employee-form.tsx |
| 48 | EmployeeProfileTabs | Component | src/app/(dashboard)/employees/[id]/_components/employee-profile-tabs.tsx |
| 49 | PersonalInfoTab | Component | src/app/(dashboard)/employees/[id]/_components/personal-info-tab.tsx |
| 50 | EmploymentDetailsTab | Component | src/app/(dashboard)/employees/[id]/_components/employment-details-tab.tsx |
| 51 | TaxBpjsTab | Component | src/app/(dashboard)/employees/[id]/_components/tax-bpjs-tab.tsx |
| 52 | DocumentsTab | Component | src/app/(dashboard)/employees/[id]/_components/documents-tab.tsx |
| 53 | EmergencyContactsTab | Component | src/app/(dashboard)/employees/[id]/_components/emergency-contacts-tab.tsx |
| 54 | DeactivateEmployeeDialog | Component | src/app/(dashboard)/employees/[id]/_components/deactivate-employee-dialog.tsx |
| 55 | createEmployeeAction | Server Action | src/lib/actions/employee.actions.ts |
| 56 | updatePersonalInfoAction | Server Action | src/lib/actions/employee.actions.ts |
| 57 | updateEmploymentAction | Server Action | src/lib/actions/employee.actions.ts |
| 58 | updateTaxBpjsAction | Server Action | src/lib/actions/employee.actions.ts |
| 59 | deactivateEmployeeAction | Server Action | src/lib/actions/employee.actions.ts |
| 60 | createEmergencyContactAction | Server Action | src/lib/actions/employee-document.actions.ts |
| 61 | updateEmergencyContactAction | Server Action | src/lib/actions/employee-document.actions.ts |
| 62 | deleteEmergencyContactAction | Server Action | src/lib/actions/employee-document.actions.ts |
| 63 | getEmployees | Service | src/lib/services/employee.service.ts |
| 64 | getEmployeesForManager | Service | src/lib/services/employee.service.ts |
| 65 | getEmployeeById | Service | src/lib/services/employee.service.ts |
| 66 | getEmployeeByUserId | Service | src/lib/services/employee.service.ts |
| 67 | createEmployee | Service | src/lib/services/employee.service.ts |
| 68 | updatePersonalInfo | Service | src/lib/services/employee.service.ts |
| 69 | updateEmploymentDetails | Service | src/lib/services/employee.service.ts |
| 70 | updateTaxBpjs | Service | src/lib/services/employee.service.ts |
| 71 | deactivateEmployee | Service | src/lib/services/employee.service.ts |
| 72 | canManagerAccessEmployee | Service | src/lib/services/employee.service.ts |
| 73 | getEmployeeStatsSummary | Service | src/lib/services/employee.service.ts |
| 74 | getDocumentsByEmployeeId | Service | src/lib/services/employee-document.service.ts |
| 75 | getDocumentById | Service | src/lib/services/employee-document.service.ts |
| 76 | createDocumentRecord | Service | src/lib/services/employee-document.service.ts |
| 77 | deleteDocument | Service | src/lib/services/employee-document.service.ts |
| 78 | createEmployeeSchema | Validation Schema | src/lib/validations/employee.ts |
| 79 | updatePersonalInfoSchema | Validation Schema | src/lib/validations/employee.ts |
| 80 | updateEmploymentSchema | Validation Schema | src/lib/validations/employee.ts |
| 81 | updateTaxBpjsSchema | Validation Schema | src/lib/validations/employee.ts |
| 82 | emergencyContactSchema | Validation Schema | src/lib/validations/employee.ts |
| 83 | deactivateEmployeeSchema | Validation Schema | src/lib/validations/employee.ts |
| 84 | EmployeeDocumentsApi (POST/GET) | API Route | src/app/api/employees/[id]/documents/route.ts |
| 85 | EmployeeDocumentApi (GET/DELETE) | API Route | src/app/api/employees/[id]/documents/[docId]/route.ts |
| **Recruitment Management** | | | |
| 86 | RecruitmentListPage | Page | src/app/(dashboard)/recruitment/page.tsx |
| 87 | NewVacancyPage | Page | src/app/(dashboard)/recruitment/new/page.tsx |
| 88 | VacancyKanbanPage | Page | src/app/(dashboard)/recruitment/[vacancyId]/page.tsx |
| 89 | CandidateDetailPage | Page | src/app/(dashboard)/recruitment/candidates/[candidateId]/page.tsx |
| 90 | VacancyTable | Component | src/app/(dashboard)/recruitment/_components/vacancy-table.tsx |
| 91 | CreateVacancyForm | Component | src/app/(dashboard)/recruitment/new/_components/create-vacancy-form.tsx |
| 92 | KanbanBoard | Component | src/app/(dashboard)/recruitment/[vacancyId]/_components/kanban-board.tsx |
| 93 | AddCandidateDialog | Component | src/app/(dashboard)/recruitment/[vacancyId]/_components/add-candidate-dialog.tsx |
| 94 | CandidateDetailClient | Component | src/app/(dashboard)/recruitment/candidates/[candidateId]/_components/candidate-detail-client.tsx |
| 95 | createVacancyAction | Server Action | src/lib/actions/recruitment.actions.ts |
| 96 | updateVacancyAction | Server Action | src/lib/actions/recruitment.actions.ts |
| 97 | toggleVacancyStatusAction | Server Action | src/lib/actions/recruitment.actions.ts |
| 98 | createCandidateAction | Server Action | src/lib/actions/recruitment.actions.ts |
| 99 | updateCandidateStageAction | Server Action | src/lib/actions/recruitment.actions.ts |
| 100 | updateOfferAction | Server Action | src/lib/actions/recruitment.actions.ts |
| 101 | createInterviewAction | Server Action | src/lib/actions/recruitment.actions.ts |
| 102 | convertCandidateToEmployeeAction | Server Action | src/lib/actions/recruitment.actions.ts |
| 103 | getVacancies | Service | src/lib/services/recruitment.service.ts |
| 104 | getVacanciesWithPipeline | Service | src/lib/services/recruitment.service.ts |
| 105 | getVacancyById | Service | src/lib/services/recruitment.service.ts |
| 106 | getOpenVacancyCount | Service | src/lib/services/recruitment.service.ts |
| 107 | getCandidateById | Service | src/lib/services/recruitment.service.ts |
| 108 | getRecruitmentStatsSummary | Service | src/lib/services/recruitment.service.ts |
| 109 | createVacancySchema | Validation Schema | src/lib/validations/recruitment.ts |
| 110 | updateVacancySchema | Validation Schema | src/lib/validations/recruitment.ts |
| 111 | createCandidateSchema | Validation Schema | src/lib/validations/recruitment.ts |
| 112 | updateCandidateStageSchema | Validation Schema | src/lib/validations/recruitment.ts |
| 113 | updateOfferSchema | Validation Schema | src/lib/validations/recruitment.ts |
| 114 | createInterviewSchema | Validation Schema | src/lib/validations/recruitment.ts |
| 115 | CandidateCvApi | API Route | src/app/api/recruitment/cv/route.ts |
| 116 | OfferLetterApi | API Route | src/app/api/recruitment/offer-letter/[candidateId]/route.ts |
| 117 | OfferLetterPdf | PDF Generator | src/lib/pdf/offer-letter-pdf.tsx |
| **Attendance Management** | | | |
| 118 | AttendancePage | Page | src/app/(dashboard)/attendance/page.tsx |
| 119 | AttendanceAdminPage | Page | src/app/(dashboard)/attendance-admin/page.tsx |
| 120 | AttendanceAdminDetailPage | Page | src/app/(dashboard)/attendance-admin/[employeeId]/page.tsx |
| 121 | AttendanceToday | Component | src/app/(dashboard)/attendance/_components/attendance-today.tsx |
| 122 | AttendanceHistory | Component | src/app/(dashboard)/attendance/_components/attendance-history.tsx |
| 123 | ClockInButton | Component | src/app/(dashboard)/attendance/_components/clock-in-button.tsx |
| 124 | AttendanceFilters | Component | src/app/(dashboard)/attendance-admin/_components/attendance-filters.tsx |
| 125 | AttendanceSummaryTable | Component | src/app/(dashboard)/attendance-admin/_components/attendance-summary-table.tsx |
| 126 | ManualRecordDialog | Component | src/app/(dashboard)/attendance-admin/_components/manual-record-dialog.tsx |
| 127 | ExportButtons | Component | src/app/(dashboard)/attendance-admin/_components/export-buttons.tsx |
| 128 | AttendanceStatusBadges | Component | src/components/attendance/attendance-status-badges.tsx |
| 129 | clockInAction | Server Action | src/lib/actions/attendance.actions.ts |
| 130 | clockOutAction | Server Action | src/lib/actions/attendance.actions.ts |
| 131 | manualOverrideAction | Server Action | src/lib/actions/attendance.actions.ts |
| 132 | calculateAttendanceFlags | Service | src/lib/services/attendance.service.ts |
| 133 | getTodayRecord | Service | src/lib/services/attendance.service.ts |
| 134 | getEmployeeAttendance | Service | src/lib/services/attendance.service.ts |
| 135 | getWeeklySummary | Service | src/lib/services/attendance.service.ts |
| 136 | getMonthlyAttendanceRecap | Service | src/lib/services/attendance.service.ts |
| 137 | verifyLocation | Service | src/lib/services/location.service.ts |
| 138 | clockActionSchema | Validation Schema | src/lib/validations/attendance.ts |
| 139 | manualAttendanceSchema | Validation Schema | src/lib/validations/attendance.ts |
| 140 | AttendanceExportApi | API Route | src/app/api/attendance/export/route.ts |
| 141 | AttendancePdf | PDF Generator | src/lib/pdf/attendance-pdf.tsx |
| **Leave Management** | | | |
| 142 | LeavePage | Page | src/app/(dashboard)/leave/page.tsx |
| 143 | LeaveManagePage | Page | src/app/(dashboard)/leave/manage/page.tsx |
| 144 | LeaveReportPage | Page | src/app/(dashboard)/leave/report/page.tsx |
| 145 | LeaveBalanceCard | Component | src/app/(dashboard)/leave/_components/leave-balance-card.tsx |
| 146 | LeaveHistoryTable | Component | src/app/(dashboard)/leave/_components/leave-history-table.tsx |
| 147 | LeaveRequestForm | Component | src/app/(dashboard)/leave/_components/leave-request-form.tsx |
| 148 | LeaveRequestSection | Component | src/app/(dashboard)/leave/_components/leave-request-section.tsx |
| 149 | LeaveTypeInfoPanel | Component | src/app/(dashboard)/leave/_components/leave-type-info-panel.tsx |
| 150 | ApproveRejectDialog | Component | src/app/(dashboard)/leave/manage/_components/approve-reject-dialog.tsx |
| 151 | LeaveApprovalTable | Component | src/app/(dashboard)/leave/manage/_components/leave-approval-table.tsx |
| 152 | LeaveReportFilters | Component | src/app/(dashboard)/leave/report/_components/leave-report-filters.tsx |
| 153 | LeaveReportKpiCards | Component | src/app/(dashboard)/leave/report/_components/leave-report-kpi-cards.tsx |
| 154 | LeaveReportTrendChart | Component | src/app/(dashboard)/leave/report/_components/leave-report-trend-chart.tsx |
| 155 | submitLeaveAction | Server Action | src/lib/actions/leave.actions.ts |
| 156 | approveLeaveAction | Server Action | src/lib/actions/leave.actions.ts |
| 157 | rejectLeaveAction | Server Action | src/lib/actions/leave.actions.ts |
| 158 | cancelLeaveAction | Server Action | src/lib/actions/leave.actions.ts |
| 159 | countWorkingDays | Service | src/lib/services/leave.service.ts |
| 160 | ensureLeaveBalances | Service | src/lib/services/leave.service.ts |
| 161 | getLeaveBalances | Service | src/lib/services/leave.service.ts |
| 162 | submitLeaveRequest | Service | src/lib/services/leave.service.ts |
| 163 | approveLeaveRequest | Service | src/lib/services/leave.service.ts |
| 164 | rejectLeaveRequest | Service | src/lib/services/leave.service.ts |
| 165 | cancelLeaveRequest | Service | src/lib/services/leave.service.ts |
| 166 | getLeaveRequests | Service | src/lib/services/leave.service.ts |
| 167 | submitLeaveSchema | Validation Schema | src/lib/validations/leave.ts |
| 168 | approveLeaveSchema | Validation Schema | src/lib/validations/leave.ts |
| 169 | rejectLeaveSchema | Validation Schema | src/lib/validations/leave.ts |
| **Payroll Management** | | | |
| 170 | PayrollListPage | Page | src/app/(dashboard)/payroll/page.tsx |
| 171 | PayrollDetailPage | Page | src/app/(dashboard)/payroll/[periodId]/page.tsx |
| 172 | PayslipPage | Page | src/app/(dashboard)/payslip/page.tsx |
| 173 | ImportPayrollForm | Component | src/app/(dashboard)/payroll/_components/import-payroll-form.tsx |
| 174 | PayrollEntryTable | Component | src/app/(dashboard)/payroll/[periodId]/_components/payroll-entry-table.tsx |
| 175 | FinalizeButton | Component | src/app/(dashboard)/payroll/[periodId]/_components/finalize-button.tsx |
| 176 | importPayrollAction | Server Action | src/lib/actions/payroll.actions.ts |
| 177 | finalizePayrollAction | Server Action | src/lib/actions/payroll.actions.ts |
| 178 | parsePayrollWorkbook | Service | src/lib/services/payroll-import.service.ts |
| 179 | buildPayrollTemplate | Service | src/lib/services/payroll-import.service.ts |
| 180 | matchRowsToEmployees | Service | src/lib/services/payroll.service.ts |
| 181 | persistImportedPayroll | Service | src/lib/services/payroll.service.ts |
| 182 | finalizePayroll | Service | src/lib/services/payroll.service.ts |
| 183 | getPayrollRuns | Service | src/lib/services/payroll.service.ts |
| 184 | getPayrollRunDetail | Service | src/lib/services/payroll.service.ts |
| 185 | importPayrollSchema | Validation Schema | src/lib/validations/payroll.ts |
| 186 | finalizePayrollSchema | Validation Schema | src/lib/validations/payroll.ts |
| 187 | PayslipPdfApi | API Route | src/app/api/payroll/payslip/[entryId]/route.ts |
| 188 | PayrollTemplateApi | API Route | src/app/api/payroll/template/route.ts |
| 189 | PayrollReportApi | API Route | src/app/api/payroll-report/route.ts |
| 190 | PayslipPdf | PDF Generator | src/lib/pdf/payslip-pdf.tsx |
| **Master Data** | | | |
| 191 | MasterDataPage | Page | src/app/(dashboard)/master-data/page.tsx |
| 192 | MasterDataTabs | Component | src/app/(dashboard)/master-data/_components/master-data-tabs.tsx |
| 193 | DepartmentTab | Component | src/app/(dashboard)/master-data/_components/department-tab.tsx |
| 194 | DepartmentFormDialog | Component | src/app/(dashboard)/master-data/_components/department-form-dialog.tsx |
| 195 | PositionTab | Component | src/app/(dashboard)/master-data/_components/position-tab.tsx |
| 196 | PositionFormDialog | Component | src/app/(dashboard)/master-data/_components/position-form-dialog.tsx |
| 197 | OfficeLocationTab | Component | src/app/(dashboard)/master-data/_components/office-location-tab.tsx |
| 198 | OfficeLocationFormDialog | Component | src/app/(dashboard)/master-data/_components/office-location-form-dialog.tsx |
| 199 | LeaveTypeTab | Component | src/app/(dashboard)/master-data/_components/leave-type-tab.tsx |
| 200 | LeaveTypeFormDialog | Component | src/app/(dashboard)/master-data/_components/leave-type-form-dialog.tsx |
| 201 | getDepartmentsAction / createDepartmentAction / updateDepartmentAction / deleteDepartmentAction / getAllDepartmentsAction | Server Action | src/lib/actions/master-data.actions.ts |
| 202 | getPositionsAction / createPositionAction / updatePositionAction / deletePositionAction / getAllPositionsAction | Server Action | src/lib/actions/master-data.actions.ts |
| 203 | getOfficeLocationsAction / createOfficeLocationAction / updateOfficeLocationAction / deleteOfficeLocationAction | Server Action | src/lib/actions/master-data.actions.ts |
| 204 | getLeaveTypesAction / createLeaveTypeAction / updateLeaveTypeAction / deleteLeaveTypeAction | Server Action | src/lib/actions/master-data.actions.ts |
| 205 | getDepartments / getAllDepartments / createDepartment / updateDepartment / deleteDepartment | Service | src/lib/services/master-data.service.ts |
| 206 | getPositions / getAllPositions / createPosition / updatePosition / deletePosition | Service | src/lib/services/master-data.service.ts |
| 207 | getOfficeLocations / getAllOfficeLocations / createOfficeLocation / updateOfficeLocation / deleteOfficeLocation | Service | src/lib/services/master-data.service.ts |
| 208 | getLeaveTypes / getAllLeaveTypes / createLeaveType / updateLeaveType / deleteLeaveType | Service | src/lib/services/master-data.service.ts |
| 209 | departmentSchema | Validation Schema | src/lib/validations/master-data.ts |
| 210 | positionSchema | Validation Schema | src/lib/validations/master-data.ts |
| 211 | officeLocationSchema | Validation Schema | src/lib/validations/master-data.ts |
| 212 | leaveTypeSchema | Validation Schema | src/lib/validations/master-data.ts |
| **Audit Log** | | | |
| 213 | AuditLogPage | Page | src/app/(dashboard)/audit-log/page.tsx |
| 214 | AuditLogDetailPage | Page | src/app/(dashboard)/audit-log/[id]/page.tsx |
| 215 | AuditLogTable | Component | src/app/(dashboard)/audit-log/_components/audit-log-table.tsx |
| 216 | AuditLogColumns | Component | src/app/(dashboard)/audit-log/_components/audit-log-columns.tsx |
| 217 | AuditLogFilters | Component | src/app/(dashboard)/audit-log/_components/audit-log-filters.tsx |
| 218 | getAuditLogs | Service | src/lib/services/audit.service.ts |
| 219 | getAuditLogById | Service | src/lib/services/audit.service.ts |
| 220 | getAuditLogUsers | Service | src/lib/services/audit.service.ts |
| 221 | getAuditLogModules | Service | src/lib/services/audit.service.ts |

### 4.7.4 Implementasi *Database*

Bagian ini merupakan hasil dari perancangan data berupa tabel dalam basis data yang diimplementasikan dari model domain. Setiap entitas yang telah dirancang dalam *updated domain model* diterjemahkan menjadi model Prisma, yang selanjutnya direpresentasikan sebagai struktur tabel dalam basis data PostgreSQL beserta atribut, tipe data, dan relasinya.

Implementasi ini mencakup pembuatan tabel, penentuan *primary key*, dan *foreign key*, serta pengaturan *constraints* yang diperlukan untuk menjaga integritas data. Relevansi antara implementasi *database* dengan model domain sangat penting karena model domain merepresentasikan objek-objek bisnis dan hubungannya dalam sistem, yang kemudian dipetakan ke dalam struktur *database* untuk menyimpan dan mengelola data sesuai dengan kebutuhan aplikasi.

Hasil implementasi *database* terdiri dari tujuh belas tabel yang berasal dari tujuh belas model Prisma pada `prisma/schema.prisma`. Migrasi *database* dikelola oleh Prisma Migrate dan tersimpan dalam direktori `prisma/migrations/`. Berikut adalah rincian implementasi tiap tabel.

#### 1. Tabel User

Tabel `User` digunakan untuk menyimpan data akun pengguna sistem yang berfungsi untuk autentikasi dan otorisasi berbasis peran. Implementasi tabel `User` dapat dilihat pada Tabel 4.41.

a. *Primary Key* : `id`
b. *Foreign Key* : –
c. Jumlah *Field* : 8

**Tabel 4.41 Implementasi basis data Tabel User**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id pengguna (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | name | *Field* menyimpan nama lengkap pengguna | String | No |
| 3 | email | *Field* menyimpan alamat email pengguna (*unique*) | String | No |
| 4 | hashedPassword | *Field* menyimpan kata sandi pengguna yang telah di-*hash* dengan bcrypt | String | No |
| 5 | role | *Field* menyimpan peran pengguna (enum `Role`: SUPER_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE), default EMPLOYEE | Enum(Role) | No |
| 6 | isActive | *Field* menyimpan status aktif akun pengguna, default `true` | Boolean | No |
| 7 | createdAt | *Field* menyimpan tanggal pembuatan akun pengguna | DateTime | No |
| 8 | updatedAt | *Field* menyimpan tanggal terakhir akun pengguna diperbarui | DateTime | No |

#### 2. Tabel Department

Tabel `Department` digunakan untuk menyimpan data master departemen pada struktur organisasi. Implementasi tabel `Department` dapat dilihat pada Tabel 4.42.

a. *Primary Key* : `id`
b. *Foreign Key* : –
c. Jumlah *Field* : 6

**Tabel 4.42 Implementasi basis data Tabel Department**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id departemen (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | name | *Field* menyimpan nama departemen | String | No |
| 3 | description | *Field* menyimpan deskripsi departemen | String | Yes |
| 4 | deletedAt | *Field* menyimpan tanggal *soft delete* departemen | DateTime | Yes |
| 5 | createdAt | *Field* menyimpan tanggal pembuatan data departemen | DateTime | No |
| 6 | updatedAt | *Field* menyimpan tanggal terakhir data departemen diperbarui | DateTime | No |

#### 3. Tabel Position

Tabel `Position` digunakan untuk menyimpan data master jabatan yang melekat pada suatu departemen. Implementasi tabel `Position` dapat dilihat pada Tabel 4.43.

a. *Primary Key* : `id`
b. *Foreign Key* : `departmentId` (merujuk ke tabel `Department`)
c. Jumlah *Field* : 6

**Tabel 4.43 Implementasi basis data Tabel Position**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id jabatan (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | name | *Field* menyimpan nama jabatan | String | No |
| 3 | departmentId | *Field* mengidentifikasi id departemen induk (*foreign key* ke tabel `Department`) | String | No |
| 4 | deletedAt | *Field* menyimpan tanggal *soft delete* jabatan | DateTime | Yes |
| 5 | createdAt | *Field* menyimpan tanggal pembuatan data jabatan | DateTime | No |
| 6 | updatedAt | *Field* menyimpan tanggal terakhir data jabatan diperbarui | DateTime | No |

#### 4. Tabel OfficeLocation

Tabel `OfficeLocation` digunakan untuk menyimpan data master lokasi kantor yang dipakai untuk verifikasi *clock in*/*clock out* karyawan melalui *allowlist* IP dan radius GPS. Implementasi tabel `OfficeLocation` dapat dilihat pada Tabel 4.44.

a. *Primary Key* : `id`
b. *Foreign Key* : –
c. Jumlah *Field* : 12

**Tabel 4.44 Implementasi basis data Tabel OfficeLocation**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id lokasi kantor (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | name | *Field* menyimpan nama lokasi kantor | String | No |
| 3 | address | *Field* menyimpan alamat lengkap lokasi kantor | String | Yes |
| 4 | allowedIPs | *Field* menyimpan daftar alamat IP yang diizinkan untuk clock in/out (array string) | String[] | No |
| 5 | latitude | *Field* menyimpan koordinat lintang lokasi kantor | Float | Yes |
| 6 | longitude | *Field* menyimpan koordinat bujur lokasi kantor | Float | Yes |
| 7 | radiusMeters | *Field* menyimpan radius valid (dalam meter) dari koordinat lokasi kantor | Integer | Yes |
| 8 | workStartTime | *Field* menyimpan jam mulai kerja standar lokasi kantor (format HH:MM) | String | Yes |
| 9 | workEndTime | *Field* menyimpan jam selesai kerja standar lokasi kantor (format HH:MM) | String | Yes |
| 10 | deletedAt | *Field* menyimpan tanggal *soft delete* lokasi kantor | DateTime | Yes |
| 11 | createdAt | *Field* menyimpan tanggal pembuatan data lokasi kantor | DateTime | No |
| 12 | updatedAt | *Field* menyimpan tanggal terakhir data lokasi kantor diperbarui | DateTime | No |

#### 5. Tabel LeaveType

Tabel `LeaveType` digunakan untuk menyimpan data master jenis cuti beserta kuota tahunannya. Implementasi tabel `LeaveType` dapat dilihat pada Tabel 4.45.

a. *Primary Key* : `id`
b. *Foreign Key* : –
c. Jumlah *Field* : 8

**Tabel 4.45 Implementasi basis data Tabel LeaveType**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id jenis cuti (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | name | *Field* menyimpan nama jenis cuti | String | No |
| 3 | annualQuota | *Field* menyimpan kuota cuti tahunan untuk jenis cuti ini | Integer | No |
| 4 | isPaid | *Field* menyimpan status apakah cuti berbayar atau tidak, default `true` | Boolean | No |
| 5 | genderRestriction | *Field* menyimpan restriksi gender untuk jenis cuti ini (MALE/FEMALE/null) | String | Yes |
| 6 | deletedAt | *Field* menyimpan tanggal *soft delete* jenis cuti | DateTime | Yes |
| 7 | createdAt | *Field* menyimpan tanggal pembuatan data jenis cuti | DateTime | No |
| 8 | updatedAt | *Field* menyimpan tanggal terakhir data jenis cuti diperbarui | DateTime | No |

#### 6. Tabel AuditLog

Tabel `AuditLog` digunakan untuk menyimpan catatan audit setiap operasi *create*, *update*, dan *delete* yang dilakukan pengguna pada modul-modul kritikal sistem. Implementasi tabel `AuditLog` dapat dilihat pada Tabel 4.46.

a. *Primary Key* : `id`
b. *Foreign Key* : `userId` (merujuk ke tabel `User`)
c. Jumlah *Field* : 8

**Tabel 4.46 Implementasi basis data Tabel AuditLog**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id log audit (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | userId | *Field* mengidentifikasi id pengguna yang melakukan aksi (*foreign key* ke tabel `User`) | String | No |
| 3 | action | *Field* menyimpan jenis aksi yang dilakukan (enum `AuditAction`: CREATE, UPDATE, DELETE) | Enum(AuditAction) | No |
| 4 | module | *Field* menyimpan nama modul tempat aksi terjadi | String | No |
| 5 | targetId | *Field* menyimpan id entitas yang menjadi sasaran aksi | String | No |
| 6 | oldValue | *Field* menyimpan nilai entitas sebelum aksi (JSON) | Json | Yes |
| 7 | newValue | *Field* menyimpan nilai entitas setelah aksi (JSON) | Json | Yes |
| 8 | createdAt | *Field* menyimpan tanggal pencatatan log audit | DateTime | No |

#### 7. Tabel Employee

Tabel `Employee` digunakan untuk menyimpan data karyawan yang merupakan entitas inti modul *Employee Data Management*, mencakup informasi personal, *employment*, perpajakan, dan BPJS. Implementasi tabel `Employee` dapat dilihat pada Tabel 4.47.

a. *Primary Key* : `id`
b. *Foreign Key* : `userId` (merujuk ke tabel `User`), `departmentId` (merujuk ke tabel `Department`), `positionId` (merujuk ke tabel `Position`), `officeLocationId` (merujuk ke tabel `OfficeLocation`)
c. Jumlah *Field* : 28

**Tabel 4.47 Implementasi basis data Tabel Employee**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id karyawan (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | nik | *Field* menyimpan NIK karyawan internal perusahaan (*unique*) | String | No |
| 3 | userId | *Field* mengidentifikasi id akun pengguna karyawan (*foreign key* ke tabel `User`, *unique*) | String | No |
| 4 | namaLengkap | *Field* menyimpan nama lengkap karyawan | String | No |
| 5 | nikKtp | *Field* menyimpan nomor KTP karyawan | String | Yes |
| 6 | tempatLahir | *Field* menyimpan tempat lahir karyawan | String | Yes |
| 7 | tanggalLahir | *Field* menyimpan tanggal lahir karyawan | DateTime | Yes |
| 8 | jenisKelamin | *Field* menyimpan jenis kelamin karyawan (enum `Gender`: MALE, FEMALE) | Enum(Gender) | Yes |
| 9 | statusPernikahan | *Field* menyimpan status pernikahan karyawan (enum `MaritalStatus`: TK, K) | Enum(MaritalStatus) | Yes |
| 10 | agama | *Field* menyimpan agama karyawan (enum `Religion`: ISLAM, KRISTEN, KATOLIK, HINDU, BUDDHA, KONGHUCU) | Enum(Religion) | Yes |
| 11 | alamat | *Field* menyimpan alamat tempat tinggal karyawan | String | Yes |
| 12 | nomorHp | *Field* menyimpan nomor telepon karyawan | String | Yes |
| 13 | email | *Field* menyimpan alamat email karyawan | String | No |
| 14 | departmentId | *Field* mengidentifikasi id departemen karyawan (*foreign key* ke tabel `Department`) | String | No |
| 15 | positionId | *Field* mengidentifikasi id jabatan karyawan (*foreign key* ke tabel `Position`) | String | No |
| 16 | officeLocationId | *Field* mengidentifikasi id lokasi kantor karyawan (*foreign key* ke tabel `OfficeLocation`) | String | Yes |
| 17 | contractType | *Field* menyimpan jenis kontrak karyawan (enum `ContractType`: PKWT, PKWTT) | Enum(ContractType) | No |
| 18 | joinDate | *Field* menyimpan tanggal masuk kerja karyawan | DateTime | No |
| 19 | isActive | *Field* menyimpan status aktif karyawan, default `true` | Boolean | No |
| 20 | terminationDate | *Field* menyimpan tanggal pemutusan hubungan kerja karyawan | DateTime | Yes |
| 21 | terminationReason | *Field* menyimpan alasan pemutusan hubungan kerja karyawan | String | Yes |
| 22 | npwp | *Field* menyimpan nomor NPWP karyawan | String | Yes |
| 23 | ptkpStatus | *Field* menyimpan status PTKP karyawan (enum `PTKPStatus`: TK_0..TK_3, K_0..K_3) | Enum(PTKPStatus) | Yes |
| 24 | bpjsKesehatanNo | *Field* menyimpan nomor BPJS Kesehatan karyawan | String | Yes |
| 25 | bpjsKetenagakerjaanNo | *Field* menyimpan nomor BPJS Ketenagakerjaan karyawan | String | Yes |
| 26 | isTaxBorneByCompany | *Field* menyimpan status apakah pajak karyawan ditanggung perusahaan, default `false` | Boolean | No |
| 27 | createdAt | *Field* menyimpan tanggal pembuatan data karyawan | DateTime | No |
| 28 | updatedAt | *Field* menyimpan tanggal terakhir data karyawan diperbarui | DateTime | No |

#### 8. Tabel EmployeeDocument

Tabel `EmployeeDocument` digunakan untuk menyimpan metadata berkas dokumen yang diunggah untuk seorang karyawan (KTP, NPWP, kontrak, dan lain-lain). Implementasi tabel `EmployeeDocument` dapat dilihat pada Tabel 4.48.

a. *Primary Key* : `id`
b. *Foreign Key* : `employeeId` (merujuk ke tabel `Employee`, *cascade delete*)
c. Jumlah *Field* : 9

**Tabel 4.48 Implementasi basis data Tabel EmployeeDocument**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id dokumen karyawan (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | employeeId | *Field* mengidentifikasi id karyawan pemilik dokumen (*foreign key* ke tabel `Employee`) | String | No |
| 3 | documentType | *Field* menyimpan jenis dokumen (enum `DocumentType`: KTP, NPWP, BPJS_KESEHATAN, BPJS_KETENAGAKERJAAN, KONTRAK, FOTO, LAINNYA) | Enum(DocumentType) | No |
| 4 | fileName | *Field* menyimpan nama berkas asli dokumen | String | No |
| 5 | filePath | *Field* menyimpan *path* berkas dokumen pada *filesystem* lokal | String | No |
| 6 | fileSize | *Field* menyimpan ukuran berkas dokumen dalam *byte* | Integer | No |
| 7 | mimeType | *Field* menyimpan tipe MIME berkas dokumen | String | No |
| 8 | createdAt | *Field* menyimpan tanggal unggah dokumen | DateTime | No |
| 9 | updatedAt | *Field* menyimpan tanggal terakhir metadata dokumen diperbarui | DateTime | No |

#### 9. Tabel EmergencyContact

Tabel `EmergencyContact` digunakan untuk menyimpan data kontak darurat (keluarga atau kerabat) untuk setiap karyawan. Implementasi tabel `EmergencyContact` dapat dilihat pada Tabel 4.49.

a. *Primary Key* : `id`
b. *Foreign Key* : `employeeId` (merujuk ke tabel `Employee`, *cascade delete*)
c. Jumlah *Field* : 8

**Tabel 4.49 Implementasi basis data Tabel EmergencyContact**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id kontak darurat (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | employeeId | *Field* mengidentifikasi id karyawan pemilik kontak darurat (*foreign key* ke tabel `Employee`) | String | No |
| 3 | name | *Field* menyimpan nama kontak darurat | String | No |
| 4 | relationship | *Field* menyimpan hubungan kontak darurat dengan karyawan | String | No |
| 5 | phone | *Field* menyimpan nomor telepon kontak darurat | String | No |
| 6 | address | *Field* menyimpan alamat kontak darurat | String | Yes |
| 7 | createdAt | *Field* menyimpan tanggal pembuatan data kontak darurat | DateTime | No |
| 8 | updatedAt | *Field* menyimpan tanggal terakhir data kontak darurat diperbarui | DateTime | No |

#### 10. Tabel AttendanceRecord

Tabel `AttendanceRecord` digunakan untuk menyimpan catatan kehadiran harian karyawan, termasuk waktu *clock in*/*clock out*, lokasi IP/GPS, dan kalkulasi keterlambatan, pulang lebih awal, serta lembur. Implementasi tabel `AttendanceRecord` dapat dilihat pada Tabel 4.50.

a. *Primary Key* : `id`
b. *Foreign Key* : `employeeId` (merujuk ke tabel `Employee`), `officeLocationId` (merujuk ke tabel `OfficeLocation`), `overrideById` (merujuk ke tabel `User`)
c. Jumlah *Field* : 21

**Tabel 4.50 Implementasi basis data Tabel AttendanceRecord**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id catatan kehadiran (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | employeeId | *Field* mengidentifikasi id karyawan pemilik catatan kehadiran (*foreign key* ke tabel `Employee`) | String | No |
| 3 | officeLocationId | *Field* mengidentifikasi id lokasi kantor tempat clock in/out dilakukan (*foreign key* ke tabel `OfficeLocation`) | String | No |
| 4 | date | *Field* menyimpan tanggal catatan kehadiran (*unique* bersama `employeeId`) | DateTime | No |
| 5 | clockIn | *Field* menyimpan waktu *clock in* karyawan | DateTime | Yes |
| 6 | clockOut | *Field* menyimpan waktu *clock out* karyawan | DateTime | Yes |
| 7 | clockInIp | *Field* menyimpan alamat IP saat karyawan *clock in* | String | Yes |
| 8 | clockOutIp | *Field* menyimpan alamat IP saat karyawan *clock out* | String | Yes |
| 9 | clockInLat | *Field* menyimpan koordinat lintang saat karyawan *clock in* | Float | Yes |
| 10 | clockInLon | *Field* menyimpan koordinat bujur saat karyawan *clock in* | Float | Yes |
| 11 | isLate | *Field* menyimpan status apakah karyawan terlambat, default `false` | Boolean | No |
| 12 | lateMinutes | *Field* menyimpan durasi keterlambatan dalam menit, default `0` | Integer | No |
| 13 | isEarlyOut | *Field* menyimpan status apakah karyawan pulang lebih awal, default `false` | Boolean | No |
| 14 | earlyOutMinutes | *Field* menyimpan durasi pulang lebih awal dalam menit, default `0` | Integer | No |
| 15 | overtimeMinutes | *Field* menyimpan durasi lembur dalam menit, default `0` | Integer | No |
| 16 | totalMinutes | *Field* menyimpan total durasi kerja dalam menit, default `0` | Integer | No |
| 17 | isManualOverride | *Field* menyimpan status apakah catatan ini hasil koreksi manual oleh HR, default `false` | Boolean | No |
| 18 | overrideById | *Field* mengidentifikasi id pengguna yang melakukan koreksi manual (*foreign key* ke tabel `User`) | String | Yes |
| 19 | overrideReason | *Field* menyimpan alasan koreksi manual oleh HR | String | Yes |
| 20 | createdAt | *Field* menyimpan tanggal pembuatan catatan kehadiran | DateTime | No |
| 21 | updatedAt | *Field* menyimpan tanggal terakhir catatan kehadiran diperbarui | DateTime | No |

#### 11. Tabel LeaveRequest

Tabel `LeaveRequest` digunakan untuk menyimpan pengajuan cuti karyawan beserta status *workflow* persetujuan dua tahap (Manager → HR). Implementasi tabel `LeaveRequest` dapat dilihat pada Tabel 4.51.

a. *Primary Key* : `id`
b. *Foreign Key* : `employeeId` (merujuk ke tabel `Employee`), `leaveTypeId` (merujuk ke tabel `LeaveType`), `managerApprovedById` (merujuk ke tabel `User`), `hrApprovedById` (merujuk ke tabel `User`)
c. Jumlah *Field* : 16

**Tabel 4.51 Implementasi basis data Tabel LeaveRequest**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id pengajuan cuti (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | employeeId | *Field* mengidentifikasi id karyawan pengaju cuti (*foreign key* ke tabel `Employee`) | String | No |
| 3 | leaveTypeId | *Field* mengidentifikasi id jenis cuti (*foreign key* ke tabel `LeaveType`) | String | No |
| 4 | startDate | *Field* menyimpan tanggal mulai cuti | DateTime | No |
| 5 | endDate | *Field* menyimpan tanggal selesai cuti | DateTime | No |
| 6 | workingDays | *Field* menyimpan jumlah hari kerja yang diambil sebagai cuti | Integer | No |
| 7 | reason | *Field* menyimpan alasan pengajuan cuti | String | No |
| 8 | status | *Field* menyimpan status pengajuan cuti (enum `LeaveStatus`: PENDING_MANAGER, PENDING_HR, APPROVED, REJECTED, CANCELLED), default PENDING_MANAGER | Enum(LeaveStatus) | No |
| 9 | managerApprovedById | *Field* mengidentifikasi id manajer yang memberi keputusan tahap pertama (*foreign key* ke tabel `User`) | String | Yes |
| 10 | managerNotes | *Field* menyimpan catatan manajer atas keputusannya | String | Yes |
| 11 | managerApprovedAt | *Field* menyimpan tanggal keputusan manajer | DateTime | Yes |
| 12 | hrApprovedById | *Field* mengidentifikasi id HR yang memberi keputusan tahap kedua (*foreign key* ke tabel `User`) | String | Yes |
| 13 | hrNotes | *Field* menyimpan catatan HR atas keputusannya | String | Yes |
| 14 | hrApprovedAt | *Field* menyimpan tanggal keputusan HR | DateTime | Yes |
| 15 | createdAt | *Field* menyimpan tanggal pengajuan cuti | DateTime | No |
| 16 | updatedAt | *Field* menyimpan tanggal terakhir pengajuan cuti diperbarui | DateTime | No |

#### 12. Tabel LeaveBalance

Tabel `LeaveBalance` digunakan untuk menyimpan saldo cuti karyawan per jenis cuti per tahun. Implementasi tabel `LeaveBalance` dapat dilihat pada Tabel 4.52.

a. *Primary Key* : `id`
b. *Foreign Key* : `employeeId` (merujuk ke tabel `Employee`), `leaveTypeId` (merujuk ke tabel `LeaveType`)
c. Jumlah *Field* : 8

**Tabel 4.52 Implementasi basis data Tabel LeaveBalance**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id saldo cuti (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | employeeId | *Field* mengidentifikasi id karyawan pemilik saldo cuti (*foreign key* ke tabel `Employee`) | String | No |
| 3 | leaveTypeId | *Field* mengidentifikasi id jenis cuti (*foreign key* ke tabel `LeaveType`) | String | No |
| 4 | year | *Field* menyimpan tahun berlaku saldo cuti | Integer | No |
| 5 | allocatedDays | *Field* menyimpan jumlah hari cuti yang dialokasikan untuk karyawan pada tahun tersebut | Integer | No |
| 6 | usedDays | *Field* menyimpan jumlah hari cuti yang telah digunakan, default `0` | Integer | No |
| 7 | createdAt | *Field* menyimpan tanggal pembuatan data saldo cuti | DateTime | No |
| 8 | updatedAt | *Field* menyimpan tanggal terakhir saldo cuti diperbarui | DateTime | No |

#### 13. Tabel PayrollRun

Tabel `PayrollRun` digunakan untuk menyimpan periode penggajian (bulan dan tahun) beserta status finalisasinya. Implementasi tabel `PayrollRun` dapat dilihat pada Tabel 4.53.

a. *Primary Key* : `id`
b. *Foreign Key* : –
c. Jumlah *Field* : 7

**Tabel 4.53 Implementasi basis data Tabel PayrollRun**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id periode payroll (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | month | *Field* menyimpan bulan periode payroll (1–12) | Integer | No |
| 3 | year | *Field* menyimpan tahun periode payroll | Integer | No |
| 4 | status | *Field* menyimpan status periode payroll (enum `PayrollStatus`: DRAFT, FINALIZED), default DRAFT | Enum(PayrollStatus) | No |
| 5 | createdBy | *Field* menyimpan id pengguna pembuat periode payroll | String | No |
| 6 | createdAt | *Field* menyimpan tanggal pembuatan periode payroll | DateTime | No |
| 7 | updatedAt | *Field* menyimpan tanggal terakhir periode payroll diperbarui | DateTime | No |

#### 14. Tabel PayrollEntry

Tabel `PayrollEntry` digunakan untuk menyimpan *snapshot* gaji per karyawan per periode payroll, mencakup *earnings*, *deductions*, *benefits* (porsi perusahaan), dan ringkasan absensi yang diimpor dari berkas Excel. Implementasi tabel `PayrollEntry` dapat dilihat pada Tabel 4.54.

a. *Primary Key* : `id`
b. *Foreign Key* : `payrollRunId` (merujuk ke tabel `PayrollRun`, *cascade delete*), `employeeId` (merujuk ke tabel `Employee`)
c. Jumlah *Field* : 42

**Tabel 4.54 Implementasi basis data Tabel PayrollEntry**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id entri payroll (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | payrollRunId | *Field* mengidentifikasi id periode payroll (*foreign key* ke tabel `PayrollRun`) | String | No |
| 3 | employeeId | *Field* mengidentifikasi id karyawan pemilik entri (*foreign key* ke tabel `Employee`) | String | No |
| 4 | employeeNik | *Field* menyimpan *snapshot* NIK karyawan saat impor | String | No |
| 5 | employeeName | *Field* menyimpan *snapshot* nama karyawan saat impor | String | No |
| 6 | jobPosition | *Field* menyimpan *snapshot* jabatan karyawan saat impor, default kosong | String | No |
| 7 | organization | *Field* menyimpan *snapshot* organisasi/departemen karyawan saat impor, default kosong | String | No |
| 8 | gradeLevel | *Field* menyimpan *snapshot* level/grade karyawan saat impor, default kosong | String | No |
| 9 | ptkpStatus | *Field* menyimpan *snapshot* status PTKP karyawan saat impor, default kosong | String | No |
| 10 | npwp | *Field* menyimpan *snapshot* NPWP karyawan saat impor | String | Yes |
| 11 | basicSalary | *Field* menyimpan gaji pokok karyawan, default `0` | Decimal(15,2) | No |
| 12 | tunjanganKomunikasi | *Field* menyimpan tunjangan komunikasi karyawan, default `0` | Decimal(15,2) | No |
| 13 | tunjanganKehadiran | *Field* menyimpan tunjangan kehadiran karyawan, default `0` | Decimal(15,2) | No |
| 14 | tunjanganJabatan | *Field* menyimpan tunjangan jabatan karyawan, default `0` | Decimal(15,2) | No |
| 15 | tunjanganLainnya | *Field* menyimpan tunjangan lainnya karyawan, default `0` | Decimal(15,2) | No |
| 16 | taxAllowance | *Field* menyimpan tunjangan pajak karyawan, default `0` | Decimal(15,2) | No |
| 17 | thr | *Field* menyimpan tunjangan hari raya karyawan, default `0` | Decimal(15,2) | No |
| 18 | totalEarnings | *Field* menyimpan total pendapatan karyawan | Decimal(15,2) | No |
| 19 | bpjsKesehatanEmployee | *Field* menyimpan potongan BPJS Kesehatan dari karyawan, default `0` | Decimal(15,2) | No |
| 20 | jhtEmployee | *Field* menyimpan potongan JHT dari karyawan, default `0` | Decimal(15,2) | No |
| 21 | jaminanPensiunEmployee | *Field* menyimpan potongan Jaminan Pensiun dari karyawan, default `0` | Decimal(15,2) | No |
| 22 | pph21 | *Field* menyimpan potongan PPh21 karyawan, default `0` | Decimal(15,2) | No |
| 23 | potonganKeterlambatan | *Field* menyimpan potongan keterlambatan karyawan, default `0` | Decimal(15,2) | No |
| 24 | potonganKoperasi | *Field* menyimpan potongan koperasi karyawan, default `0` | Decimal(15,2) | No |
| 25 | potonganLainnya | *Field* menyimpan potongan lainnya karyawan, default `0` | Decimal(15,2) | No |
| 26 | totalDeductions | *Field* menyimpan total potongan karyawan | Decimal(15,2) | No |
| 27 | takeHomePay | *Field* menyimpan gaji bersih (*take home pay*) karyawan | Decimal(15,2) | No |
| 28 | jkk | *Field* menyimpan kontribusi JKK porsi perusahaan, default `0` | Decimal(15,2) | No |
| 29 | jkm | *Field* menyimpan kontribusi JKM porsi perusahaan, default `0` | Decimal(15,2) | No |
| 30 | jhtCompany | *Field* menyimpan kontribusi JHT porsi perusahaan, default `0` | Decimal(15,2) | No |
| 31 | jaminanPensiunCompany | *Field* menyimpan kontribusi Jaminan Pensiun porsi perusahaan, default `0` | Decimal(15,2) | No |
| 32 | bpjsKesehatanCompany | *Field* menyimpan kontribusi BPJS Kesehatan porsi perusahaan, default `0` | Decimal(15,2) | No |
| 33 | totalBenefits | *Field* menyimpan total *benefits* porsi perusahaan | Decimal(15,2) | No |
| 34 | actualWorkingDay | *Field* menyimpan jumlah hari kerja aktual karyawan, default `0` | Integer | No |
| 35 | scheduleWorkingDay | *Field* menyimpan jumlah hari kerja sesuai jadwal, default `0` | Integer | No |
| 36 | dayoff | *Field* menyimpan jumlah hari libur karyawan, default `0` | Integer | No |
| 37 | nationalHoliday | *Field* menyimpan jumlah hari libur nasional, default `0` | Integer | No |
| 38 | companyHoliday | *Field* menyimpan jumlah hari libur perusahaan, default `0` | Integer | No |
| 39 | specialHoliday | *Field* menyimpan jumlah hari libur khusus, default `0` | Integer | No |
| 40 | attendanceCodes | *Field* menyimpan kode-kode absensi rinci karyawan, default kosong | String | No |
| 41 | createdAt | *Field* menyimpan tanggal pembuatan entri payroll | DateTime | No |
| 42 | updatedAt | *Field* menyimpan tanggal terakhir entri payroll diperbarui | DateTime | No |

#### 15. Tabel Vacancy

Tabel `Vacancy` digunakan untuk menyimpan lowongan kerja yang dibuka oleh HR di setiap departemen. Implementasi tabel `Vacancy` dapat dilihat pada Tabel 4.55.

a. *Primary Key* : `id`
b. *Foreign Key* : `departmentId` (merujuk ke tabel `Department`)
c. Jumlah *Field* : 10

**Tabel 4.55 Implementasi basis data Tabel Vacancy**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id lowongan (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | title | *Field* menyimpan judul lowongan | String | No |
| 3 | departmentId | *Field* mengidentifikasi id departemen yang membuka lowongan (*foreign key* ke tabel `Department`) | String | No |
| 4 | description | *Field* menyimpan deskripsi lowongan | String (Text) | No |
| 5 | requirements | *Field* menyimpan persyaratan lowongan | String (Text) | No |
| 6 | status | *Field* menyimpan status lowongan (enum `VacancyStatus`: OPEN, CLOSED), default OPEN | Enum(VacancyStatus) | No |
| 7 | openDate | *Field* menyimpan tanggal pembukaan lowongan | DateTime | No |
| 8 | closeDate | *Field* menyimpan tanggal penutupan lowongan | DateTime | Yes |
| 9 | createdAt | *Field* menyimpan tanggal pembuatan data lowongan | DateTime | No |
| 10 | updatedAt | *Field* menyimpan tanggal terakhir data lowongan diperbarui | DateTime | No |

#### 16. Tabel Candidate

Tabel `Candidate` digunakan untuk menyimpan data pelamar yang melamar pada suatu lowongan, beserta tahap rekrutmen, dokumen CV, dan informasi penawaran kerja. Implementasi tabel `Candidate` dapat dilihat pada Tabel 4.56.

a. *Primary Key* : `id`
b. *Foreign Key* : `vacancyId` (merujuk ke tabel `Vacancy`)
c. Jumlah *Field* : 13

**Tabel 4.56 Implementasi basis data Tabel Candidate**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id kandidat (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | vacancyId | *Field* mengidentifikasi id lowongan yang dilamar (*foreign key* ke tabel `Vacancy`) | String | No |
| 3 | name | *Field* menyimpan nama lengkap kandidat | String | No |
| 4 | email | *Field* menyimpan alamat email kandidat | String | No |
| 5 | phone | *Field* menyimpan nomor telepon kandidat | String | Yes |
| 6 | stage | *Field* menyimpan tahap rekrutmen kandidat (enum `CandidateStage`: MELAMAR, SELEKSI_BERKAS, INTERVIEW, PENAWARAN, DITERIMA, DITOLAK), default MELAMAR | Enum(CandidateStage) | No |
| 7 | cvPath | *Field* menyimpan *path* berkas CV kandidat pada *filesystem* lokal | String | Yes |
| 8 | notes | *Field* menyimpan catatan tambahan tentang kandidat | String (Text) | Yes |
| 9 | offerSalary | *Field* menyimpan nominal gaji yang ditawarkan kepada kandidat | Decimal(15,2) | Yes |
| 10 | offerNotes | *Field* menyimpan catatan terkait penawaran kerja kandidat | String (Text) | Yes |
| 11 | hiredAt | *Field* menyimpan tanggal kandidat resmi diterima sebagai karyawan | DateTime | Yes |
| 12 | createdAt | *Field* menyimpan tanggal pembuatan data kandidat | DateTime | No |
| 13 | updatedAt | *Field* menyimpan tanggal terakhir data kandidat diperbarui | DateTime | No |

#### 17. Tabel Interview

Tabel `Interview` digunakan untuk menyimpan jadwal wawancara seorang kandidat beserta catatan hasil wawancaranya. Implementasi tabel `Interview` dapat dilihat pada Tabel 4.57.

a. *Primary Key* : `id`
b. *Foreign Key* : `candidateId` (merujuk ke tabel `Candidate`)
c. Jumlah *Field* : 7

**Tabel 4.57 Implementasi basis data Tabel Interview**

| No | Nama *Field* | Deskripsi | Tipe Data | *Null* |
|----|--------------|-----------|-----------|--------|
| 1 | id | *Field* mengidentifikasi id jadwal wawancara (*primary key*, dibangkitkan dengan cuid) | String | No |
| 2 | candidateId | *Field* mengidentifikasi id kandidat yang diwawancarai (*foreign key* ke tabel `Candidate`) | String | No |
| 3 | scheduledAt | *Field* menyimpan waktu jadwal wawancara | DateTime | No |
| 4 | interviewerName | *Field* menyimpan nama pewawancara | String | Yes |
| 5 | notes | *Field* menyimpan catatan hasil wawancara | String (Text) | Yes |
| 6 | createdAt | *Field* menyimpan tanggal pembuatan jadwal wawancara | DateTime | No |
| 7 | updatedAt | *Field* menyimpan tanggal terakhir jadwal wawancara diperbarui | DateTime | No |

Dengan terdokumentasikannya tujuh belas tabel di atas, seluruh entitas pada *updated domain model* (Gambar 4.56) telah memiliki representasi konkret pada basis data PostgreSQL. Konfigurasi *primary key*, *foreign key*, *unique constraint* (misalnya `[employeeId, date]` pada `AttendanceRecord`, `[month, year]` pada `PayrollRun`, dan `[payrollRunId, employeeId]` pada `PayrollEntry`), serta *cascade delete* pada relasi komposisi (`EmployeeDocument`, `EmergencyContact`, `PayrollEntry`) telah terpasang sebagaimana didefinisikan pada `prisma/schema.prisma` dan ter-*deploy* melalui delapan berkas migrasi Prisma Migrate pada direktori `prisma/migrations/`.
