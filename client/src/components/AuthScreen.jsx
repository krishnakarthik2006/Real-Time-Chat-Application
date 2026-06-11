import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "register") {
        await register(form);
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <main className="auth-shell">
      <section className="hero-panel">
        <div className="hero-panel__top">
          <div className="hero-brand">
            <div className="brand-mark" aria-hidden="true" />
            <div>
              <p className="eyebrow">Private Messaging</p>
              <h2>PulseChat</h2>
            </div>
          </div>

          <h1>Stay close to your people with a fast, polished chat experience.</h1>
          <p className="hero-copy">
            PulseChat gives you direct chat, groups, typing indicators, read states,
            file sharing, search, and realtime presence in one original product
            identity that feels familiar without copying any existing messenger brand.
          </p>
        </div>

        <div className="feature-grid">
          <article>
            <h2>Realtime by default</h2>
            <p>Messages, presence, read states, and typing stay synchronized instantly.</p>
          </article>
          <article>
            <h2>Built for everyday chat</h2>
            <p>Direct messages and group conversations share one clean, mobile-friendly flow.</p>
          </article>
          <article>
            <h2>Original visual identity</h2>
            <p>The product keeps recognizable messaging patterns while avoiding copied branding.</p>
          </article>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-header">
          <p className="eyebrow">{mode === "login" ? "Welcome Back" : "Create Account"}</p>
          <h2>{mode === "login" ? "Sign in to continue" : "Create your PulseChat account"}</h2>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label>
              <span>Name</span>
              <input
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>
          ) : null}

          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={(event) => updateField("password", event.target.value)}
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <button
          className="text-button"
          type="button"
          onClick={() => {
            setMode((current) => (current === "login" ? "register" : "login"));
            setError("");
          }}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}
