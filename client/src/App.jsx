import { useAuth } from "./auth/AuthContext";
import AuthScreen from "./components/AuthScreen";
import ChatDashboard from "./components/ChatDashboard";

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <section className="loader-card">
        <div className="hero-brand">
          <div className="brand-mark" aria-hidden="true" />
          <div>
            <p className="eyebrow">PulseChat</p>
            <h1>Preparing your conversations</h1>
          </div>
        </div>
        <p className="hero-copy">
          Restoring your account, recent chats, and realtime connection.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <ChatDashboard />;
}
