import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Logo } from './Logo';
import { LayoutDashboard, Calendar, Settings, LogOut, X } from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-150 ${
      isActive
        ? 'font-medium text-white bg-nav-hover border-l-2 border-amber'
        : 'text-tertiary hover:bg-nav-hover hover:text-white'
    }`;

  const handleNavClick = () => {
    if (mobileOpen && onMobileClose) onMobileClose();
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={`fixed left-0 top-0 w-60 h-screen bg-nav flex flex-col z-50 transition-transform duration-250 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-6 py-6 flex items-center justify-between">
          <Logo color="#FFFFFF" size={24} />
          {mobileOpen && (
            <button onClick={onMobileClose} className="text-tertiary hover:text-white md:hidden">
              <X size={20} />
            </button>
          )}
        </div>
        <div className="border-b border-nav-hover" />
        <nav className="flex-1 py-2 flex flex-col gap-1">
          <NavLink to="/dashboard" className={linkClass} onClick={handleNavClick}>
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/events" className={linkClass} onClick={handleNavClick}>
            <Calendar size={16} />
            Events
          </NavLink>
          <NavLink to="/settings" className={linkClass} onClick={handleNavClick}>
            <Settings size={16} />
            Settings
          </NavLink>
        </nav>
        <div className="px-6 py-6 border-t border-nav-hover">
          <p className="text-xs text-secondary font-normal">{profile?.name || ''}</p>
          <p className="text-xs text-tertiary font-normal mt-0.5">{profile?.email || ''}</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-tertiary hover:text-white mt-3 transition-colors duration-150"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
