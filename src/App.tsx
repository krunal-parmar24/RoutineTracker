import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './components/ui/ToastProvider';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function App() {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
