import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Toaster } from '@/components/ui/toast';
import { AuthProvider } from '@/features/auth/AuthContext';
import { queryClient } from '@/lib/queryClient';
import BudgetsPage from '@/pages/BudgetsPage';
import CasesPage from '@/pages/CasesPage';
import ChargesPage from '@/pages/ChargesPage';
import ClientsPage from '@/pages/ClientsPage';
import DashboardPage from '@/pages/DashboardPage';
import DocumentDetailPage from '@/pages/DocumentDetailPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ImportsPage from '@/pages/ImportsPage';
import LoginPage from '@/pages/LoginPage';
import PaymentsPage from '@/pages/PaymentsPage';
import QuotesPage from '@/pages/QuotesPage';
import ReportsPage from '@/pages/ReportsPage';
import RulesPage from '@/pages/RulesPage';
import SettingsPage from '@/pages/SettingsPage';
import TemplateDetailPage from '@/pages/TemplateDetailPage';
import TemplatesPage from '@/pages/TemplatesPage';
import UsersPage from '@/pages/UsersPage';

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <p className="text-2xl font-bold">404</p>
      <p className="text-sm text-muted-foreground">La página solicitada no existe.</p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/cases" element={<CasesPage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/templates/:id" element={<TemplateDetailPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/:id" element={<DocumentDetailPage />} />
                <Route path="/imports" element={<ImportsPage />} />
                <Route path="/quotes" element={<QuotesPage />} />
                <Route path="/budgets" element={<BudgetsPage />} />
                <Route path="/charges" element={<ChargesPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                <Route element={<ProtectedRoute permission="users.read" />}>
                  <Route path="/users" element={<UsersPage />} />
                </Route>

                <Route element={<ProtectedRoute permission="rules.read" />}>
                  <Route path="/rules" element={<RulesPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
