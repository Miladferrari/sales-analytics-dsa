# 🎯 Fathom.ai Koppeling Setup Guide

Complete gids voor het koppelen van 16 medewerkers met elk hun eigen Fathom.ai account.

---

## 📋 Overzicht

**Setup:**
- 16 sales reps
- Elk met eigen Zoom account
- Elk met eigen Fathom.ai account
- 1 centraal CRM dashboard

**Hoe het werkt:**
1. Medewerker doet sales call via Zoom
2. Fathom.ai neemt op en transcribeert automatisch
3. Fathom stuurt webhook naar jouw CRM
4. CRM matcht email → sales rep → slaat call op
5. OpenAI analyseert automatisch
6. Resultaat zichtbaar in dashboard

---

## 🚀 STAP 1: Medewerkers Toevoegen aan CRM

### Optie A: Via CSV (Aanbevolen voor 16 medewerkers)

1. **Edit het CSV template:**
   ```bash
   open data/sales-reps-template.csv
   ```

2. **Vul in met echte data:**
   ```csv
   name,email,telegram_id,qualification_status
   Sarah Johnson,sarah@jouwbedrijf.com,@sarah_j,qualified
   Michael Chen,michael@jouwbedrijf.com,,qualified
   ...
   ```

   **Let op:** Het `email` veld MOET exact overeenkomen met:
   - ✅ Het email adres in hun Zoom account
   - ✅ Het email adres in hun Fathom.ai account

3. **Rename het bestand:**
   ```bash
   cp data/sales-reps-template.csv data/sales-reps.csv
   ```

4. **Run de import:**
   ```bash
   node scripts/bulk-import-sales-reps.js
   ```

### Optie B: Handmatig in het script

1. Open: `scripts/bulk-import-sales-reps.js`
2. Edit de `SALES_REPS` array (regel 28)
3. Run: `node scripts/bulk-import-sales-reps.js`

---

## 🔌 STAP 2: Deploy je App (Maak het publiek toegankelijk)

Fathom moet jouw webhook kunnen bereiken. Lokaal (localhost:3000) werkt NIET.

### Optie 1: Vercel (Aanbevolen - Gratis)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Je krijgt een URL zoals:
# https://jouw-app.vercel.app
```

### Optie 2: Railway / Render / DigitalOcean

Volg hun deployment guides voor Next.js apps.

**Belangrijke environment variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FATHOM_WEBHOOK_SECRET` (optioneel maar aanbevolen)

---

## 🎣 STAP 3: Fathom Webhook Instellen (PER MEDEWERKER)

**Belangrijk:** Elke medewerker moet dit doen in hun eigen Fathom account!

### Voor Medewerker 1 (bijv. Sarah):

1. **Login in Fathom.ai**
   - Ga naar: https://app.fathom.video
   - Login met Sarah's account

2. **Ga naar Settings → Integrations → Webhooks**
   - Klik op "Add Webhook"

3. **Configureer webhook:**
   ```
   Webhook URL: https://jouw-app.vercel.app/api/webhooks/fathom
   Events: ✅ Call Completed
   Secret: [genereer een random string of laat leeg]
   ```

4. **Test de webhook:**
   - Fathom heeft een "Test" knop
   - Je zou een groene checkmark moeten zien

5. **Save**

### Herhaal voor Medewerker 2-16:

- Elke medewerker logt in op hun eigen Fathom
- Voegt dezelfde webhook URL toe
- **Gebruikt dezelfde URL voor iedereen!**

**Waarom werkt dit?**
- Fathom stuurt de participant emails mee in de webhook
- Jouw app matcht die emails met de `sales_reps` tabel
- Automatisch gekoppeld aan de juiste medewerker!

---

## 🧪 STAP 4: Testen

### Test met echte call:

1. **Medewerker doet test call:**
   - Start Zoom meeting
   - Nodig iemand uit
   - Fathom neemt op (je ziet de bot in de call)
   - Beëindig de call

2. **Wacht 2-5 minuten:**
   - Fathom verwerkt de opname
   - Stuurt webhook naar jouw app

