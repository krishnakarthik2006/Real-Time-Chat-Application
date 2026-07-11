import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ThemeProvider } from "./theme/ThemeContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/global.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isGoogleConfigured = googleClientId && googleClientId !== "YOUR_GOOGLE_CLIENT_ID" && googleClientId.trim() !== "";

function AppWrapper() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      {isGoogleConfigured ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          <AppWrapper />
        </GoogleOAuthProvider>
      ) : (
        <AppWrapper />
      )}
    </ErrorBoundary>
  </StrictMode>,
);
