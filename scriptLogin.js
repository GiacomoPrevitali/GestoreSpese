// ══════════════════════════════════════════
// CONFIGURAZIONE — modifica solo questi due valori
// ══════════════════════════════════════════
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";
const REDIRECT_PAGE = "spese.html"; // pagina da aprire dopo login ok
// ══════════════════════════════════════════

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Controlla se già loggato → redirect diretto
(async () => {
  const {
    data: { session },
  } = await db.auth.getSession();
  if (session) {
    window.location.href = REDIRECT_PAGE;
    return;
  }
})();

// ──────────────────────────────────────────
// UI helpers
// ──────────────────────────────────────────
function showMsg(text, type = "error") {
  const el = document.getElementById("msg-box");
  el.className = "msg " + type;
  el.innerHTML = (type === "error" ? "⚠️ " : "✅ ") + text;
  el.style.display = "flex";
}
function hideMsg() {
  document.getElementById("msg-box").style.display = "none";
}
function setLoading(on) {
  const btn = document.getElementById("btn-login");
  btn.disabled = on;
  btn.classList.toggle("loading", on);
  btn.innerHTML = on
    ? '<span class="spinner"></span> Accesso in corso…'
    : "Accedi";
}
function togglePw() {
  const inp = document.getElementById("password");
  const icon = document.getElementById("eye-icon");
  if (inp.type === "password") {
    inp.type = "text";
    icon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  } else {
    inp.type = "password";
    icon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  }
}

// ──────────────────────────────────────────
// LOGIN EMAIL / PASSWORD
// ──────────────────────────────────────────
async function loginEmail() {
  hideMsg();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showMsg("Inserisci email e password.");
    return;
  }

  setLoading(true);
  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    showMsg("Accesso effettuato! Reindirizzamento…", "success");
    setTimeout(() => (window.location.href = REDIRECT_PAGE), 800);
  } catch (err) {
    const msgs = {
      "Invalid login credentials": "Email o password errati.",
      "Email not confirmed": "Conferma la tua email prima di accedere.",
      "Too many requests": "Troppi tentativi, riprova tra qualche minuto.",
    };
    showMsg(msgs[err.message] || err.message);
  } finally {
    setLoading(false);
  }
}

// Invio con tasto Enter
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginEmail();
});
