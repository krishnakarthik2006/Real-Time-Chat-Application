import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import { ThemeProvider } from "./theme/ThemeContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/global.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
