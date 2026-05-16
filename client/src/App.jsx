import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/routes/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import AuthLayout from '@/layouts/AuthLayout';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage'));

const HRDashboard = lazy(() => import('@/pages/hr/HRDashboard'));
const DirectoryPage = lazy(() => import('@/pages/hr/DirectoryPage'));
const EmployeeDetailPage = lazy(() => import('@/pages/hr/EmployeeDetailPage'));
const SearchPage = lazy(() => import('@/pages/hr/SearchPage'));
const TeamBuilderPage = lazy(() => import('@/pages/hr/TeamBuilderPage'));
const AnalyticsPage = lazy(() => import('@/pages/hr/AnalyticsPage'));
const ChatPage = lazy(() => import('@/pages/hr/ChatPage'));
const BulkImportPage = lazy(() => import('@/pages/hr/BulkImportPage'));
const ResumeReviewsPage = lazy(() => import('@/pages/hr/ResumeReviewsPage'));

const EmployeeDashboard = lazy(() => import('@/pages/employee/EmployeeDashboard'));
const ProfilePage = lazy(() => import('@/pages/employee/ProfilePage'));
const ResumePage = lazy(() => import('@/pages/employee/ResumePage'));
const GitHubPage = lazy(() => import('@/pages/employee/GitHubPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>

              {/* HR routes */}
              <Route element={<ProtectedRoute requiredRole="hr" />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/hr" element={<HRDashboard />} />
                  <Route path="/hr/directory" element={<DirectoryPage />} />
                  <Route path="/hr/directory/:id" element={<EmployeeDetailPage />} />
                  <Route path="/hr/search" element={<SearchPage />} />
                  <Route path="/hr/team-builder" element={<TeamBuilderPage />} />
                  <Route path="/hr/analytics" element={<AnalyticsPage />} />
                  <Route path="/hr/chat" element={<ChatPage />} />
                  <Route path="/hr/bulk-import" element={<BulkImportPage />} />
                  <Route path="/hr/resume-reviews" element={<ResumeReviewsPage />} />
                </Route>
              </Route>

              {/* Employee routes */}
              <Route element={<ProtectedRoute requiredRole="employee" />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/employee" element={<EmployeeDashboard />} />
                  <Route path="/employee/profile" element={<ProfilePage />} />
                  <Route path="/employee/resume" element={<ResumePage />} />
                  <Route path="/employee/github" element={<GitHubPage />} />
                </Route>
              </Route>

              {/* Landing + fallback */}
              <Route path="/" element={<LandingPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
