## Tech Stack
- **Backend:** ASP.NET Core (C#)
- **Frontend:** React + TypeScript
- **Database:** PostgreSQL (Npgsql)
- **Real-time:** SignalR
- **Auth:** JWT (JSON Web Token) with Http-Only Cookies

## Fitur Utama
1. **Manajemen Data Mesin:** CRUD (Create, Read, Update, Delete) data mesin dan monitoring status (Aktif/Mati).
2. **Monitoring Produksi:** Data sensor (jumlah barang, suhu, operator) yang masuk secara real-time via SignalR.
3. **Laporan Produksi:** Rekapitulasi data harian dengan filter tanggal.
4. **Keamanan:** Autentikasi JWT yang terintegrasi dengan browser cookies untuk keamanan XSS.


## 🚀 Cara Menjalankan

### 1. Nyalakan Database (Docker)

Cukup jalankan perintah ini di terminal. Database TimescaleDB beserta seluruh tabel otomatis akan dibuat.
`docker-compose up -d`

### 2. Jalankan Backend (C#)

`cd be_eid_techinicaltest`
`dotnet run`

### 3. Jalankan Frontend (React)

`cd fe_eid_techinicaltest`
`npm install`
`npm run dev`

### 4. Akun Default
- **Username:** `admin`
- **Password:** `admin123`

### 5. Test Sensor mesin
- **buka link di browser** `http://localhost:5014/swagger`
- **Cari Endpoint POST** `/api/LogProduksi/sensor`
- **Input Data:**
{
  "idMesin": "Sesuai id mesin",
  "jumlahBarang": 120,
  "statusMesin": "Running",
  "temperatur": 42.5,
  "namaOperator": "Operator Test"
}


