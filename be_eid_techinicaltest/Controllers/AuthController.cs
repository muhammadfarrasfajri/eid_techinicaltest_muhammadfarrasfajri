using be_eid_techinicaltest.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace be_eid_techinicaltest.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginCommand command)
        {
            var token = await _mediator.Send(command);

            if (token == null)
            {
                return Unauthorized(new { message = "Username atau Password salah." });
            }

            // Memasukkan Token ke dalam HTTP-Only Cookie yang aman
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Pastikan true jika menggunakan HTTPS
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(8)
            };

            Response.Cookies.Append("jwtToken", token, cookieOptions);

            return Ok(new { message = "Login berhasil." });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Memerintahkan browser untuk menghapus cookie 'jwtToken'
            Response.Cookies.Delete("jwtToken");

            return Ok(new { message = "Logout berhasil" });
        }
    }
}
