import React, { useEffect, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { AxiosError } from "axios";

interface Mesin {
  id: string;
  namaMesin: string;
  tipeMesin: string;
  statusAktif: boolean;
}

interface LogProduksi {
  id: string;
  idMesin: string;
  jumlahBarang: number;
  statusMesin: string;
  temperatur: number;
  namaOperator: string;
  waktuPencatatan: string;
}

// Sesuai RekapProduksiDto dari backend:
// NamaMesin, TotalProduksi, RataRataSuhu, TotalError
// waktuBucket perlu ditambahkan di SQL query backend (lihat catatan di bawah)
interface LaporanProduksi {
  namaMesin: string;
  waktuBucket: string; // hasil time_bucket — tambahkan di SELECT backend
  totalProduksi: number;
  rataRataSuhu: number;
  totalError: number;
}

// ── Helper: format waktuBucket (ISO datetime dari time_bucket) ──
const formatWaktuBucket = (raw: string): { tanggal: string; jam: string } => {
  if (!raw) return { tanggal: "—", jam: "—" };
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { tanggal: raw, jam: "" };
  const tanggal = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const jam = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { tanggal, jam };
};

// ── Helper: label shift dari jam ──
const getLabelShift = (raw: string): string => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  const hour = d.getUTCHours(); // time_bucket pakai UTC
  if (hour < 8) return "Shift Malam";
  if (hour < 16) return "Shift Pagi";
  return "Shift Siang";
};

