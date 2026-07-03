using be_eid_techinicaltest.Application.Interfaces;
using be_eid_techinicaltest.Domain;
using Npgsql;
using Dapper;
using Microsoft.Extensions.Configuration;

namespace be_eid_techinicaltest.Infrastructure.Repositories
{
    public class MesinRepository : IMesinRepository
    {
        private readonly string _connectionString;

        public MesinRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<IEnumerable<Mesin>> GetAllMesinAsync()
        {
            using var connection = new NpgsqlConnection(_connectionString);
            var sql = "SELECT id, nama_mesin AS NamaMesin, tipe_mesin AS TipeMesin, status_aktif AS StatusAktif FROM mesin";
            return await connection.QueryAsync<Mesin>(sql);
        }

        public async Task<Mesin?> GetMesinByIdAsync(Guid id)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            var sql = "SELECT id, nama_mesin AS NamaMesin, tipe_mesin AS TipeMesin, status_aktif AS StatusAktif FROM mesin WHERE id = @Id";
            return await connection.QueryFirstOrDefaultAsync<Mesin>(sql, new { Id = id });
        }

        public async Task<int> AddMesinAsync(Mesin mesin)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            var sql = @"INSERT INTO mesin (id, nama_mesin, tipe_mesin, status_aktif) 
                        VALUES (@Id, @NamaMesin, @TipeMesin, @StatusAktif)";
            return await connection.ExecuteAsync(sql, mesin);
        }

        public async Task<int> UpdateStatusMesinAsync(Guid id, bool statusAktif)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            var sql = "UPDATE mesin SET status_aktif = @StatusAktif WHERE id = @Id";
            return await connection.ExecuteAsync(sql, new { Id = id, StatusAktif = statusAktif });
        }

        public async Task<int> UpdateMesinAsync(Mesin mesin)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            var sql = @"UPDATE mesin 
                SET nama_mesin = @NamaMesin, 
                    tipe_mesin = @TipeMesin 
                WHERE id = @Id";
            return await connection.ExecuteAsync(sql, mesin);
        }

        public async Task<int> DeleteMesinAsync(Guid id)
        {
            using var connection = new NpgsqlConnection(_connectionString);
            var sql = "DELETE FROM mesin WHERE id = @Id";
            return await connection.ExecuteAsync(sql, new { Id = id });
        }
    }
}
