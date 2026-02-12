import { Outlet, NavLink, useLocation } from 'react-router';
import { 
  Shield, 
  History, 
  BarChart3, 
  Settings, 
  Radio,
  Lock
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function RootLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { path: '/', label: 'Threat Scan', icon: Shield },
    { path: '/history', label: 'Scan History', icon: History },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/system', label: 'System', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">PhishGuard AI</h1>
              <p className="text-xs text-zinc-500">Security Console</p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-xs">
            <Radio className={`w-3 h-3 ${isOnline ? 'text-green-500' : 'text-yellow-500'}`} />
            <span className={isOnline ? 'text-green-500' : 'text-yellow-500'}>
              {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <div className="text-xs text-zinc-600">
            <p>Model: v2.3.1</p>
            <p>Last Sync: 2026-02-08</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
