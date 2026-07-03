namespace be_eid_techinicaltest.Domain
{
    public class Mesin
    {
        public Guid Id { get; set; }
        public string NamaMesin { get; set; } = string.Empty;
        public string TipeMesin { get; set; } = string.Empty; // CNC, Milling, dll
        public bool StatusAktif { get; set; }
    }
}
