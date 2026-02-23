import { openDB } from 'idb';

// Offline-first authentication for critical infrastructure
// In production, this would integrate with facility's authentication system

interface User {
  id: string;
  username: string;
  email: string;
  role: 'operator' | 'analyst' | 'admin';
  authProvider: 'local' | 'google';
  facilityId: string;
  lastLogin: Date;
}

interface Credentials {
  usernameOrEmail: string;
  password: string;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
}

interface StoredUser {
  id: string;
  username: string;
  email: string;
  role: User['role'];
  authProvider: User['authProvider'];
  passwordHash: string | null;
  facilityId: string;
  createdAt: string;
}

// Demo credentials for offline deployment
// In production, these would be securely provisioned during installation
const DEMO_USERS = [
  { username: 'operator1', email: 'operator1@phishguard.local', password: 'SecureOps2026!', role: 'operator' as const },
  { username: 'analyst1', email: 'analyst1@phishguard.local', password: 'SecureOps2026!', role: 'analyst' as const },
  { username: 'admin1', email: 'admin1@phishguard.local', password: 'SecureOps2026!', role: 'admin' as const },
];

const SESSION_KEY = 'phishguard_session';
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours for shift work
const DB_NAME = 'phishguard_auth';
const USERS_STORE = 'users';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(USERS_STORE)) {
      const store = db.createObjectStore(USERS_STORE, { keyPath: 'id' });
      store.createIndex('username', 'username', { unique: true });
      store.createIndex('email', 'email', { unique: true });
    }
  },
});

let seedPromise: Promise<void> | null = null;

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function ensureSeededUsers(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const db = await dbPromise;
      const count = await db.count(USERS_STORE);
      if (count > 0) {
        return;
      }

      const tx = db.transaction(USERS_STORE, 'readwrite');
      for (const demoUser of DEMO_USERS) {
        await tx.store.add({
          id: crypto.randomUUID(),
          username: demoUser.username,
          email: demoUser.email,
          role: demoUser.role,
          authProvider: 'local',
          passwordHash: await hashPassword(demoUser.password),
          facilityId: 'FACILITY-001',
          createdAt: new Date().toISOString(),
        } satisfies StoredUser);
      }
      await tx.done;
    })();
  }

  await seedPromise;
}

function createSession(user: StoredUser): User {
  const session: User = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider,
    facilityId: user.facilityId,
    lastLogin: new Date(),
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify({
    ...session,
    expiresAt: Date.now() + SESSION_TIMEOUT,
  }));

  return session;
}

export async function authenticate(credentials: Credentials): Promise<User | null> {
  await ensureSeededUsers();
  await new Promise(resolve => setTimeout(resolve, 500));

  const db = await dbPromise;
  const byUsername = await db.getFromIndex(USERS_STORE, 'username', credentials.usernameOrEmail);
  const byEmail = await db.getFromIndex(USERS_STORE, 'email', credentials.usernameOrEmail.toLowerCase());
  const user = (byUsername ?? byEmail) as StoredUser | undefined;

  if (!user || !user.passwordHash) {
    return null;
  }

  const passwordHash = await hashPassword(credentials.password);
  if (passwordHash !== user.passwordHash) {
    return null;
  }

  return createSession(user);
}

export async function signupWithPassword(signupData: SignupData): Promise<User> {
  await ensureSeededUsers();

  const db = await dbPromise;
  const username = signupData.username.trim();
  const email = signupData.email.trim().toLowerCase();

  if (await db.getFromIndex(USERS_STORE, 'username', username)) {
    throw new Error('Username already exists');
  }

  if (await db.getFromIndex(USERS_STORE, 'email', email)) {
    throw new Error('Email already exists');
  }

  const user: StoredUser = {
    id: crypto.randomUUID(),
    username,
    email,
    role: 'operator',
    authProvider: 'local',
    passwordHash: await hashPassword(signupData.password),
    facilityId: 'FACILITY-001',
    createdAt: new Date().toISOString(),
  };

  await db.add(USERS_STORE, user);

  return createSession(user);
}

export async function authenticateWithGoogle(googleEmail: string): Promise<User> {
  await ensureSeededUsers();

  const db = await dbPromise;
  const email = googleEmail.trim().toLowerCase();
  const existingUser = await db.getFromIndex(USERS_STORE, 'email', email) as StoredUser | undefined;

  if (existingUser) {
    return createSession(existingUser);
  }

  const username = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24) || `user-${Date.now()}`;
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    username,
    email,
    role: 'operator',
    authProvider: 'google',
    passwordHash: null,
    facilityId: 'FACILITY-001',
    createdAt: new Date().toISOString(),
  };

  await db.add(USERS_STORE, newUser);

  return createSession(newUser);
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
      email: session.email,
      role: session.role,
      authProvider: session.authProvider,
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
