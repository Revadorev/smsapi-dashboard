# SMS Dashboard — SMSAPI Integration

Un dashboard modern Next.js 14 (App Router) pentru trimiterea SMS-urilor prin [SMSAPI.ro](https://www.smsapi.ro), cu stocare în Supabase și deployment pe Vercel.

---

## 🚀 Stack tehnic

| Strat | Tehnologie |
|-------|-----------|
| Frontend + API | **Next.js 14** (App Router, TypeScript) |
| Styling | **Tailwind CSS** |
| Baza de date | **Supabase** (PostgreSQL) |
| SMS Provider | **SMSAPI.ro** |
| Hosting | **Vercel** |
| Iconuri | **Lucide React** |

---

## ✨ Funcționalități

- 📱 **Formular trimitere SMS** — număr telefon + mesaj + expeditor opțional
- 📊 **Dashboard statistici** — total trimise, livrate, eșuate, credite utilizate
- 📋 **Istoricul SMS-urilor** — tabel complet cu status, filtrare, refresh live
- 📝 **Template-uri SMS** — CRUD complet pentru mesaje predefinite
- 💰 **Sold SMSAPI** — afișat live în header
- 🔄 **Normalizare numere** — acceptă 07xx, 40xx, +40xx automat
- ⚡ **Counter caractere** — detectează caractere speciale (70 vs 160 chars/SMS)

---

## 📦 Setup local

### 1. Clonează repository-ul

```bash
git clone https://github.com/YOUR_USERNAME/smsapi-dashboard.git
cd smsapi-dashboard
npm install
```

### 2. Configurează variabilele de mediu

```bash
cp .env.example .env.local
```

Editează `.env.local`:

```env
SMSAPI_TOKEN=your_smsapi_oauth_token_here
SMSAPI_SENDER=Test

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Configurează Supabase

1. Creează un proiect nou pe [supabase.com](https://supabase.com)
2. Deschide **SQL Editor** și rulează `supabase-schema.sql`
3. Copiază URL-ul și cheile din **Settings → API**

### 4. Obține token SMSAPI

1. Loghează-te pe [portal.smsapi.ro](https://portal.smsapi.ro)
2. Mergi la **OAuth Tokens** → generează token nou
3. Copiază token-ul în `.env.local`

### 5. Pornește serverul de development

```bash
npm run dev
```

Accesează [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy pe Vercel

### Opțiunea 1 — Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

Adaugă variabilele de mediu când ți se solicită.

### Opțiunea 2 — GitHub + Vercel Dashboard

1. Push proiectul pe GitHub:
```bash
git init
git add .
git commit -m "Initial commit: SMS Dashboard"
git remote add origin https://github.com/YOUR_USERNAME/smsapi-dashboard.git
git push -u origin main
```

2. Importă pe [vercel.com/new](https://vercel.com/new)
3. Adaugă variabilele de mediu în **Settings → Environment Variables**:
   - `SMSAPI_TOKEN`
   - `SMSAPI_SENDER`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

---

## 📁 Structura proiectului

```
smsapi-dashboard/
├── app/
│   ├── api/
│   │   ├── send-sms/route.ts   # POST — trimite SMS
│   │   ├── balance/route.ts    # GET — sold SMSAPI
│   │   └── logs/route.ts       # GET — istoric SMS
│   ├── history/page.tsx        # Pagina Istoric
│   ├── templates/page.tsx      # Pagina Template-uri
│   ├── page.tsx                # Dashboard principal
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── DashboardLayout.tsx     # Layout + navigație + header
│   ├── StatsCards.tsx          # Carduri statistici
│   ├── SendSmsForm.tsx         # Formular trimitere SMS
│   ├── SmsHistoryTable.tsx     # Tabel istoric cu search
│   └── TemplatesManager.tsx    # CRUD template-uri
├── lib/
│   ├── smsapi.ts               # Client SMSAPI.ro
│   ├── supabase.ts             # Client Supabase
│   └── utils.ts                # Utilitare
├── supabase-schema.sql         # Schema baza de date
├── vercel.json                 # Config Vercel
└── .env.example                # Template variabile mediu
```

---

## 🔌 API Routes

| Endpoint | Metodă | Descriere |
|----------|--------|-----------|
| `/api/send-sms` | POST | Trimite SMS via SMSAPI + salvează în DB |
| `/api/balance` | GET | Returnează soldul SMSAPI |
| `/api/logs` | GET | Returnează istoricul SMS din DB |

### POST `/api/send-sms`
```json
{
  "phone": "0712345678",
  "message": "Buna ziua! Mesaj test.",
  "sender": "Test"
}
```

---

## 📱 Format numere telefon acceptate

| Input | Normalizat |
|-------|-----------|
| `0712345678` | `40712345678` |
| `07 123 456 78` | `40712345678` |
| `+40712345678` | `40712345678` |
| `40712345678` | `40712345678` |

---

## 📊 Statusuri SMS

| Status | Descriere |
|--------|-----------|
| `QUEUE` | Mesaj în așteptare |
| `SENT` | Trimis la operator |
| `DELIVERED` | Livrat la destinatar |
| `UNDELIVERED` | Nelivrat |
| `FAILED` | Eșuat |
| `ERROR` | Eroare internă |

---

## 🛡️ Securitate

- Token SMSAPI nu este expus clientului (doar server-side)
- `SUPABASE_SERVICE_ROLE_KEY` — doar pe server
- RLS activat pe Supabase (configurabil per necesitate)
- Validare + sanitizare input în API routes

---

## 📄 Licență

MIT — liber de utilizat și modificat.
