# 💶 Gestore Spese

> Applicazione web personale per la gestione di entrate e uscite, con autenticazione sicura, database cloud e ottimizzata per mobile.

[![Live](https://img.shields.io/badge/🌐_Live-giacomoprevitali.github.io-2563eb?style=flat-square)](https://giacomoprevitali.github.io/Gestore_Spese/login.html)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![GitHub Pages](https://img.shields.io/badge/Hosting-GitHub_Pages-181717?style=flat-square&logo=github)](https://pages.github.com)

---

## ✨ Funzionalità

| Area                | Dettaglio                                                                      |
| ------------------- | ------------------------------------------------------------------------------ |
| 📊 **Dashboard**    | Statistiche mensili, saldo attuale, grafici interattivi per uscite ed entrate  |
| 💸 **Uscite**       | Inserimento, modifica ed eliminazione con categoria, tipo pagamento e anno     |
| 💰 **Entrate**      | Gestione entrate per tipo (Conto, Portafoglio, Deposito)                       |
| 📋 **Gestione**     | Calcolo budget mensile basato sulle spese fisse                                |
| 📈 **Resoconto**    | Tabella riepilogativa mensile con confronto entrate/uscite per categoria       |
| ⚙️ **Impostazioni** | Categorie personalizzabili, tipi di pagamento, saldi iniziali, export CSV/JSON |

---

## 🔐 Sicurezza

- **Autenticazione** via [Supabase Auth](https://supabase.com/docs/guides/auth) con email e password
- **Row Level Security (RLS)** attiva su tutte le tabelle — nessun dato accessibile senza login
- **Redirect automatico** a `/login.html` se la sessione è assente o scaduta
- **Body nascosto** fino a verifica auth completata — nessun flash di contenuto non autorizzato

---

## 🛠️ Stack Tecnologico

- **Frontend** — HTML5, CSS3, JavaScript vanilla
- **Database** — [Supabase](https://supabase.com) (PostgreSQL hosted)
- **Auth** — Supabase Auth
- **Grafici** — [Chart.js 4](https://www.chartjs.org)
- **Hosting** — GitHub Pages (HTTPS gratuito)

---

## 🗂️ Struttura del Progetto

```
Gestore_Spese/
├── login.html        → pagina di accesso
├── spese.html        → applicazione principale (protetta da auth)
├── scriptLogin.js    → logica login, autenticazione
├── styleLogin.css    → stile login responsive (desktop + mobile)
├── script.js         → logica applicazione, CRUD Supabase e auth
├── style.css         → stile responsive (desktop + mobile)
└── README.md
```

---

## 📱 Mobile

L'app è ottimizzata per smartphone:

- **Bottom navigation bar** stile app nativa (iOS/Android)
- **Modal** che si apre dal basso come un foglio
- **Filtri** a colonna per una migliore usabilità touch
- Login compatibile con il **Portachiavi iCloud** su Safari

---

## 📤 Export Dati

Dalla sezione **Impostazioni** è possibile esportare:

- `📤 JSON` — stato completo dell'app (backup)
- `📊 CSV Uscite` — tutte le uscite in formato foglio di calcolo
- `📊 CSV Entrate` — tutte le entrate in formato foglio di calcolo

---

## 📄 Licenza

Progetto personale — uso privato.
