import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TamizajeFormPage from './pages/TamizajeFormPage';
import TamizajeListPage from './pages/TamizajeListPage';
import useAuth from './hooks/useAuth';
import useSyncManager from './hooks/useSyncManager';

const queryClient = new QueryClient();

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  useSyncManager();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={(
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            )}
          />
          <Route
            path="/nuevo"
            element={(
              <PrivateRoute>
                <TamizajeFormPage />
              </PrivateRoute>
            )}
          />
          <Route
            path="/lista"
            element={(
              <PrivateRoute>
                <TamizajeListPage />
              </PrivateRoute>
            )}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
