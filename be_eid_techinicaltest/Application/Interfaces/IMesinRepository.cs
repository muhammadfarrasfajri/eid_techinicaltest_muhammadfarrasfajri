using be_eid_techinicaltest.Domain;

namespace be_eid_techinicaltest.Application.Interfaces
{
    public interface IMesinRepository
    {
        Task<IEnumerable<Mesin>> GetAllMesinAsync();
        Task<Mesin?> GetMesinByIdAsync(Guid id);
        Task<int> AddMesinAsync(Mesin mesin);
        Task<int> UpdateStatusMesinAsync(Guid id, bool statusAktif);
        Task<int> UpdateMesinAsync(Mesin mesin);
        Task<int> DeleteMesinAsync(Guid id);
    }
}
