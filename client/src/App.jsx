import { useAuth } from "./auth/AuthContext";
import AuthScreen from "./components/AuthScreen";
import ChatDashboard from "./components/ChatDashboard";

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <div className="loader-card">
        <div style={{ fontSize: "2.5rem" }}>💬</div>
        <div className="loader-spinner" />
        <div>
          <h1>Chat</h1>
          <p>Restoring your session…</p>
        </div>
      </div>
    </main>
  );
}

export default function App() {
  const { user, initializing } = useAuth();
  if (initializing) return <LoadingScreen />;
  if (!user)        return <AuthScreen />;
  return <ChatDashboard />;
}
