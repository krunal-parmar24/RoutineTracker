import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import DashboardPage from '../pages/DashboardPage';
import HistoryPage from '../pages/HistoryPage';
import LoginPage from '../pages/LoginPage';
import RoutinePage from '../pages/RoutinePage';
import TodoDetailPage from '../pages/TodoDetailPage';
import InsightsPage from '../pages/InsightsPage';
import ProtectedRoute from './ProtectedRoute';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="todo/:todoId" element={<TodoDetailPage />} />
        <Route path="routine" element={<RoutinePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="insights" element={<InsightsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
