import { lazy, Suspense } from "react";
import { useAuth } from "./auth/AuthContext";
import AuthScreen from "./components/AuthScreen";

// Lazy-load the full chat UI — it's large and only needed after login.
// The auth screen and loading skeleton are kept in the main chunk.
const ChatDashboard = lazy(() => import("./components/ChatDashboard"));

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
  if (!user) return <AuthScreen />;
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ChatDashboard />
    </Suspense>
  );
}
