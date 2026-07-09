import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const FEATURES = [
  { icon: "⚡", title: "Real-time messaging",  desc: "Messages delivered instantly with live typing indicators." },
  { icon: "🔒", title: "Secure by default",    desc: "JWT-authenticated sessions and encrypted transport." },
  { icon: "👥", title: "Group chats",           desc: "Create groups, manage members, and assign roles." },
  { icon: "📎", title: "File sharing",           desc: "Send images, documents, and more in any conversation." },
];

/* ── Password strength indicator ────────────────────────────── */
function passwordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "",         color: "" },
    { label: "Weak",     color: "var(--clr-red)" },
    { label: "Fair",     color: "#f59e0b" },
    { label: "Good",     color: "#84cc16" },
    { label: "Strong",   color: "var(--clr-green)" },
    { label: "Very strong", color: "var(--clr-green)" },
  ];
  return { score, ...map[score] };
}

/* ── Client-side validation ─────────────────────────────────── */
function validate(mode, form) {
  const errors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const pw = form.password;
  const confirm = form.confirmPassword;

  if (mode === "register") {
    if (!name) errors.name = "Full name is required.";
    else if (name.length < 2) errors.name = "Name must be at least 2 characters.";
    else if (name.length > 80) errors.name = "Name must be at most 80 characters.";
  }

  if (!email) errors.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";

  if (!pw) errors.password = "Password is required.";
  else if (mode === "register" && pw.length < 6) errors.password = "Password must be at least 6 characters.";
  else if (pw.length > 64) errors.password = "Password must be at most 64 characters.";

  if (mode === "register") {
    if (!confirm) errors.confirmPassword = "Please confirm your password.";
    else if (confirm !== pw) errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

/* ── Password input with visibility toggle ──────────────────── */
function PasswordInput({ id, placeholder, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ paddingRight: 38 }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: "var(--clr-ink-3)",
          padding: 0, display: "flex", alignItems: "center",
        }}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ── Field error ────────────────────────────────────────────── */
function FieldError({ message }) {
  if (!message) return null;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)", color: "var(--clr-red)", marginTop: 3 }}>
      <XCircle size={12} />{message}
    </span>
  );
}

/* ── Main component ─────────────────────────────────────────── */
export default function AuthScreen() {
  const { login, register, loginWithGoogle } = useAuth();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear the field error as user types
    if (fieldErrors[field]) {
      setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");

    const errors = validate(mode, form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      if (mode === "register") {
        await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      } else {
        await login({ email: form.email.trim(), password: form.password });
      }
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setFieldErrors({});
    setServerError("");
    setForm({ name: "", email: "", password: "", confirmPassword: "" });
  }

  const strength = mode === "register" ? passwordStrength(form.password) : null;

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

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {mode === "register" && (
            <label>
              <span>Full name</span>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={!!fieldErrors.name}
                autoComplete="name"
              />
              <FieldError message={fieldErrors.name} />
            </label>
          )}

          <label>
            <span>Email address</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={!!fieldErrors.email}
              autoComplete="email"
            />
            <FieldError message={fieldErrors.email} />
          </label>

          <label>
            <span>Password</span>
            <PasswordInput
              id="auth-password"
              placeholder={mode === "register" ? "Minimum 6 characters" : "Your password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <FieldError message={fieldErrors.password} />

            {/* Password strength bar — registration only */}
            {mode === "register" && form.password.length > 0 && (
              <div className="password-strength">
                <div className="password-strength__bar">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="password-strength__segment"
                      style={{ background: i <= strength.score ? strength.color : "var(--clr-border-2)" }}
                    />
                  ))}
                </div>
                <span className="password-strength__label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </label>

          {mode === "register" && (
            <label>
              <span>Confirm password</span>
              <PasswordInput
                id="auth-confirm-password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
              <FieldError message={fieldErrors.confirmPassword} />
              {!fieldErrors.confirmPassword && form.confirmPassword && form.confirmPassword === form.password && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)", color: "var(--clr-green)", marginTop: 3 }}>
                  <CheckCircle size={12} /> Passwords match
                </span>
              )}
            </label>
          )}

          {/* Server-side error */}
          {serverError && <p className="form-error">⚠️ {serverError}</p>}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-separator"><span>or</span></div>

        <div className="google-auth-wrapper">
          <GoogleLogin
            onSuccess={async (cr) => {
              setServerError("");
              setSubmitting(true);
              try { await loginWithGoogle(cr.credential); }
              catch (err) { setServerError(err.message || "Google sign-in failed."); }
              finally { setSubmitting(false); }
            }}
            onError={() => setServerError("Google sign-in was unsuccessful. Please try again.")}
            useOneTap
          />
        </div>

        <div className="auth-switch">
          <button type="button" onClick={switchMode}>
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </section>
    </main>
  );
}
