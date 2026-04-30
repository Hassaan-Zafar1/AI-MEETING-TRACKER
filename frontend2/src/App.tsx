import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import Navbar from './components/Navbar';

// QueryClient manages all API call caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,           // retry failed requests once
      staleTime: 30000,   // data is "fresh" for 30 seconds (no refetch)
    },
  },
});

// PrivateRoute: redirects to login if not authenticated
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Error Boundary to catch rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('React Error Boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f3f4f6',
          flexDirection: 'column',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '10px' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppRoutes() {
  return (
    <div className="app">
      <Toaster position="top-right" /> {/* notification toasts */}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes - wrapped in PrivateRoute */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Navbar />
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/meeting/:id"
          element={
            <PrivateRoute>
              <Navbar />
              <MeetingDetailPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <AppRoutes />
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;