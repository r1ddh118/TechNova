import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function App() {
  const [isDark, setIsDark] = useState(true); // Changed back to true for dark mode default

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <>
      {/* Theme toggle button - fixed position */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-lg bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      
      <RouterProvider router={router} />
      <Toaster position="top-right" theme={isDark ? "dark" : "light"} />
    </>
  );
}