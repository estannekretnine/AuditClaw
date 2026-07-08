-- Seed: medicinska oprema (idempotentno po nazivu)
-- Pokreni u Supabase SQL Editoru posle kreiranja tabele vapi_medicinskaoprema.

INSERT INTO public.vapi_medicinskaoprema (naziv, namena)
SELECT v.naziv, v.namena
FROM (
  VALUES
    -- Vitalni znaci (mapiraju se na Započni UI)
    ('Aparat za pritisak', 'Merenje sistolnog i dijastolnog krvnog pritiska (mmHg)'),
    ('Monitor pulsa', 'Merenje srčane frekvencije (bpm)'),
    ('Termometar', 'Merenje telesne temperature (°C)'),
    ('Pulsni oksimetar', 'Merenje saturacije kiseonika SpO2 (%)'),
    ('Glukometar', 'Merenje nivoa šećera / glukoze u krvi (mmol/L)'),

    -- Dodatna medicinska oprema za trening / simulacije
    ('Stetoskop', 'Auskultacija srca i pluća'),
    ('Fonendoskop', 'Auskultacija sa bočnim zvoncem'),
    ('Infuzomat', 'Kontrolisana infuzija leka ili tečnosti'),
    ('Perfusor', 'Tačna injekcija lekova špric pumpom'),
    ('Elektrokardiograf (EKG)', 'Snimanje električne aktivnosti srca'),
    ('Defibrilator', 'Električna defibrilacija kod srčanog zastoja'),
    ('AED (automatski defibrilator)', 'Automatski analizator ritma i defibrilacija'),
    ('Neulizator', 'Inhalaciona terapija aerosolom'),
    ('Respirator', 'Veštačka ventilacija disajnih puteva'),
    ('Ambu balon', 'Ručna ventilacija pacijenta'),
    ('Laringoskop', 'Vizuelizacija grkljana pri intubaciji'),
    ('Endotrahealni tubus', 'Obezbeđivanje disajnog puta'),
    ('Sukcioni aparat', 'Aspiracija sekreta iz disajnih puteva'),
    ('Portabilni monitor vitalnih znakova', 'Kontinuirani nadzor pritiska, pulsa i SpO2'),
    ('Kapnograf', 'Merenje EtCO2 tokom ventilacije'),
    ('Spirometar', 'Procena plućne funkcije'),
    ('Peak flow metar', 'Merenje maksimalnog protoka vazduha'),
    ('Otodoskop', 'Pregled uva'),
    ('Oftalmoskop', 'Pregled očne pozadine'),
    ('Refleksni čekić', 'Testiranje neuroloških refleksa'),
    ('Tunika za pritisak / tonometar', 'Manometer deo aparata za pritisak'),
    ('Staza (turnike)', 'Privremeno zaustavljanje krvarenja / venepunkcija'),
    ('Kompresioni zavoj', 'Zaustavljanje lokalnog krvarenja'),
    ('Sterilni set za šivanje', 'Zbrinjavanje manjih rana'),
    ('Set za kateterizaciju', 'Postavljanje mokraćnog katetera'),
    ('Urinarni kateter', 'Drenaža mokraće'),
    ('Infuziona stolica / stalak', 'Držanje i doziranje infuzije'),
    ('Špricevi raznih volumena', 'Aplikacija lekova i vađenje krvi'),
    ('Igla za intramuskularnu aplikaciju', 'IM aplikacija lekova'),
    ('Kanila za perifernu venu', 'Venozni pristup'),
    ('Centralni venski kateter (CVK)', 'Centralni venski pristup'),
    ('Kiseonička maska', 'Dostava kiseonika pacijentu'),
    ('Nazalne kiseonične kanile', 'Niski protok kiseonika'),
    ('Venturi maska', 'Precizan procenat FiO2'),
    ('Nosile / kolica za transport', 'Transport pacijenta u hitnoj pomoći'),
    ('Imobilizaciona daska', 'Imobilizacija kičme'),
    ('Cervikalna kragna', 'Imobilizacija vratnog dela kičme'),
    ('Vacumatras / vakuum madrac', 'Imobilizacija ekstremiteta i tela'),
    ('Hladna/topla obloga set', 'Lokalna termoterapija'),
    ('Ultrazvučni aparat (point-of-care)', 'Brza dijagnostika na terenu'),
    ('Holter EKG', '24h praćenje srčanog ritma'),
    ('Holter pritiska (ABPM)', '24h praćenje krvnog pritiska'),
    ('Alkometer / etilotest', 'Procena alkoholne intoxikacije'),
    ('Pulse oksimetar pedijatrijski', 'SpO2 merenje kod dece'),
    ('Pedijatrijski aparat za pritisak', 'Merenje pritiska sa manžetom za decu'),
    ('Termometar bezkontaktni', 'Brzo merenje temperature bez kontakta'),
    ('Inhalator sa kompresorom', 'Nebulizaciona terapija'),
    ('Glukoza metersi test trake set', 'Brzi test šećera u krvi'),
    ('Hemoglobinometar', 'Brzo merenje hemoglobina'),
    ('INR analizator (poct)', 'Brza koagulacija / INR na terenu'),
    ('Hidracioni set', 'Oralna / intravenozna hidracija'),
    ('Antišok set', 'Hitna intervencija kod anafilaksije'),
    ('Torba hitne pomoći', 'Kompletan set za prvu pomoć')
) AS v(naziv, namena)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.vapi_medicinskaoprema existing
  WHERE lower(existing.naziv) = lower(v.naziv)
);

-- Opciono: poveži SVE opreme sa JEDNIM asistentom (zameni 123 ID asistenta)
-- INSERT INTO public.vapi_assistanmedoprema (assistantid, medopremaid)
-- SELECT 123, o.id
-- FROM public.vapi_medicinskaoprema o
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public.vapi_assistanmedoprema l
--   WHERE l.assistantid = 123 AND l.medopremaid = o.id
-- );

-- Opciono: seed 2 SystemPrompt-a za istog asistenta (zameni 123)
-- INSERT INTO public."vapi_SystemPrompt" ("SystemPrompt Vapi", assistantid)
-- SELECT t.prompt, 123
-- FROM (
--   VALUES
--     ('Ti si medicinski asistent. Usmeri učenika da meri vitalne znake jedan po jedan.'),
--     ('Ti si strogi mentor. Zahtevaj jasne komande: „izmeri pritisak“, „izmeri puls“, itd.')
-- ) AS t(prompt)
-- WHERE NOT EXISTS (
--   SELECT 1 FROM public."vapi_SystemPrompt" p
--   WHERE p.assistantid = 123 AND p."SystemPrompt Vapi" = t.prompt
-- );

NOTIFY pgrst, 'reload schema';
