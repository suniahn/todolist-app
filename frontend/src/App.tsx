import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './components/common/Toast';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { TodoListPage } from './pages/TodoListPage';
import { TodoCreatePage } from './pages/TodoCreatePage';
import { TodoEditPage } from './pages/TodoEditPage';
import { CategoryPage } from './pages/CategoryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TodoListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/todos/new"
              element={
                <ProtectedRoute>
                  <TodoCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/todos/:id/edit"
              element={
                <ProtectedRoute>
                  <TodoEditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <CategoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
