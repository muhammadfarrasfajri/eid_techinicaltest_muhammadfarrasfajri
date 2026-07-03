using Dapper;
using Npgsql;
using Microsoft.Extensions.Configuration;
using be_eid_techinicaltest.Application.Interfaces;
using be_eid_techinicaltest.Domain;

namespace be_eid_techinicaltest.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly string _connectionString;

        public UserRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")!;
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            using var connection = new NpgsqlConnection(_connectionString);

            // Gunakan alias AS agar Dapper otomatis memetakan ke PascalCase C#
            var sql = @"SELECT id, 
                               username, 
                               password_hash AS PasswordHash, 
                               role, 
                               created_at AS CreatedAt 
                        FROM users 
                        WHERE username = @Username";

            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Username = username });
        }
    }
}
