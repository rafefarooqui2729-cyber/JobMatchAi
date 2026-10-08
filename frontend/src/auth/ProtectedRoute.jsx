import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function roleHome(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'employer') return '/employer/dashboard';
  return '/candidate/dashboard';
}

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f8fc]" aria-label="Loading account">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-sky-100 border-t-navy-800" />
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return <Outlet />;
}
