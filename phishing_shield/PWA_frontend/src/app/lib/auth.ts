// Offline-first authentication for critical infrastructure
// In production, this would integrate with facility's authentication system

interface User {
  id: string;
  username: string;
  role: 'operator' | 'analyst' | 'admin';
  facilityId: string;
  lastLogin: Date;
}

interface Credentials {
  username: string;
  password: string;
}

// Demo credentials for offline deployment
// In production, these would be securely provisioned during installation
const DEMO_USERS = [
  { username: 'operator1', password: 'SecureOps2026!', role: 'operator' as const },
  { username: 'analyst1', password: 'SecureOps2026!', role: 'analyst' as const },
  { username: 'admin1', password: 'SecureOps2026!', role: 'admin' as const },
];

const SESSION_KEY = 'phishguard_session';
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours for shift work

export async function authenticate(credentials: Credentials): Promise<User | null> {
  // Simulate authentication delay (real system would check secure storage)
  await new Promise(resolve => setTimeout(resolve, 500));

  const user = DEMO_USERS.find(
    u => u.username === credentials.username && u.password === credentials.password
  );

  if (!user) {
    return null;
  }

  const session: User = {
    id: `user-${Date.now()}`,
    username: user.username,
    role: user.role,
    facilityId: 'FACILITY-001',
    lastLogin: new Date(),
  };

  // Store session
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    ...session,
    expiresAt: Date.now() + SESSION_TIMEOUT,
  }));

  return session;
}

export function getCurrentUser(): User | null {
  const sessionData = localStorage.getItem(SESSION_KEY);
  if (!sessionData) return null;

  try {
    const session = JSON.parse(sessionData);
    
    // Check if session expired
    if (session.expiresAt < Date.now()) {
      logout();
      return null;
    }

    return {
      id: session.id,
      username: session.username,
      role: session.role,
      facilityId: session.facilityId,
      lastLogin: new Date(session.lastLogin),
    };
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
