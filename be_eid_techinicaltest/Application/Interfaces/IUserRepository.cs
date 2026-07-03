using be_eid_techinicaltest.Domain;

namespace be_eid_techinicaltest.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetUserByUsernameAsync(string username);
    }
    
}
