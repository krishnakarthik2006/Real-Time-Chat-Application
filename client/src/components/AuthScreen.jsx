import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/AuthContext";

const initialForm = { name: "", email: "", password: "" };

const FEATURES = [
  { icon: "⚡", title: "Real-time messaging", desc: "Messages delivered instantly with live typing indicators." },
  { icon: "🔒", title: "Secure by default",   desc: "JWT-authenticated sessions and encrypted transport." },
  { icon: "👥", title: "Group chats",          desc: "Create groups, manage members, and assign roles." },
  { icon: "📎", title: "File sharing",          desc: "Send images, documents, and more in any conversation." },
];

export default function AuthScreen() {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode]         = useState("login");
  const [form, setForm]         = useState(initialForm);
  const [error, setError]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (mode === "register") await register(form);
      else await login({ email: form.email, password: form.password });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      {/* ── Left hero ── */}
      <section className="hero-panel">
        <div className="hero-panel__top">
          <div className="hero-brand">
            <div className="brand-mark">💬</div>
            <div>
              <p className="eyebrow" style={{ color: "rgba(255,255,255,.6)" }}>PulseChat</p>
              <h2>Real-Time Chat</h2>
            </div>
          </div>
          <h1>Connect with your people — instantly.</h1>
          <p className="hero-copy">
            A fast, polished messaging experience with direct chats, groups,
            live presence, read receipts, file sharing, and more.
          </p>
        </div>

        <div className="feature-grid">
          {FEATURES.map((f) => (
            <article key={f.title}>
              <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Right auth panel ── */}
      <section className="auth-panel">
        <div className="auth-header">
          <p className="eyebrow">{mode === "login" ? "Welcome back" : "Get started"}</p>
          <h2>{mode === "login" ? "Sign in to continue" : "Create your account"}</h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              <span>Full name</span>
              <input
                type="text" placeholder="Your name"
                value={form.name} onChange={(e) => update("name", e.target.value)} required
              />
            </label>
          )}
          <label>
            <span>Email address</span>
            <input
              type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => update("email", e.target.value)} required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password" placeholder="Minimum 6 characters"
              value={form.password} onChange={(e) => update("password", e.target.value)} required
            />
          </label>

          {error && <p className="form-error">⚠️ {error}</p>}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-separator"><span>or</span></div>

        <div className="google-auth-wrapper">
          <GoogleLogin
            onSuccess={async (cr) => {
              setError(""); setSubmitting(true);
              try { await loginWithGoogle(cr.credential); }
              catch (err) { setError(err.message || "Google sign-in failed"); }
              finally { setSubmitting(false); }
            }}
            onError={() => setError("Google sign-in was unsuccessful")}
            useOneTap
          />
        </div>

        <div className="auth-switch">
          <button
            type="button"
            onClick={() => { setMode((m) => (m === "login" ? "register" : "login")); setError(""); }}
          >
            {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}
