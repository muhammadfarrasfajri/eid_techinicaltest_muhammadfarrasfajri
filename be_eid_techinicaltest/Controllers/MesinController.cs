using be_eid_techinicaltest.Application.Interfaces;
using be_eid_techinicaltest.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace be_eid_techinicaltest.Controllers
{
    [Authorize] // Wajib login (punya token JWT) untuk bisa mengelola mesin
    [ApiController]
    [Route("api/[controller]")]
    public class MesinController : ControllerBase
    {
        private readonly IMesinRepository _repo;

        public MesinController(IMesinRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllMesin()
        {
            var data = await _repo.GetAllMesinAsync();
            return Ok(data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMesinById(Guid id)
        {
            var data = await _repo.GetMesinByIdAsync(id);
            if (data == null) return NotFound(new { message = "Mesin tidak ditemukan" });
            return Ok(data);
        }

        [HttpPost]
        public async Task<IActionResult> TambahMesin([FromBody] Mesin mesin)
        {
            mesin.Id = Guid.NewGuid();
            mesin.StatusAktif = true; // Mesin baru default-nya aktif

            await _repo.AddMesinAsync(mesin);
            return CreatedAtAction(nameof(GetMesinById), new { id = mesin.Id }, mesin);
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto request)
        {
            await _repo.UpdateStatusMesinAsync(id, request.StatusAktif);
            return Ok(new { message = "Status mesin berhasil diperbarui" });
        }

        // Tambahkan ini untuk Edit Nama dan Tipe Mesin
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMesin(Guid id, [FromBody] Mesin mesin)
        {
            // Pastikan ID yang dikirim lewat URL sama dengan ID di body
            var existingMesin = await _repo.GetMesinByIdAsync(id);
            if (existingMesin == null) return NotFound(new { message = "Mesin tidak ditemukan" });

            mesin.Id = id;
            await _repo.UpdateMesinAsync(mesin);
            return Ok(new { message = "Data mesin berhasil diperbarui" });
        }

        // Tambahkan ini untuk Hapus Mesin
    
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMesin(Guid id)
        {
            try
            {
                await _repo.DeleteMesinAsync(id);
                return Ok(new { message = "Mesin berhasil dihapus" });
            }
            catch (PostgresException ex) when (ex.SqlState == "23503")
            {
                // Menangkap error Foreign Key Violation secara spesifik
                return Conflict(new
                {
                    error = true,
                    message = "Gagal menghapus: Mesin ini tidak bisa dihapus karena masih memiliki riwayat data produksi yang terikat."
                });
            }
            catch (Exception ex)
            {
                // Menangkap error lain yang tidak terduga
                return StatusCode(500, new { message = "Terjadi kesalahan internal pada server." });
            }
        }
    }

    public class UpdateStatusDto
    {
        public bool StatusAktif { get; set; }
    }
}