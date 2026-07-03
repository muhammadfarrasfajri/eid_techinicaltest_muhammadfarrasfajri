using be_eid_techinicaltest.Domain;

namespace be_eid_techinicaltest.Application.Interfaces
{
    public interface ILogProduksiRepository
    {
        // Untuk menerima tembakan data dari mesin
        Task<int> InsertLogAsync(LogProduksi log);

        // Untuk ditarik oleh React menjadi grafik laporan
        Task<IEnumerable<RekapProduksiDto>> GetLaporanPerShiftAsync(DateTime tanggal);
    }

    // Objek penampung khusus untuk hasil laporan
    public class RekapProduksiDto
    {
        public string NamaMesin { get; set; } = string.Empty;

        public DateTime WaktuBucket { get; set; }
        public int TotalProduksi { get; set; }
        public decimal RataRataSuhu { get; set; }
        public int TotalError { get; set; }
    }
}
