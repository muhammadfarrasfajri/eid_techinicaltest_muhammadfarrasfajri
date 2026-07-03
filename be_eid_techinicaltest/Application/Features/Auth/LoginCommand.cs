using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using be_eid_techinicaltest.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace be_eid_techinicaltest.Application.Features.Auth
{
    public class LoginCommand : IRequest<string?>
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // 2. Sang Eksekutor Login
    public class LoginCommandHandler : IRequestHandler<LoginCommand, string?>
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;

        public LoginCommandHandler(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration;
        }

        public async Task<string?> Handle(LoginCommand request, CancellationToken cancellationToken)
        {

            var user = await _userRepository.GetUserByUsernameAsync(request.Username);

            // Catatan: Di dunia nyata, gunakan BCrypt.Verify() di sini. 
            // Untuk tes, kita anggap password cocok jika sama persis.
            if (user == null || user.PasswordHash != request.Password)
            {
                return null; // Login gagal
            }

            // Merakit JWT Token
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(8), // Sesi berlaku 1 shift (8 jam)
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
