import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CalendarPage from "./pages/dashboard/CalendarPage";
import Clients from "./pages/dashboard/Clients";
import Collaboration from "./pages/dashboard/Collaboration";
import Dashboard from "./pages/dashboard/Dashboard";
import Invoices from "./pages/dashboard/Invoices";
import Leads from "./pages/dashboard/Leads";
import Projects from "./pages/dashboard/Projects";
import Quotes from "./pages/dashboard/Quotes";
import Recruitment from "./pages/dashboard/Recruitment";
import Settings from "./pages/dashboard/Settings";
import Tasks from "./pages/dashboard/Tasks";
import Users from "./pages/dashboard/Users";
import Index from "./pages/Index";

// ─── NotFound Page ────────────────────────────────────────────────────────────
const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <h1 className="text-2xl font-bold">Page non trouvée</h1>
    <Link to="/dashboard" className="mt-4 text-primary hover:underline">
      Retour au tableau de bord
    </Link>
  </div>
);

// ─── QueryClient ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// ─── App ──────────────────────────────────────────────────────────────────────
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="bottom-right" richColors closeButton />
      <BrowserRouter>
        <Routes>
          {/* ── Routes publiques ─────────────────────────────────────────── */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ── Routes protégées (session obligatoire) ───────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/dashboard/leads" element={
            <ProtectedRoute><Leads /></ProtectedRoute>
          } />
          <Route path="/dashboard/clients" element={
            <ProtectedRoute><Clients /></ProtectedRoute>
          } />
          <Route path="/dashboard/projects" element={
            <ProtectedRoute><Projects /></ProtectedRoute>
          } />
          <Route path="/dashboard/tasks" element={
            <ProtectedRoute><Tasks /></ProtectedRoute>
          } />
          <Route path="/dashboard/calendar" element={
            <ProtectedRoute><CalendarPage /></ProtectedRoute>
          } />
          <Route path="/dashboard/settings" element={
            <ProtectedRoute><Settings /></ProtectedRoute>
          } />
          <Route path="/dashboard/users" element={
            <ProtectedRoute><Users /></ProtectedRoute>
          } />
          <Route path="/dashboard/collaboration" element={
            <ProtectedRoute><Collaboration /></ProtectedRoute>
          } />
          <Route path="/dashboard/quotes" element={
            <ProtectedRoute><Quotes /></ProtectedRoute>
          } />
          <Route path="/dashboard/invoices" element={
            <ProtectedRoute><Invoices /></ProtectedRoute>
          } />
          <Route path="/dashboard/recruitment" element={
            <ProtectedRoute><Recruitment /></ProtectedRoute>
          } />

          {/* ── 404 ──────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;