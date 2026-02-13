
import { createBrowserRouter } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { RegistrationSuccess } from './pages/auth/RegistrationSuccess';
import { EmployerDashboard } from './pages/dashboard/EmployerDashboard';
import { EmployeeDashboard } from './pages/dashboard/EmployeeDashboard';
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
        ]
    }
]);
