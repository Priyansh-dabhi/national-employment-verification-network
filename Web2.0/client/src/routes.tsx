import { type ReactElement } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { RegistrationSuccess } from './pages/auth/RegistrationSuccess';
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard';
import { JobFeed } from './pages/jobs/JobFeed';
import { JobDetails } from './pages/jobs/JobDetails';
import { MyApplications } from './pages/jobs/MyApplications';
import { EmployerJobs } from './pages/jobs/EmployerJobs';
import { ApplicantsList } from './pages/jobs/ApplicantsList';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Navbar } from './components/Navbar';

// Employer portal pages
import { EmployerDashboardPage } from './pages/employer/EmployerDashboardPage';
import { EmployerProfilePage } from './pages/employer/EmployerProfilePage';
import { CompanyVerificationPage } from './pages/employer/CompanyVerificationPage';
import { EmployeeManagementPage } from './pages/employer/EmployeeManagementPage';
import { VerifiedEmployeesPage } from './pages/employer/VerifiedEmployeesPage';
import { VerificationRequestsPage } from './pages/employer/VerificationRequestsPage';
import { useAuth } from './context/AuthContext';
import { getAdminSession, type SessionRole } from './services/sessionService';

const Layout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

const AuthLoadingScreen = () => (
  <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--color-text-muted)' }}>
    Restoring your session...
  </div>
);

const RequireAuth = ({ allowedRoles }: { allowedRoles: SessionRole[] }) => {
  if (allowedRoles.includes('admin')) {
    const adminSession = getAdminSession();

    if (!adminSession?.isAuthenticated || !adminSession.role) {
      return <Navigate to="/login" replace />;
    }

    return <Outlet />;
  }

  const { dashboardPath, isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={dashboardPath || '/'} replace />;
  }

  return <Outlet />;
};

const RedirectIfAuthenticated = ({ children }: { children: ReactElement }) => {
  const adminSession = getAdminSession();
  const { dashboardPath, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (adminSession?.isAuthenticated && adminSession.dashboardPath) {
    return <Navigate to={adminSession.dashboardPath} replace />;
  }

  if (isAuthenticated && dashboardPath) {
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <RedirectIfAuthenticated><Login /></RedirectIfAuthenticated> },
      { path: '/register', element: <RedirectIfAuthenticated><Register /></RedirectIfAuthenticated> },
      { path: '/registration-success', element: <RegistrationSuccess /> },
      { path: '/dashboard/employer', element: <Navigate to="/employer/dashboard" replace /> },
      { path: '/admin-login', element: <Navigate to="/login" replace /> },
    ],
  },
  {
    element: <RequireAuth allowedRoles={['employee']} />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/dashboard/employee', element: <EmployeeDashboard /> },
          { path: '/jobs', element: <JobFeed /> },
          { path: '/jobs/:id', element: <JobDetails /> },
          { path: '/my-applications', element: <MyApplications /> },
        ],
      },
    ],
  },
  {
    element: <RequireAuth allowedRoles={['employer']} />,
    children: [
      { path: '/employer/dashboard', element: <EmployerDashboardPage /> },
      { path: '/employer/profile', element: <EmployerProfilePage /> },
      { path: '/employer/company-verification', element: <CompanyVerificationPage /> },
      { path: '/employer/employees', element: <EmployeeManagementPage /> },
      { path: '/employer/verified-employees', element: <VerifiedEmployeesPage /> },
      { path: '/employer/verification-requests', element: <VerificationRequestsPage /> },
      { path: '/employer/jobs', element: <EmployerJobs /> },
      { path: '/employer/jobs/:id/applicants', element: <ApplicantsList /> },
    ],
  },
  {
    element: <RequireAuth allowedRoles={['admin']} />,
    children: [
      {
        element: <Layout />,
        children: [{ path: '/admin', element: <AdminDashboard /> }],
      },
    ],
  },
]);
