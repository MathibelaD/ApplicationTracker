import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AuthProvider } from "./auth/AuthProvider.tsx";
import { ToastProvider } from "./components/ui/Toast.tsx";
import "./index.css";
import { isSupabaseConfigured } from "./lib/supabase.ts";
import { SetupRequired } from "./pages/SetupRequired.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isSupabaseConfigured ? (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    ) : (
      <SetupRequired />
    )}
  </StrictMode>,
);
