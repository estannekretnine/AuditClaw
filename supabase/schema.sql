-- =============================================
-- AuditClaw Database Schema
-- =============================================

-- Kreiranje tabele korisnici
CREATE TABLE IF NOT EXISTS korisnici (
  id SERIAL PRIMARY KEY,
  naziv VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  brojmob VARCHAR(50),
  adresa TEXT,
  stsstatus VARCHAR(50) DEFAULT 'admin' CHECK (stsstatus IN ('admin', 'agent', 'user')),
  stsaktivan VARCHAR(10) DEFAULT 'da' CHECK (stsaktivan IN ('da', 'ne')),
  datumk TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  datumpt TIMESTAMP WITH TIME ZONE
);

-- Kreiranje indeksa za brže pretrage
CREATE INDEX IF NOT EXISTS idx_korisnici_email ON korisnici(email);
CREATE INDEX IF NOT EXISTS idx_korisnici_stsstatus ON korisnici(stsstatus);
CREATE INDEX IF NOT EXISTS idx_korisnici_stsaktivan ON korisnici(stsaktivan);

-- RLS (Row Level Security) politike
-- Omogući RLS na tabeli
ALTER TABLE korisnici ENABLE ROW LEVEL SECURITY;

-- Politika za čitanje - svi mogu čitati
CREATE POLICY "Allow public read access" ON korisnici
  FOR SELECT
  USING (true);

-- Politika za insert - svi mogu dodavati
CREATE POLICY "Allow public insert access" ON korisnici
  FOR INSERT
  WITH CHECK (true);

-- Politika za update - svi mogu ažurirati
CREATE POLICY "Allow public update access" ON korisnici
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Politika za delete - svi mogu brisati
CREATE POLICY "Allow public delete access" ON korisnici
  FOR DELETE
  USING (true);

-- =============================================
-- Seed Data - Admin korisnik
-- =============================================

-- Dodaj admin korisnika (promenite email i password po potrebi)
INSERT INTO korisnici (naziv, email, password, stsstatus, stsaktivan)
VALUES ('Administrator', 'admin@auditclaw.com', 'admin123', 'admin', 'da')
ON CONFLICT (email) DO NOTHING;
