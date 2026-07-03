using be_eid_techinicaltest.Application.Interfaces;
using be_eid_techinicaltest.Domain;
using be_eid_techinicaltest.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace be_eid_techinicaltest.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogProduksiController : ControllerBase
    {
        private readonly ILogProduksiRepository _repo;
        private readonly IHubContext<ProduksiHub> _hubContext;

        // Dependency Injection untuk Database dan SignalR
        public LogProduksiController(ILogProduksiRepository repo, IHubContext<ProduksiHub> hubContext)
        {
            _repo = repo;
            _hubContext = hubContext;
        }

        // Endpoint 1: Menerima tembakan data dari mesin pabrik (misal IoT)
        [HttpPost("sensor")]
        public async Task<IActionResult> TerimaDataMesin([FromBody] LogProduksi log)
        {
            // 1. Lengkapi data dan simpan ke database (TimescaleDB)
            log.Id = Guid.NewGuid();
            log.WaktuPencatatan = DateTime.UtcNow;
            await _repo.InsertLogAsync(log);

            // 2. Broadcast (Siarkan) data terbaru ke semua layar React yang sedang terbuka
            await _hubContext.Clients.All.SendAsync("TerimaUpdateProduksi", log);

            return Ok(new { message = "Data tercatat dan disiarkan ke Dashboard." });
        }

        // Endpoint 2: Mengambil rekap data untuk digambar menjadi grafik di React
        [Authorize] // Wajib punya Token JWT untuk bisa melihat laporan
        [HttpGet("laporan")]
        public async Task<IActionResult> GetLaporanHarian([FromQuery] DateTime tanggal)
        {
            var laporan = await _repo.GetLaporanPerShiftAsync(tanggal);
            return Ok(laporan);
        }
    }
}