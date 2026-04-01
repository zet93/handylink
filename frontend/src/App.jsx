import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import PostJobPage from './pages/PostJobPage';
import WorkerBrowsePage from './pages/WorkerBrowsePage';
import MyJobsPage from './pages/MyJobsPage';
import WorkerProfilePage from './pages/WorkerProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import PasswordGate from './components/PasswordGate';

const queryClient = new QueryClient();
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function AuthLayout() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-gray-50">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <PasswordGate>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Elements stripe={stripePromise}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* Public routes — browsable without auth */}
            <Route element={<AuthLayout />}>
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />
              <Route path="/worker/browse" element={<WorkerBrowsePage />} />
              <Route path="/worker/:id" element={<WorkerProfilePage />} />
            </Route>

            {/* Protected routes — require auth */}
            <Route element={<ProtectedRoute><AuthLayout /></ProtectedRoute>}>
              <Route path="/post-job" element={<PostJobPage />} />
              <Route path="/my-jobs" element={<MyJobsPage />} />
              <Route path="/profile" element={<EditProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </Elements>
      </AuthProvider>
    </QueryClientProvider>
    </PasswordGate>
  );
}
