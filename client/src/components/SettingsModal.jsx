import { useState } from "react";
import {
  X, Moon, Sun, Bell, BellOff, User, Lock, MessageSquare,
  Shield, Trash2, Info, ChevronRight, ChevronDown, Check,
} from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { useAuth } from "../auth/AuthContext";
import { request } from "../api/client";

/* ── constants ─────────────────────────────────────────────── */
const ACCENTS = [
  { id: "indigo",  label: "Indigo",  color: "#4f46e5" },
  { id: "rose",    label: "Rose",    color: "#e11d48" },
  { id: "emerald", label: "Emerald", color: "#059669" },
  { id: "sky",     label: "Sky",     color: "#0284c7" },
  { id: "amber",   label: "Amber",   color: "#d97706" },
];

const FONT_SIZES = [
  { id: "sm",   label: "Small",  value: "13px" },
  { id: "md",   label: "Medium", value: "15px" },
  { id: "lg",   label: "Large",  value: "17px" },
];

const DENSITY = [
  { id: "compact", label: "Compact" },
  { id: "cozy",    label: "Cozy"    },
];

const SHORTCUTS = [
  { keys: ["Enter"],          desc: "Send message" },
  { keys: ["Shift", "Enter"], desc: "New line" },
  { keys: ["↑"],              desc: "Edit last message" },
  { keys: ["Esc"],            desc: "Cancel edit / reply" },
  { keys: ["Ctrl", "/"],      desc: "Open shortcuts" },
];

const NAV_ITEMS = [
  { id: "profile",      icon: User,          label: "Profile" },
  { id: "appearance",   icon: Sun,           label: "Appearance" },
  { id: "chat",         icon: MessageSquare, label: "Chat" },
  { id: "notifications",icon: Bell,          label: "Notifications" },
  { id: "privacy",      icon: Shield,        label: "Privacy" },
  { id: "data",         icon: Trash2,        label: "Data & storage" },
  { id: "about",        icon: Info,          label: "About" },
];

/* ── small helpers ──────────────────────────────────────────── */
function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      className={`settings-toggle${checked ? " settings-toggle--on" : ""}`}
      onClick={() => onChange(!checked)}
    />
  );
}

