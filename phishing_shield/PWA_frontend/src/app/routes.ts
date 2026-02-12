import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { ThreatScanConsole } from './pages/ThreatScanConsole';
import { ScanHistory } from './pages/ScanHistory';
import { ThreatAnalytics } from './pages/ThreatAnalytics';
import { SystemStatus } from './pages/SystemStatus';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: ThreatScanConsole },
      { path: 'history', Component: ScanHistory },
      { path: 'analytics', Component: ThreatAnalytics },
      { path: 'system', Component: SystemStatus },
    ],
  },
]);
