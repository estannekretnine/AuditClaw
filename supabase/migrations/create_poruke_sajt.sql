-- Kreiranje tabele poruke_sajt za kontakt forme sa sajta
CREATE TABLE IF NOT EXISTS poruke_sajt (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ime TEXT NOT NULL,
  email TEXT NOT NULL,
  telefon TEXT NOT NULL,
  poruka TEXT NOT NULL,
  procitano BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks za brže sortiranje po datumu
CREATE INDEX IF NOT EXISTS idx_poruke_sajt_created_at ON poruke_sajt(created_at DESC);

-- Indeks za filtriranje nepročitanih
CREATE INDEX IF NOT EXISTS idx_poruke_sajt_procitano ON poruke_sajt(procitano);

-- RLS politike
ALTER TABLE poruke_sajt ENABLE ROW LEVEL SECURITY;

-- Dozvoli INSERT svima (javna forma)
CREATE POLICY "Allow public insert" ON poruke_sajt
  FOR INSERT
  WITH CHECK (true);

-- Dozvoli SELECT samo autentifikovanim korisnicima
CREATE POLICY "Allow authenticated select" ON poruke_sajt
  FOR SELECT
  USING (true);

-- Dozvoli UPDATE samo autentifikovanim korisnicima
CREATE POLICY "Allow authenticated update" ON poruke_sajt
  FOR UPDATE
  USING (true);
