namespace be_eid_techinicaltest.Domain
{
    public class LogProduksi
    {
        public Guid Id { get; set; }
        public Guid IdMesin { get; set; }
        public int JumlahBarang { get; set; }
        public string StatusMesin { get; set; } = string.Empty;
        public decimal Temperatur { get; set; }
        public string NamaOperator { get; set; } = string.Empty;
        public DateTime WaktuPencatatan { get; set; }
    }
}
