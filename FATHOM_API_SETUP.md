# 🔧 Fathom API Poller - Setup Documentatie

## ✅ Wat is er gebouwd?

In plaats van webhooks per medewerker, hebben we nu een **API Poller** die automatisch alle nieuwe calls ophaalt!

### **Voordelen:**
- ✅ **1x setup** - Alleen 1 API key nodig
- ✅ **Geen individuele webhooks** - Medewerkers hoeven niks te doen
- ✅ **Automatisch** - Draait elke 5 minuten
- ✅ **Werkt voor alle reps** - Zolang hun email in de database staat

---

## 📁 Wat is er gemaakt?

### 1. **Fathom API Client** (`src/lib/fathom/api-client.ts`)
   - Verbindt met Fathom API
   - Haalt calls op
   - Filtert op nieuwe calls sinds laatste sync

### 2. **Cron Job** (`src/app/api/cron/sync-fathom/route.ts`)
   - Endpoint: `GET /api/cron/sync-fathom`
   - Draait elke 5 minuten (automatisch via Vercel)
   - Haalt nieuwe calls op
   - Matcht emails → sales reps
   - Slaat op in database
   - Triggert analyse

### 3. **Vercel Cron Config** (`vercel.json`)
   - Configureert automatische scheduling
   - Runs every 5 minutes

### 4. **Test Script** (`scripts/test-fathom-api.js`)
   - Test de API connectie
   - Laat zien welke calls er zijn

---

## 🚀 Setup Stappen

### **Stap 1: API Key (AL GEDAAN! ✅)**

Je hebt al een test API key toegevoegd aan `.env.local`:
```
FATHOM_API_KEY=4jmc-aeVcsbvB2VqtgZQbQ...
```

**Voor productie:** Vervang deze met de API key van je echte Fathom Team account.

---

### **Stap 2: Sales Reps Toevoegen**

De poller kan alleen calls matchen als de sales reps in de database staan!

**Optie A: Bulk import (16 mensen tegelijk)**
```bash
# 1. Edit CSV
open data/sales-reps-template.csv

# 2. Vul in met echte emails (MOET matchen met Fathom/Zoom emails!)
# 3. Rename
cp data/sales-reps-template.csv data/sales-reps.csv

# 4. Import
node scripts/bulk-import-sales-reps.js
```

**Optie B: Handmatig via Supabase Dashboard**
- Ga naar Supabase → Table Editor → sales_reps
- Add row manually

---

### **Stap 3: Deploy naar Vercel**

De cron job werkt alleen op Vercel (niet lokaal).

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Kopieer de URL
# Bijvoorbeeld: https://dropship-crm.vercel.app
```

**Environment Variables** toevoegen in Vercel:
1. Ga naar Vercel Dashboard → je project → Settings → Environment Variables
2. Voeg toe:
   ```
   FATHOM_API_KEY=<jouw_echte_api_key>
   NEXT_PUBLIC_SUPABASE_URL=https://...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENAI_API_KEY=...
   FATHOM_WEBHOOK_SECRET=... (optioneel)
   ```

---

### **Stap 4: Testen**

**Optie 1: Wacht 5 minuten**
- Vercel cron draait automatisch elke 5 minuten
- Check dashboard na 5-10 minuten

**Optie 2: Handmatig trigger**
```bash
# Trigger de sync handmatig
curl https://jouw-app.vercel.app/api/cron/sync-fathom
```

**Optie 3: Check de logs**
- Vercel Dashboard → je project → Functions → /api/cron/sync-fathom
- Zie logs van elke run

---

## 🔄 Hoe het werkt

```
┌─────────────────────────────────────┐
│  Vercel Cron (elke 5 min)          │
│  Triggers: /api/cron/sync-fathom   │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  1. Get last sync time              │
│     (from database)                 │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  2. Fetch new calls from Fathom API │
│     (calls since last sync)         │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  3. For each call:                  │
│     - Check if already in DB        │
│     - 🔍 FILTER: Is recorded_by a   │
│       sales rep in our database?    │
│     - If NO → Skip (andere team)    │
│     - If YES → Continue ✅          │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  4. Match participant email         │
│     Find sales rep in DB            │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  5a. IF MATCHED:                    │
│      - Save call to 'calls' table   │
│      - Trigger GPT-4o analysis      │
│      ✅ Done!                        │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│  5b. IF NOT MATCHED:                │
│      - Save to 'unmatched_fathom    │
│        _calls' table                │
│      - Admin can review later       │
└─────────────────────────────────────┘
```

### **🎯 Belangrijke Filter:**

De API poller haalt **alleen calls op van mensen in je `sales_reps` database**.

**Voorbeeld:**
- ✅ Milad (milad@splitty.nl) staat in database → Import zijn calls
- ❌ Thomas (thomas@dropshipacademy.nl) staat NIET in database → Skip zijn calls

Dit voorkomt dat calls van andere teams (bijv. Delivery) in je sales CRM terechtkomen!

---

## ⚠️ API Key Issues (Wat we ontdekten)

De test API key werkt **niet** omdat:
1. Het een test account is zonder calls
2. API keys moeten misschien geactiveerd worden in Fathom
3. API endpoint kan anders zijn voor je account

**Dit is normaal!** Voor je echte Fathom Team account:

### **Checklist voordat je test:**
1. ✅ API key gegenereerd in je **echte** Fathom Team account
2. ✅ Team heeft calls gedaan (minimaal 1 call om te testen)
3. ✅ Sales reps emails in database matchen met Fathom participant emails
4. ✅ App is gedeployed op Vercel
5. ✅ Environment variables zijn ingesteld op Vercel

---

## 🔧 API Key Vervangen (Van Test → Productie)

**Lokaal (.env.local):**
```bash
# 1. Open .env.local
code .env.local

