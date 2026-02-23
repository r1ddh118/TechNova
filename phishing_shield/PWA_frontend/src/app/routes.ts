import { createBrowserRouter, redirect } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { Login } from './pages/Login';
import ThreatScanConsole from './pages/ThreatScanConsole';
import { ScanHistory } from './pages/ScanHistory';
import { ThreatAnalytics } from './pages/ThreatAnalytics';
import { SystemStatus } from './pages/SystemStatus';
import { ExplainabilityDetails } from './pages/ExplainabilityDetails';

// Inline auth check to avoid module-level localStorage access
function checkAuth(): boolean {
  if (typeof window === 'undefined') return false;
  const sessionData = localStorage.getItem('phishguard_session');
  if (!sessionData) return false;
  try {
    const session = JSON.parse(sessionData);
    return session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

// Loader function to check authentication
function protectedLoader() {
  if (!checkAuth()) {
    return redirect('/login');
  }
  return null;
}

// Loader for login page - redirect if already authenticated
function loginLoader() {
  if (checkAuth()) {
    return redirect('/');
  }
  return null;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
    loader: loginLoader,
  },
  {
    path: '/',
    Component: RootLayout,
    loader: protectedLoader,
    children: [
      { index: true, Component: ThreatScanConsole },
      { path: 'history', Component: ScanHistory },
      { path: 'history/explainability/:scanId', Component: ExplainabilityDetails },
      { path: 'analytics', Component: ThreatAnalytics },
      { path: 'system', Component: SystemStatus },
      { path: '*', loader: () => redirect('/') },
    ],
  },
  {
    path: '*',
    loader: () => redirect('/login'),
  },
]);