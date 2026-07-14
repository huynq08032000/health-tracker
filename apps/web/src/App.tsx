import { ConfigProvider } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { FoodLogPage } from './pages/FoodLogPage';
import { DailyLogPage } from './pages/DailyLogPage';
import { TrendsPage } from './pages/TrendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { antdTheme } from './theme/antd-theme';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useAppLoading } from './hooks/useAppLoading';
import { GlobalLoading } from './components/GlobalLoading';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { userId } = useCurrentUser();
  if (userId == null) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { userId } = useCurrentUser();
  if (userId != null) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isLoading } = useAppLoading();

  return (
    <ConfigProvider theme={antdTheme}>
      {isLoading && <GlobalLoading />}
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/food" element={
          <ProtectedRoute>
            <Layout>
              <FoodLogPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/daily" element={
          <ProtectedRoute>
            <Layout>
              <DailyLogPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/trends" element={
          <ProtectedRoute>
            <Layout>
              <TrendsPage />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ConfigProvider>
  );
}
