import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Avatar, Button, Navbar } from '../ui/index.js';
import { useToast } from '../ui/Toast.jsx';

export default function EmployerNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  async function signOut() {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      toast(
        'Unable to sign out right now. Please try again.',
        { tone: 'error' },
      );
    }
  }

  return (
    <Navbar
      brandHref="/employer/dashboard"
      mobileMenuItems={[
        {
          label: 'Jobs',
          to: '/employer/dashboard',
        },
        {
          label: 'Company profile',
          to: '/employer/company',
        },
        {
          label: 'Notifications',
          to: '/employer/notifications',
        },
      ]}
      actions={
        <>
          {/* Jobs */}
          <Link
            to="/employer/dashboard"
            className={[
              'hidden',
              'rounded-xl',
              'border',
              'border-transparent',
              'bg-white/[0.025]',
              'px-3',
              'py-2',
              'text-sm',
              'font-medium',
              'text-slate-300',
              'transition-all',
              'duration-200',
              'hover:-translate-y-0.5',
              'hover:border-white/[0.10]',
              'hover:bg-white/[0.065]',
              'hover:text-white',
              'focus-visible:outline-none',
              'focus-visible:ring-4',
              'focus-visible:ring-cyan-400/15',
              'sm:block',
            ].join(' ')}
          >
            Jobs
          </Link>

          {/* Company */}
          <Link
            to="/employer/company"
            className={[
              'hidden',
              'rounded-xl',
              'border',
              'border-transparent',
              'bg-white/[0.025]',
              'px-3',
              'py-2',
              'text-sm',
              'font-medium',
              'text-slate-300',
              'transition-all',
              'duration-200',
              'hover:-translate-y-0.5',
              'hover:border-white/[0.10]',
              'hover:bg-white/[0.065]',
              'hover:text-white',
              'focus-visible:outline-none',
              'focus-visible:ring-4',
              'focus-visible:ring-cyan-400/15',
              'sm:block',
            ].join(' ')}
          >
            Company
          </Link>

          {/* Notifications */}
          <Link
            to="/employer/notifications"
            className={[
              'hidden',
              'rounded-xl',
              'border',
              'border-transparent',
              'bg-white/[0.025]',
              'px-3',
              'py-2',
              'text-sm',
              'font-medium',
              'text-slate-300',
              'transition-all',
              'duration-200',
              'hover:-translate-y-0.5',
              'hover:border-cyan-300/15',
              'hover:bg-cyan-400/[0.045]',
              'hover:text-cyan-100',
              'focus-visible:outline-none',
              'focus-visible:ring-4',
              'focus-visible:ring-cyan-400/15',
              'md:block',
            ].join(' ')}
          >
            Notifications
          </Link>

          {/* User avatar */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-1 backdrop-blur-xl">
            <Avatar
              name={user.email}
              size="sm"
            />
          </div>

          {/* Sign out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
          >
            Sign out
          </Button>
        </>
      }
    />
  );
}