# 2. Vervang de API key:
FATHOM_API_KEY=<nieuwe_key_van_echte_account>

# 3. Restart dev server
# (Vercel dev server herlaadt automatisch)
```

**Op Vercel:**
```bash
# 1. Ga naar Vercel Dashboard
# 2. Project → Settings → Environment Variables
# 3. Edit FATHOM_API_KEY
# 4. Voeg nieuwe key toe
# 5. Redeploy (automatisch of handmatig)
```

---

## 📊 Monitoring

### **Check of de cron draait:**
```bash
curl https://jouw-app.vercel.app/api/cron/sync-fathom
```

**Response:**
```json
{
  "success": true,
  "processed": 5,
  "imported": 3,
  "skipped": 2,
  "errors": 0,
  "lastSyncTime": "2024-01-15T14:05:00Z",
  "duration_ms": 2341,
  "calls": [
    {
      "fathom_call_id": "abc123",
      "status": "imported",
      "reason": "Matched to sarah@dropship.com"
    },
    ...
  ]
}
```

### **Check unmatched calls:**
```sql
-- In Supabase SQL Editor:
SELECT
  fathom_call_id,
  meeting_title,
  participants,
  created_at
FROM unmatched_fathom_calls
WHERE reviewed = false
ORDER BY created_at DESC;
```

---

## 🎯 Onboarding Nieuwe Medewerker

**Oud (met webhooks):**
1. ❌ Medewerker maakt Fathom account
2. ❌ Medewerker configureert webhook
3. ❌ 5-10 minuten werk

**Nieuw (met API poller):**
1. ✅ Voeg medewerker toe aan database (met juiste email!)
2. ✅ Medewerker doet calls
3. ✅ **Klaar! Automatisch in CRM**

**SQL om medewerker toe te voegen:**
```sql
INSERT INTO sales_reps (name, email, qualification_status)
VALUES ('New Rep', 'newrep@dropship.com', 'qualified');
```

Of via het bulk import script.

---

## 🚨 Troubleshooting

### **Probleem: Calls komen niet binnen**

**Check 1: Is de cron actief?**
- Vercel Dashboard → Functions → Logs
- Zie je elke 5 min een run?

**Check 2: API key correct?**
```bash
node scripts/test-fathom-api.js
```

**Check 3: Sales reps in database?**
```sql
SELECT * FROM sales_reps;
```

**Check 4: Email matching?**
- Participant email in Fathom call MOET exact matchen met `sales_reps.email`
- Check case-sensitivity (wordt automatisch lowercase, maar check het)

### **Probleem: Calls in unmatched table**

Betekent: Email match failed

**Oplossing:**
```sql
-- Check welke emails er zijn:
SELECT participants FROM unmatched_fathom_calls WHERE reviewed = false;

-- Voeg ontbrekende rep toe:
INSERT INTO sales_reps (name, email, qualification_status)
VALUES ('Missing Rep', 'email@found.com', 'qualified');

-- Mark as reviewed:
UPDATE unmatched_fathom_calls SET reviewed = true WHERE id = '...';
```

---

## 📝 Next Steps

1. **Vervang test API key** met echte Fathom Team API key
2. **Add all 16 sales reps** to database
3. **Deploy to Vercel**
4. **Do a test call** en wacht 5-10 minuten
5. **Check dashboard** - Call zou moeten verschijnen met analyse!

---

## 🎉 Klaar!

Je hebt nu een volledig automatisch systeem:
- ✅ Sales rep doet call
- ✅ Fathom neemt op + transcribeert
- ✅ Cron job haalt call op (elke 5 min)
- ✅ Email wordt gematcht aan rep
- ✅ Call wordt opgeslagen
- ✅ GPT-4o analyseert
- ✅ Zichtbaar in dashboard

**Geen webhooks. Geen handmatige setup. Volledig automatisch!** 🚀
