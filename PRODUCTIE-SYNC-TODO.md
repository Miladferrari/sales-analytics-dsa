# Productie: Automatische Fathom Sync

## Huidige Situatie
- ✅ Manual sync werkt via "Ververs" knop op sales rep profielen
- ✅ Bulk sync werkt via Settings → Fathom Sync
- ⚠️ In productie willen we **automatische sync** zonder handmatig klikken

## Twee Opties voor Automatische Sync

### ✅ Optie 1: Cron Job (AANBEVOLEN VOOR START)

**Wat is dit?**
- Een scheduled task die elke 15-30 minuten automatisch draait
- Roept `/api/cron/sync-fathom` endpoint aan
- Haalt nieuwe calls op voor alle sales reps

**Setup:**
- Vercel Cron Jobs (gratis, ingebouwd)
- Of externe service zoals Cron-job.org

**Voordelen:**
- ✅ Simpel om op te zetten
- ✅ Alleen API Key nodig (geen webhook secret)
- ✅ Betrouwbaar en voorspelbaar
- ✅ Geen extra Fathom configuratie

**Nadelen:**
- ⚠️ Niet real-time (max 15-30 min vertraging)
- ⚠️ Afhankelijk van scheduling service

**Geschikt voor:**
- Start van productie
- De meeste CRM use cases (15-30 min is meestal prima)

---

### ⚡ Optie 2: Webhooks (LATER - VOOR REAL-TIME)

**Wat is dit?**
- Fathom stuurt direct een notificatie naar onze server bij elke nieuwe call
- Real-time verwerking

**Setup:**
- Webhook endpoint bouwen: `/api/webhooks/fathom`
- Webhook secret in Fathom configureren
- **WEBHOOK SECRET WORDT DAN VERPLICHT** (voor security)

**Voordelen:**
- ✅ Real-time updates (seconden vertraging)
- ✅ Efficiënter (alleen sync als er iets nieuws is)

**Nadelen:**
- ⚠️ Complexer om op te zetten
- ⚠️ Moet webhook secret verplicht maken in UI
- ⚠️ Extra Fathom configuratie nodig
- ⚠️ Moet webhook endpoint beveiligen

**Geschikt voor:**
- Later, als real-time echt nodig is
- Als 15-30 min vertraging te lang is

---

## 🎯 Aanbeveling

**Start met Optie 1 (Cron Job)**

**Redenen:**
1. Sneller om te implementeren
2. Minder complexiteit
3. 15-30 min vertraging is meestal prima voor een CRM
4. Geen extra configuratie in Fathom nodig
5. Kunnen later altijd upgraden naar webhooks

**Wanneer upgraden naar Optie 2?**
- Als real-time sync echt nodig is
- Als het team groeit en handmatige sync niet meer werkt
- Als klanten direct na een call de data willen zien

---

## TODO: Implementatie Optie 1 (Cron Job)

### Stap 1: Vercel Cron Job toevoegen
Bestand: `vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/sync-fathom?hours=24",
    "schedule": "*/30 * * * *"
  }]
}
```

### Stap 2: Cron endpoint beveiligen
- Authorization header checken met een secret key
- Alleen Vercel mag deze endpoint aanroepen

### Stap 3: Testen
- Deploy naar Vercel
- Check Vercel Logs of cron job draait
- Verifieer dat calls automatisch syncen

### Stap 4: Monitoring toevoegen
- Log elke cron run
- Alert bij failures
- Dashboard met sync statistieken

---

## Huidige Status
- [x] API routes gefixed
- [x] Database migratie gedaan
- [x] Credentials gemigreerd
- [x] Test verbinding succesvol
- [ ] Productie cron job opzetten
- [ ] (Optioneel later) Webhooks implementeren

---

**Laatste update:** 17 oktober 2025
**Prioriteit:** Medium (voor productie launch)
**Eigenaar:** Development Team
