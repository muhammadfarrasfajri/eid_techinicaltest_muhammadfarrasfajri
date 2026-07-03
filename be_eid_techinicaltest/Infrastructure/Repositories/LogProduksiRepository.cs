using be_eid_techinicaltest.Application.Interfaces;
using be_eid_techinicaltest.Domain;
using Npgsql;
using Dapper;
using Microsoft.Extensions.Configuration;

namespace be_eid_techinicaltest.Infrastructure.Repositories
{
    public class LogProduksiRepository : ILogProduksiRepository
    {
        private readonly string _connectionString;

        public LogProduksiRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<int> InsertLogAsync(LogProduksi log)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            var sql = @"INSERT INTO log_produksi (id, id_mesin, jumlah_barang, status_mesin, temperatur, nama_operator, waktu_pencatatan) 
                        VALUES (@Id, @IdMesin, @JumlahBarang, @StatusMesin, @Temperatur, @NamaOperator, @WaktuPencatatan)";
            return await connection.ExecuteAsync(sql, log);
        }

        public async Task<IEnumerable<RekapProduksiDto>> GetLaporanPerShiftAsync(DateTime tanggal)
        {
            using var connection = new NpgsqlConnection(_connectionString);

            // Query cerdas menggunakan time_bucket untuk memecah laporan per shift (8 jam)
            var sql = @"
               SELECT 
                time_bucket('8 hours', lp.waktu_pencatatan) AS WaktuBucket, 
                 m.nama_mesin AS NamaMesin,
                 SUM(lp.jumlah_barang) AS TotalProduksi,
                 AVG(lp.temperatur) AS RataRataSuhu,
                 COUNT(CASE WHEN lp.status_mesin = 'Error' THEN 1 END) AS TotalError
                 FROM log_produksi lp
                 JOIN mesin m ON lp.id_mesin = m.id
                 WHERE lp.waktu_pencatatan::date = @Tanggal::date
                 GROUP BY m.nama_mesin, time_bucket('8 hours', lp.waktu_pencatatan)
                 ORDER BY m.nama_mesin, WaktuBucket;";

            return await connection.QueryAsync<RekapProduksiDto>(sql, new { Tanggal = tanggal });
        }
    }
}