// ── Helper: export laporan ke CSV ──
const exportCSV = (laporan: LaporanProduksi[], tanggal: string) => {
  const header = [
    "Nama Mesin",
    "Tanggal",
    "Jam Mulai",
    "Shift",
    "Total Produksi (Unit)",
    "Rata-rata Suhu (°C)",
    "Total Error",
  ];
  const rows = laporan.map((item) => {
    const { tanggal: tgl, jam } = formatWaktuBucket(item.waktuBucket);
    const shift = getLabelShift(item.waktuBucket);
    return [
      item.namaMesin,
      tgl,
      jam,
      shift,
      item.totalProduksi.toString(),
      item.rataRataSuhu ? item.rataRataSuhu.toFixed(2) : "0.00",
      item.totalError.toString(),
    ];
  });
  const csvContent = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-produksi-${tanggal}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    namaMesin: "",
    tipeMesin: "",
  });
  const [daftarMesin, setDaftarMesin] = useState<Mesin[]>([]);
  const [logRealTime, setLogRealTime] = useState<LogProduksi[]>([]);
  const [filterMesinId, setFilterMesinId] = useState<string>("semua");
  const [maxLog, setMaxLog] = useState<number>(5);
  const [laporan, setLaporan] = useState<LaporanProduksi[]>([]);
  const [tanggalLaporan, setTanggalLaporan] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Log yang sudah difilter per mesin
  const logTerfilter =
    filterMesinId === "semua"
      ? logRealTime
      : logRealTime.filter((l) => l.idMesin === filterMesinId);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/Auth/logout");
      navigate("/login");
    } catch (error) {
      console.error("Gagal melakukan logout", error);
      alert("Terjadi kesalahan saat logout.");
    }
  };

  const handleToggleStatus = async (id: string, statusSaatIni: boolean) => {
    try {
      await axiosInstance.put(`/Mesin/${id}/status`, {
        statusAktif: !statusSaatIni,
      });
      const response = await axiosInstance.get("/Mesin");
      setDaftarMesin(response.data);
    } catch (error) {
      console.error("Gagal mengubah status mesin", error);
      alert("Gagal mengubah status mesin. Pastikan Anda memiliki akses.");
    }
  };

  const handleDeleteMesin = async (id: string, namaMesin: string) => {
    if (!window.confirm(`Yakin ingin menghapus mesin "${namaMesin}"?`)) return;
    try {
      await axiosInstance.delete(`/Mesin/${id}`);
      const res = await axiosInstance.get("/Mesin");
      setDaftarMesin(res.data);
      if (filterMesinId === id) setFilterMesinId("semua");
    } catch (error) {
      alert("Gagal menghapus mesin.");
    }
  };

  const handleSaveMesin = async () => {
    try {
      if (isEditMode) {
        await axiosInstance.put(`/Mesin/${formData.id}`, {
          namaMesin: formData.namaMesin,
          tipeMesin: formData.tipeMesin,
        });
      } else {
        await axiosInstance.post("/Mesin", {
          namaMesin: formData.namaMesin,
          tipeMesin: formData.tipeMesin,
        });
      }
      setIsModalOpen(false);
      const res = await axiosInstance.get("/Mesin");
      setDaftarMesin(res.data);
    } catch (error) {
      alert("Gagal menyimpan data mesin.");
    }
  };

  useEffect(() => {
    const fetchMesin = async () => {
      try {
        const response = await axiosInstance.get("/Mesin");
        setDaftarMesin(response.data);
      } catch (error: unknown) {
        const err = error as AxiosError;
        if (err.response && err.response.status === 401) {
          alert("Sesi Anda telah habis atau Anda belum login.");
          navigate("/login");
        } else {
          console.error("Gagal mengambil data mesin", err);
        }
      }
    };
    fetchMesin();

    const connection = new HubConnectionBuilder()
      .withUrl("http://localhost:5014/produksihub", { withCredentials: false })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => console.log("SignalR Terhubung ke Pabrik!"))
      .catch((err) => console.error("SignalR Gagal Terhubung: ", err));

    connection.on("TerimaUpdateProduksi", (data: LogProduksi) => {
      setLogRealTime((prevLogs) => [data, ...prevLogs].slice(0, 50));
    });

    return () => {
      connection.stop();
    };
  }, [navigate]);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const response = await axiosInstance.get(
          `/LogProduksi/laporan?tanggal=${tanggalLaporan}`,
        );
        setLaporan(response.data);
      } catch (error) {
        console.error("Gagal mengambil data laporan", error);
      }
    };
    fetchLaporan();
  }, [tanggalLaporan]);

  return (
    <div className="dashboard-wrapper">
      <style>{`
        * { box-sizing: border-box; }
        body { background-color: #f4f7f6; margin: 0; padding: 0; }
        .dashboard-wrapper { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; color: #333; }

        .header { display: flex; justify-content: space-between; align-items: center; background: white; padding: 20px 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
        .header h1 { margin: 0; font-size: 1.8rem; color: #2c3e50; display: flex; align-items: center; gap: 10px; }
        .btn-logout { background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; gap: 8px; font-size: 1rem; }
        .btn-logout:hover { background: #c0392b; transform: translateY(-2px); }

        .grid-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 25px; }

        .card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .card-header-title { margin-top: 0; font-size: 1.3rem; color: #34495e; margin-bottom: 15px; border-bottom: 2px solid #f0f2f5; padding-bottom: 10px; }
        .card-green { border-top: 5px solid #2ecc71; }
        .card-blue { border-top: 5px solid #3498db; background: linear-gradient(to bottom, #ffffff, #f8fbff); }

        .mesin-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #f0f2f5; padding-bottom: 10px; }
        .mesin-card-header h2 { margin: 0; font-size: 1.3rem; color: #34495e; }

        .list-unstyled { list-style: none; padding: 0; margin: 0; }
        .mesin-item { display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #bdc3c7; transition: all 0.2s ease; }
        .mesin-item:hover { transform: translateX(5px); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .mesin-item.aktif { border-left-color: #2ecc71; }
        .mesin-item.mati { border-left-color: #e74c3c; }
        .mesin-info strong { font-size: 1.1rem; color: #2c3e50; display: block; margin-bottom: 4px; }
        .mesin-info span { font-size: 0.9rem; color: #7f8c8d; }
        .mesin-actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; margin-left: 8px; }
        .badge-aktif { background: #d5f5e3; color: #27ae60; }
        .badge-mati { background: #fadbd8; color: #c0392b; }

        .btn-on { background: #2ecc71; color: white; padding: 8px 14px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
        .btn-on:hover { background: #27ae60; }
        .btn-off { background: #f1c40f; color: #333; padding: 8px 14px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
        .btn-off:hover { background: #f39c12; }
        .btn-edit { background: #3498db; color: white; padding: 8px 14px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
        .btn-edit:hover { background: #2980b9; }
        .btn-delete { background: #e74c3c; color: white; padding: 8px 14px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
        .btn-delete:hover { background: #c0392b; }
        .btn-add { background: #2ecc71; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.9rem; transition: 0.2s; }
        .btn-add:hover { background: #27ae60; }
        .btn-export { background: #8e44ad; color: white; padding: 10px 18px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.95rem; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
        .btn-export:hover { background: #6c3483; }
        .btn-export:disabled { background: #bdc3c7; cursor: not-allowed; }

        .monitor-filter { display: flex; gap: 10px; align-items: center; margin-bottom: 15px; flex-wrap: wrap; }
        .monitor-filter label { font-size: 0.9rem; color: #7f8c8d; font-weight: 600; }
        .select-filter { padding: 7px 10px; border: 1px solid #dcdde1; border-radius: 6px; font-size: 0.9rem; color: #2c3e50; outline: none; cursor: pointer; background: white; }
        .select-filter:focus { border-color: #3498db; }
        .select-max { padding: 7px 10px; border: 1px solid #dcdde1; border-radius: 6px; font-size: 0.9rem; color: #2c3e50; outline: none; cursor: pointer; background: white; width: 80px; }

        .sensor-item { padding: 15px 0; border-bottom: 1px dashed #dcdde1; font-size: 0.95rem; }
        .sensor-item:last-child { border-bottom: none; }
        .sensor-meta { display: flex; justify-content: space-between; color: #7f8c8d; font-size: 0.85rem; margin-bottom: 8px; flex-wrap: wrap; gap: 4px; }
        .sensor-mesin-tag { background: #eaf2fb; color: #2980b9; font-size: 0.8rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
        .sensor-data { display: flex; justify-content: space-between; background: white; padding: 10px; border-radius: 6px; border: 1px solid #e1e8ed; flex-wrap: wrap; gap: 8px; }
        .highlight { font-weight: bold; color: #3498db; }
        .highlight-error { font-weight: bold; color: #e74c3c; }

        .report-section { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-top: 5px solid #9b59b6; }
        .report-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }
        .report-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .date-picker { padding: 10px; border: 1px solid #dcdde1; border-radius: 8px; font-family: inherit; font-size: 1rem; color: #2c3e50; cursor: pointer; outline: none; transition: border-color 0.2s; }
        .date-picker:focus { border-color: #9b59b6; }

        .table-responsive { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 700px; }
        th { background: #f8f9fa; color: #2c3e50; padding: 13px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid #e1e8ed; font-size: 0.95rem; }
        td { padding: 13px 15px; border-bottom: 1px solid #e1e8ed; color: #555; vertical-align: middle; }
        tr:hover td { background-color: #fcfcfc; }
        .text-center { text-align: center; }

        .waktu-jam { font-size: 0.85rem; color: #8e44ad; font-weight: 600; margin-top: 2px; display: block; }
        .shift-badge { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 0.78rem; font-weight: 600; margin-top: 4px; }
        .shift-pagi { background: #fef9e7; color: #d4ac0d; }
        .shift-siang { background: #fef5e4; color: #e67e22; }
        .shift-malam { background: #eaf0fb; color: #2e86c1; }
        .mesin-tag { font-weight: 600; color: #2c3e50; }
        .error-cell { color: #e74c3c; font-weight: bold; }
        .error-cell.ok { color: #27ae60; font-weight: normal; }

        .empty-state { text-align: center; color: #95a5a6; padding: 30px 0; font-style: italic; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-box { background: white; border-radius: 12px; padding: 30px; width: 100%; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .modal-box h3 { margin-top: 0; margin-bottom: 20px; color: #2c3e50; font-size: 1.3rem; }
        .modal-field { margin-bottom: 16px; }
        .modal-field label { display: block; font-weight: 600; margin-bottom: 6px; color: #34495e; font-size: 0.95rem; }
        .modal-field input { width: 100%; padding: 10px 12px; border: 1px solid #dcdde1; border-radius: 8px; font-size: 1rem; font-family: inherit; outline: none; transition: border-color 0.2s; }
        .modal-field input:focus { border-color: #3498db; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
        .btn-cancel { background: #ecf0f1; color: #555; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.95rem; }
        .btn-cancel:hover { background: #dfe6e9; }
        .btn-save { background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.95rem; }
        .btn-save:hover { background: #2980b9; }

        @media (max-width: 768px) {
          .header { flex-direction: column; align-items: flex-start; }
          .report-header { flex-direction: column; align-items: flex-start; }
          .sensor-data { flex-direction: column; gap: 6px; }
          .mesin-actions { flex-direction: column; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="header">
        <h1>Dashboard</h1>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Keluar
        </button>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid-container">
        {/* Card Manajemen Mesin */}
        <div className="card card-green">
          <div className="mesin-card-header">
            <h2>Manajemen Mesin</h2>
            <button
              className="btn-add"
              onClick={() => {
                setIsEditMode(false);
                setFormData({ id: "", namaMesin: "", tipeMesin: "" });
                setIsModalOpen(true);
              }}
            >
              + Tambah Mesin
            </button>
          </div>

          {daftarMesin.length === 0 ? (
            <div className="empty-state">Belum ada mesin terdaftar.</div>
          ) : (
            <ul className="list-unstyled">
              {daftarMesin.map((m) => (
                <li
                  key={m.id}
                  className={`mesin-item ${m.statusAktif ? "aktif" : "mati"}`}
                >
                  <div className="mesin-info">
                    <strong>
                      {m.namaMesin}
                      <span
                        className={`badge ${m.statusAktif ? "badge-aktif" : "badge-mati"}`}
                      >
                        {m.statusAktif ? "Aktif" : "Mati"}
                      </span>
                    </strong>
                    <span>{m.tipeMesin}</span>
                  </div>
                  <div className="mesin-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {
                        setIsEditMode(true);
                        setFormData({
                          id: m.id,
                          namaMesin: m.namaMesin,
                          tipeMesin: m.tipeMesin,
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className={m.statusAktif ? "btn-off" : "btn-on"}
                      onClick={() => handleToggleStatus(m.id, m.statusAktif)}
                    >
                      {m.statusAktif ? "Matikan" : "Aktifkan"}
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteMesin(m.id, m.namaMesin)}
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Card Monitoring Produksi */}
        <div className="card card-blue">
          <h2 className="card-header-title">Monitoring Produksi</h2>

          <div className="monitor-filter">
            <label>Filter Mesin:</label>
            <select
              className="select-filter"
              value={filterMesinId}
              onChange={(e) => setFilterMesinId(e.target.value)}
            >
              <option value="semua">Semua Mesin</option>
              {daftarMesin.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.namaMesin}
                </option>
              ))}
            </select>
            <label>Tampil:</label>
            <select
              className="select-max"
              value={maxLog}
              onChange={(e) => setMaxLog(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {logTerfilter.length === 0 ? (
            <div className="empty-state">
              {logRealTime.length === 0
                ? "Menunggu transmisi data dari mesin..."
                : "Tidak ada log untuk mesin ini."}
            </div>
          ) : (
            <ul className="list-unstyled">
              {logTerfilter.slice(0, maxLog).map((log, index) => {
                const namaMesin =
                  daftarMesin.find((m) => m.id === log.idMesin)?.namaMesin ??
                  log.idMesin;
                return (
                  <li key={index} className="sensor-item">
                    <div className="sensor-meta">
                      <span>
                        ⏱{" "}
                        {new Date(log.waktuPencatatan).toLocaleString("id-ID", {
                          dateStyle: "short",
                          timeStyle: "medium",
                        })}
                      </span>
                      <span className="sensor-mesin-tag">{namaMesin}</span>
                      <span>👷 {log.namaOperator}</span>
                    </div>
                    <div className="sensor-data">
                      <div>
                        Status: <strong>{log.statusMesin}</strong>
                      </div>
                      <div>
                        Produksi:{" "}
                        <span className="highlight">
                          {log.jumlahBarang} unit
                        </span>
                      </div>
                      <div>
                        Suhu:{" "}
                        <span className="highlight">{log.temperatur}°C</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Laporan Produksi ── */}
      <div className="report-section">
        <div className="report-header">
          <h2
            className="card-header-title"
            style={{ border: "none", margin: 0, padding: 0 }}
          >
            Laporan Produksi
          </h2>
          <div className="report-controls">
            <div>
              <label
                style={{
                  marginRight: "10px",
                  fontWeight: "600",
                  color: "#2c3e50",
                }}
              >
                Pilih Tanggal:
              </label>
              <input
                type="date"
                className="date-picker"
                value={tanggalLaporan}
                onChange={(e) => setTanggalLaporan(e.target.value)}
              />
            </div>
            <button
              className="btn-export"
              onClick={() => exportCSV(laporan, tanggalLaporan)}
              disabled={laporan.length === 0}
            >
              ⬇️ Export CSV
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Nama Mesin</th>
                <th>Tanggal</th>
                <th>Jam Mulai</th>
                <th>Shift</th>
                <th className="text-center">Total Produksi (Unit)</th>
                <th className="text-center">Rata-rata Suhu (°C)</th>
                <th className="text-center">Total Error</th>
              </tr>
            </thead>
            <tbody>
              {laporan.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="empty-state"
                    style={{ borderBottom: "none" }}
                  >
                    Tidak ada rekapitulasi data untuk tanggal ini.
                  </td>
                </tr>
              ) : (
                laporan.map((item, index) => {
                  const { tanggal, jam } = formatWaktuBucket(item.waktuBucket);
                  const shift = getLabelShift(item.waktuBucket);
                  const shiftClass =
                    shift === "Shift Pagi"
                      ? "shift-pagi"
                      : shift === "Shift Siang"
                        ? "shift-siang"
                        : "shift-malam";
                  return (
                    <tr key={index}>
                      <td>
                        <span className="mesin-tag">{item.namaMesin}</span>
                      </td>
                      <td>{tanggal}</td>
                      <td>
                        {jam ? (
                          <span className="waktu-jam">{jam}</span>
                        ) : (
                          <span style={{ color: "#bdc3c7" }}>—</span>
                        )}
                      </td>
                      <td>
                        {shift ? (
                          <span className={`shift-badge ${shiftClass}`}>
                            {shift}
                          </span>
                        ) : (
                          <span style={{ color: "#bdc3c7" }}>—</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span
                          className="highlight"
                          style={{ fontSize: "1.1rem" }}
                        >
                          {item.totalProduksi}
                        </span>
                      </td>
                      <td className="text-center">
                        {item.rataRataSuhu
                          ? item.rataRataSuhu.toFixed(2)
                          : "0.00"}
                        °C
                      </td>
                      <td className="text-center">
                        <span
                          className={
                            item.totalError > 0 ? "error-cell" : "error-cell ok"
                          }
                        >
                          {item.totalError > 0 ? ` ${item.totalError}` : "✓ 0"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Tambah / Edit Mesin ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{isEditMode ? "✏️ Edit Mesin" : "➕ Tambah Mesin Baru"}</h3>

            <div className="modal-field">
              <label>Nama Mesin</label>
              <input
                type="text"
                placeholder="Contoh: Mesin Press A"
                value={formData.namaMesin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    namaMesin: e.target.value,
                  }))
                }
              />
            </div>

            <div className="modal-field">
              <label>Tipe Mesin</label>
              <input
                type="text"
                placeholder="Contoh: Hydraulic Press"
                value={formData.tipeMesin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipeMesin: e.target.value,
                  }))
                }
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setIsModalOpen(false)}
              >
                Batal
              </button>
              <button className="btn-save" onClick={handleSaveMesin}>
                {isEditMode ? "Simpan Perubahan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
