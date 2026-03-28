
import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { RegistrationSuccess } from './pages/auth/RegistrationSuccess';
import { EmployerDashboard } from './pages/dashboard/EmployerDashboard';
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard';
import { JobFeed } from './pages/jobs/JobFeed';
import { JobDetails } from './pages/jobs/JobDetails';
import { MyApplications } from './pages/jobs/MyApplications';
import { EmployerJobs } from './pages/jobs/EmployerJobs';
import { ApplicantsList } from './pages/jobs/ApplicantsList';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Navbar } from './components/Navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => (
    <>
        <Navbar />
        <Outlet />
    </>
);

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/login', element: <Login /> },
            { path: '/register', element: <Register /> },
            { path: '/registration-success', element: <RegistrationSuccess /> },
            { path: '/dashboard/employer', element: <EmployerDashboard /> },
            { path: '/dashboard/employee', element: <EmployeeDashboard /> },
            { path: '/jobs', element: <JobFeed /> },
            { path: '/jobs/:id', element: <JobDetails /> },
            { path: '/my-applications', element: <MyApplications /> },
            { path: '/employer/jobs', element: <EmployerJobs /> },
            { path: '/employer/jobs/:id/applicants', element: <ApplicantsList /> },
            { path: '/admin-login', element: <AdminLogin /> },
        ]
    },
    { path: '/admin', element: <AdminDashboard /> },
]);
