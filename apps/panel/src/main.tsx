import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";

import { setUnauthorizedHandler } from "@/api/client";
import { clearAuthenticatedSession, unauthenticatedStatus } from "@/lib/auth-session";
import { queryClient } from "@/lib/query-client";
import { router } from "@/router";
import "@/styles/app.css";

setUnauthorizedHandler(() => {
  void clearAuthenticatedSession(unauthenticatedStatus).then(() => {
    void router.navigate({
      to: "/login",
      search: { redirect: `${window.location.pathname}${window.location.search}` },
      replace: true,
    });
  });
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors closeButton position="bottom-right" />
    </QueryClientProvider>
  </React.StrictMode>,
);