function Row({ icon: Icon, label, sub, right, onClick }) {
  return (
    <div className={`settings-row${onClick ? " settings-row--clickable" : ""}`} onClick={onClick}>
      <div className="settings-row__label">
        {Icon && <Icon size={15} />}
        <div>
          <span>{label}</span>
          {sub && <p className="settings-row__sub">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function SaveButton({ loading, saved, onClick }) {
  return (
    <button
      type="button"
      className="primary-button"
      style={{ height: 34, padding: "0 18px", fontSize: "var(--text-xs)", marginTop: 6 }}
      disabled={loading}
      onClick={onClick}
    >
      {saved ? <><Check size={13} /> Saved</> : loading ? "Saving…" : "Save changes"}
    </button>
  );
}

/* ── section panels ─────────────────────────────────────────── */

const AVATAR_SEEDS = [
  "cat", "dog", "fox", "bear", "lion", "panda", "rabbit",
  "owl", "wolf", "tiger", "deer", "frog",
];

function ProfileSection({ user, token, onUserUpdated }) {
  const [name, setName] = useState(user?.name || "");
  const [avatarSeed, setAvatarSeed] = useState(user?.avatarSeed || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const isGoogle = user?.authProvider === "google";

  async function saveName() {
    if (!name.trim()) return;
    const nameChanged = name.trim() !== user.name;
    const seedChanged = avatarSeed !== user.avatarSeed;
    if (!nameChanged && !seedChanged) return;

    setLoading(true); setError(""); setSaved(false);
    try {
      const body = { name: name.trim() };
      if (seedChanged) body.avatarSeed = avatarSeed;
      const data = await request("/auth/profile", { method: "PATCH", token, body });
      onUserUpdated(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function savePassword() {
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return; }
    if (newPw === currentPw) { setPwError("New password must differ from current password."); return; }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return; }

    setPwLoading(true); setPwError(""); setPwSaved(false);
    try {
      await request("/auth/password", {
        method: "PATCH", token,
        body: { currentPassword: currentPw, newPassword: newPw, confirmNewPassword: confirmPw },
      });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (e) { setPwError(e.message); }
    finally { setPwLoading(false); }
  }

  return (
    <div className="settings-panel-body">
      {/* Avatar picker */}
      <section className="settings-section">
        <h3 className="settings-section__title">Avatar style</h3>
        <p className="settings-row__sub" style={{ marginBottom: 10 }}>
          Choose a seed that determines your avatar colours and initials style.
        </p>
        <div className="avatar-seed-grid">
          {/* Current custom seed */}
          <button
            type="button"
            className={`avatar-seed-btn${avatarSeed === user?.email?.toLowerCase() ? " avatar-seed-btn--active" : ""}`}
            onClick={() => setAvatarSeed(user?.email?.toLowerCase() || "")}
            title="Default (email-based)"
          >
            <div className="avatar avatar--small" style={{ background: "var(--clr-accent)" }}>
              {(user?.name || "?")[0].toUpperCase()}
            </div>
            <span>Default</span>
          </button>
          {AVATAR_SEEDS.map((seed) => {
            const hue = Array.from(seed).reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
            return (
              <button
                key={seed}
                type="button"
                className={`avatar-seed-btn${avatarSeed === seed ? " avatar-seed-btn--active" : ""}`}
                onClick={() => setAvatarSeed(seed)}
                title={seed}
              >
                <div
                  className="avatar avatar--small"
                  style={{ background: `linear-gradient(135deg, hsl(${hue} 72% 42%), hsl(${(hue + 42) % 360} 82% 58%))` }}
                >
                  {(user?.name || "?")[0].toUpperCase()}
                </div>
                <span style={{ textTransform: "capitalize" }}>{seed}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Display name */}
      <section className="settings-section">
        <h3 className="settings-section__title">Display name</h3>
        <label className="settings-field">
          <span>Name</span>
          <input type="text" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </label>
        {error && <p className="settings-error">{error}</p>}
        <SaveButton loading={loading} saved={saved} onClick={saveName} />
      </section>

      {/* Account info */}
      <section className="settings-section">
        <h3 className="settings-section__title">Account</h3>
        <Row label="Email" sub={user?.email} />
        <Row label="Auth provider" sub={isGoogle ? "Google OAuth" : "Email & password"} />
      </section>

      {/* Change password — local accounts only */}
      {!isGoogle && (
        <section className="settings-section">
          <h3 className="settings-section__title">Change password</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="settings-field">
              <span>Current password</span>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
            </label>
            <label className="settings-field">
              <span>New password</span>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" />
            </label>
            <label className="settings-field">
              <span>Confirm new password</span>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter new password" autoComplete="new-password" />
              {confirmPw && newPw && confirmPw === newPw && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-green)", marginTop: 3 }}>✓ Passwords match</span>
              )}
              {confirmPw && newPw && confirmPw !== newPw && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--clr-red)", marginTop: 3 }}>✗ Passwords do not match</span>
              )}
            </label>
          </div>
          {pwError && <p className="settings-error" style={{ marginTop: 6 }}>{pwError}</p>}
          <SaveButton loading={pwLoading} saved={pwSaved} onClick={savePassword} />
        </section>
      )}
    </div>
  );
}

function AppearanceSection() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const [fontSize, setFontSize] = useState(() => localStorage.getItem("chat-font-size") || "md");
  const [density, setDensity] = useState(() => localStorage.getItem("chat-density") || "cozy");

  function applyFontSize(id) {
    const size = FONT_SIZES.find((f) => f.id === id);
    if (!size) return;
    setFontSize(id);
    localStorage.setItem("chat-font-size", id);
    document.documentElement.style.setProperty("--text-base", size.value);
  }

  function applyDensity(id) {
    setDensity(id);
    localStorage.setItem("chat-density", id);
    document.documentElement.setAttribute("data-density", id);
  }

  return (
    <div className="settings-panel-body">
      <section className="settings-section">
        <h3 className="settings-section__title">Theme</h3>
        <Row
          icon={theme === "dark" ? Moon : Sun}
          label="Colour scheme"
          right={
            <div className="settings-toggle-group">
              <button type="button" className={`settings-toggle-btn${theme === "light" ? " settings-toggle-btn--active" : ""}`} onClick={() => setTheme("light")}>Light</button>
              <button type="button" className={`settings-toggle-btn${theme === "dark"  ? " settings-toggle-btn--active" : ""}`} onClick={() => setTheme("dark")}>Dark</button>
            </div>
          }
        />
        <Row
          label="Accent colour"
          icon={() => (
            <span style={{ width: 15, height: 15, borderRadius: "50%", background: ACCENTS.find((a) => a.id === accent)?.color, display: "inline-block", flexShrink: 0 }} />
          )}
          right={
            <div className="settings-accents">
              {ACCENTS.map((a) => (
                <button key={a.id} type="button"
                  className={`settings-accent-btn${accent === a.id ? " settings-accent-btn--active" : ""}`}
                  style={{ background: a.color }}
                  onClick={() => setAccent(a.id)}
                  title={a.label} aria-label={`${a.label} accent`} aria-pressed={accent === a.id}
                />
              ))}
            </div>
          }
        />
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Text size</h3>
        <div className="settings-chip-row">
          {FONT_SIZES.map((f) => (
            <button key={f.id} type="button"
              className={`settings-chip${fontSize === f.id ? " settings-chip--active" : ""}`}
              onClick={() => applyFontSize(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="settings-preview" style={{ fontSize: FONT_SIZES.find((f) => f.id === fontSize)?.value }}>
          The quick brown fox jumps over the lazy dog.
        </p>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Message density</h3>
        <div className="settings-chip-row">
          {DENSITY.map((d) => (
            <button key={d.id} type="button"
              className={`settings-chip${density === d.id ? " settings-chip--active" : ""}`}
              onClick={() => applyDensity(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="settings-row__sub" style={{ marginTop: 6 }}>
          {density === "compact" ? "Tighter spacing between messages." : "Comfortable spacing between messages."}
        </p>
      </section>
    </div>
  );
}

function ChatSection() {
  const [enterToSend, setEnterToSend] = useState(() => localStorage.getItem("chat-enter-send") !== "false");
  const [showTimestamps, setShowTimestamps] = useState(() => localStorage.getItem("chat-timestamps") !== "false");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("chat-sound") === "true");
  const [showShortcuts, setShowShortcuts] = useState(false);

  function toggle(key, value, setter) {
    setter(value);
    localStorage.setItem(key, String(value));
    window.dispatchEvent(new CustomEvent("chat-pref-change", { detail: { key, value } }));
  }

  return (
    <div className="settings-panel-body">
      <section className="settings-section">
        <h3 className="settings-section__title">Messaging</h3>
        <Row icon={MessageSquare} label="Send with Enter"
          sub="Press Enter to send. Shift+Enter for a new line."
          right={<Toggle checked={enterToSend} onChange={(v) => toggle("chat-enter-send", v, setEnterToSend)} />}
        />
        <Row label="Show message timestamps"
          sub="Display exact time on every message."
          right={<Toggle checked={showTimestamps} onChange={(v) => toggle("chat-timestamps", v, setShowTimestamps)} />}
        />
        <Row label="Message sounds"
          sub="Play a sound when you receive a message."
          right={<Toggle checked={soundEnabled} onChange={(v) => toggle("chat-sound", v, setSoundEnabled)} />}
        />
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Keyboard shortcuts</h3>
        <button type="button" className="settings-row settings-row--clickable" style={{ width: "100%" }}
          onClick={() => setShowShortcuts((s) => !s)}>
          <div className="settings-row__label"><span>View all shortcuts</span></div>
          {showShortcuts ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
        {showShortcuts && (
          <div className="shortcuts-table">
            {SHORTCUTS.map((s) => (
              <div key={s.desc} className="shortcut-row">
                <div className="shortcut-keys">
                  {s.keys.map((k) => <kbd key={k}>{k}</kbd>)}
                </div>
                <span className="shortcut-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationsSection({ notificationsSupported, notificationPermission, onEnableNotifications }) {
  const [muteAll, setMuteAll] = useState(() => localStorage.getItem("notif-mute-all") === "true");

  function toggleMuteAll(v) {
    setMuteAll(v);
    localStorage.setItem("notif-mute-all", String(v));
    window.dispatchEvent(new CustomEvent("chat-pref-change", { detail: { key: "notif-mute-all", value: v } }));
  }

  return (
    <div className="settings-panel-body">
      <section className="settings-section">
        <h3 className="settings-section__title">Browser notifications</h3>
        {notificationsSupported ? (
          <Row icon={notificationPermission === "granted" ? Bell : BellOff}
            label="Browser notifications"
            sub={notificationPermission === "granted"
              ? "Notifications are enabled."
              : notificationPermission === "denied"
                ? "Blocked — change this in browser settings."
                : "Get alerts when new messages arrive."}
            right={
              notificationPermission === "granted"
                ? <span className="pill pill--accent">On</span>
                : notificationPermission === "denied"
                  ? <span className="pill" style={{ color: "var(--clr-red)" }}>Blocked</span>
                  : <button type="button" className="primary-button"
                      style={{ height: 32, padding: "0 14px", fontSize: "var(--text-xs)" }}
                      onClick={onEnableNotifications}>Enable</button>
            }
          />
        ) : (
          <p className="settings-row__sub">Browser notifications are not supported in this browser.</p>
        )}
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">Preferences</h3>
        <Row label="Mute all conversations"
          sub="Silence every conversation globally."
          right={<Toggle checked={muteAll} onChange={toggleMuteAll} />}
        />
      </section>
    </div>
  );
}

function PrivacySection() {
  const [showReadReceipts, setShowReadReceipts] = useState(() => localStorage.getItem("priv-read-receipts") !== "false");
  const [showLastSeen, setShowLastSeen] = useState(() => localStorage.getItem("priv-last-seen") !== "false");
  const [showOnlineStatus, setShowOnlineStatus] = useState(() => localStorage.getItem("priv-online-status") !== "false");

  function toggle(key, value, setter) {
    setter(value);
    localStorage.setItem(key, String(value));
  }

  return (
    <div className="settings-panel-body">
      <section className="settings-section">
        <h3 className="settings-section__title">Visibility</h3>
        <Row icon={Shield} label="Read receipts"
          sub="Let others see when you've read their messages."
          right={<Toggle checked={showReadReceipts} onChange={(v) => toggle("priv-read-receipts", v, setShowReadReceipts)} />}
        />
        <Row label="Last seen"
          sub="Show when you were last active."
          right={<Toggle checked={showLastSeen} onChange={(v) => toggle("priv-last-seen", v, setShowLastSeen)} />}
        />
        <Row label="Online status"
          sub="Show the green dot when you're active."
          right={<Toggle checked={showOnlineStatus} onChange={(v) => toggle("priv-online-status", v, setShowOnlineStatus)} />}
        />
      </section>
      <section className="settings-section">
        <p className="settings-row__sub">
          Privacy preferences are stored locally and apply to this device only.
          Server-side enforcement will be added in a future update.
        </p>
      </section>
    </div>
  );
}

function DataSection({ onClose, onLogout }) {
  const [cleared, setCleared] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  function clearLocalData() {
    const keep = ["chat-app-token", "chat-theme", "chat-accent", "chat-font-size", "chat-density"];
    const all = Object.keys(localStorage);
    all.forEach((k) => { if (!keep.includes(k)) localStorage.removeItem(k); });
    setCleared(true);
    setConfirmClear(false);
    setTimeout(() => setCleared(false), 3000);
  }

  return (
    <div className="settings-panel-body">
      <section className="settings-section">
        <h3 className="settings-section__title">Local data</h3>
        <Row label="Clear drafts & preferences"
          sub="Removes message drafts, conversation preferences (pin/mute/archive), and cached searches."
          right={
            cleared
              ? <span className="pill pill--accent"><Check size={11} /> Done</span>
              : confirmClear
                ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="secondary-button" style={{ height: 30, padding: "0 10px", fontSize: "var(--text-xs)" }} onClick={() => setConfirmClear(false)}>Cancel</button>
                    <button type="button" className="primary-button" style={{ height: 30, padding: "0 10px", fontSize: "var(--text-xs)", background: "var(--clr-red)" }} onClick={clearLocalData}>Confirm</button>
                  </div>
                )
                : <button type="button" className="secondary-button" style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)" }} onClick={() => setConfirmClear(true)}>Clear</button>
          }
        />
      </section>
      <section className="settings-section">
        <h3 className="settings-section__title">Session</h3>
        <Row label="Sign out" sub="Log out of this device."
          right={
            <button type="button" className="secondary-button"
              style={{ height: 30, padding: "0 12px", fontSize: "var(--text-xs)", color: "var(--clr-red)", borderColor: "var(--clr-red)" }}
              onClick={() => { onClose(); onLogout(); }}>
              Sign out
            </button>
          }
        />
      </section>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="settings-panel-body">
      <section className="settings-section">
        <h3 className="settings-section__title">Real-Time Chat</h3>
        <Row label="Version" right={<span className="pill">1.0.0</span>} />
        <Row label="Stack" sub="React 19 · Node.js · Socket.io · MongoDB" />
        <Row label="Built with" sub="Vite · Express · Mongoose · Zod" />
      </section>
      <section className="settings-section">
        <h3 className="settings-section__title">Keyboard shortcuts</h3>
        <div className="shortcuts-table">
          {SHORTCUTS.map((s) => (
            <div key={s.desc} className="shortcut-row">
              <div className="shortcut-keys">{s.keys.map((k) => <kbd key={k}>{k}</kbd>)}</div>
              <span className="shortcut-desc">{s.desc}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ── main modal ─────────────────────────────────────────────── */
export default function SettingsModal({
  open, onClose,
  notificationsSupported, notificationPermission, onEnableNotifications,
  onLogout,
}) {
  const { user, token, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");

  if (!open) return null;

  const sections = {
    profile:       <ProfileSection user={user} token={token} onUserUpdated={updateUser} />,
    appearance:    <AppearanceSection />,
    chat:          <ChatSection />,
    notifications: <NotificationsSection notificationsSupported={notificationsSupported} notificationPermission={notificationPermission} onEnableNotifications={onEnableNotifications} />,
    privacy:       <PrivacySection />,
    data:          <DataSection onClose={onClose} onLogout={onLogout} />,
    about:         <AboutSection />,
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card settings-modal" role="dialog" aria-modal="true" aria-label="Settings">

        {/* ── header ── */}
        <div className="modal-header">
          <div>
            <h2>Settings</h2>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--clr-ink-3)", marginTop: 2 }}>
              {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* ── body: nav + panel ── */}
        <div className="settings-modal__layout">
          {/* Sidebar nav */}
          <nav className="settings-nav" aria-label="Settings sections">
            {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                className={`settings-nav-item${activeSection === id ? " settings-nav-item--active" : ""}`}
                onClick={() => setActiveSection(id)}
                aria-current={activeSection === id}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div className="settings-panel">
            {sections[activeSection]}
          </div>
        </div>

      </div>
    </div>
  );
}
