import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex-1 md:ml-60">
        <div className="md:hidden sticky top-0 z-30 bg-surface border-b border-border px-5 py-3 flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="text-primary">
            <Menu size={24} />
          </button>
        </div>
        <main className="p-5 md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