3. **Check het dashboard:**
   - Ga naar: https://jouw-app.vercel.app/dashboard/team
   - Je zou de call moeten zien met:
     - ✅ Transcript
     - ✅ Analysis scores
     - ✅ Gekoppeld aan de juiste sales rep

### Debug als het niet werkt:

**Check webhook logs:**
```sql
-- In Supabase SQL Editor:
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Check unmatched calls:**
```sql
SELECT * FROM unmatched_fathom_calls
WHERE reviewed = false
ORDER BY created_at DESC;
```

Als de call in `unmatched_fathom_calls` staat:
- ❌ Email in Fathom ≠ Email in `sales_reps` tabel
- Fix: Update de email in een van beide

---

## 📊 STAP 5: Gebruik

### Voor Sales Reps:

1. Doe gewoon je calls zoals normaal (Zoom + Fathom)
2. Calls verschijnen automatisch in het dashboard
3. Analyse is binnen 30 seconden klaar

### Voor Managers:

1. **Team Overview:**
   - `/dashboard/team` - Alle reps en hun stats

2. **Individual Rep:**
   - `/dashboard/team/[rep-id]` - Alle calls van 1 rep

3. **Single Call:**
   - `/dashboard/calls/[call-id]` - Gedetailleerde analyse

---

## 🔧 Troubleshooting

### "Call komt niet binnen"

**Check 1: Is webhook ingesteld?**
- Login in Fathom → Settings → Webhooks
- Moet je webhook URL zien staan

**Check 2: Is de URL correct?**
- Moet eindigen op `/api/webhooks/fathom`
- Moet HTTPS zijn (geen HTTP)

**Check 3: Check Fathom webhook logs**
- In Fathom dashboard → Webhooks → Recent Deliveries
- Zie je groene checkmarks of rode errors?

### "Call komt binnen maar niet gekoppeld aan rep"

**Check 1: Email matching**
```bash
# In je terminal:
node scripts/test-email-matching.js sarah@jouwbedrijf.com
```

**Check 2: Check database**
```sql
-- Is de rep in de database?
SELECT * FROM sales_reps WHERE email = 'sarah@jouwbedrijf.com';

-- Is de call in unmatched?
SELECT * FROM unmatched_fathom_calls ORDER BY created_at DESC LIMIT 5;
```

### "Analysis failed"

**Check 1: OpenAI API key**
```bash
# Test OpenAI connection:
node scripts/test-analysis.js
```

**Check 2: Check credits**
- Login op https://platform.openai.com
- Check je billing & credits

---

## 💡 Pro Tips

### 1. Meerdere Emails per Rep

Als een rep meerdere emails gebruikt (bijv. personal + work):

```sql
-- Optie 1: Update hun email naar hun primaire
UPDATE sales_reps
SET email = 'primary@jouwbedrijf.com'
WHERE id = '...';

-- Optie 2: Voeg een tweede rep record toe (zelfde persoon, andere email)
-- Dan worden beide emails herkend
```

### 2. Unmatched Calls Reviewen

Wekelijks checken:
```sql
SELECT
  fathom_call_id,
  meeting_title,
  participants,
  created_at
FROM unmatched_fathom_calls
WHERE reviewed = false
ORDER BY created_at DESC;
```

Handmatig koppelen via dashboard (TODO: build this feature)

### 3. Webhook Secret (Extra Beveiliging)

1. Genereer random secret: `openssl rand -hex 32`
2. Voeg toe aan environment variables: `FATHOM_WEBHOOK_SECRET=...`
3. Gebruik dezelfde secret in elke Fathom webhook config

---

## 📞 Support

Bij vragen of problemen:

1. Check eerst de troubleshooting sectie hierboven
2. Check webhook logs in Supabase
3. Check de console logs in je deployment (Vercel logs)

---

## 🎉 Dat is het!

Je bent nu klaar. Elke call die je team doet wordt automatisch:
- ✅ Opgenomen (Fathom)
- ✅ Getranscribeerd (Fathom)
- ✅ Opgeslagen (Jouw CRM)
- ✅ Geanalyseerd (OpenAI GPT-4o)
- ✅ Zichtbaar in dashboard

**Veel succes!** 🚀
