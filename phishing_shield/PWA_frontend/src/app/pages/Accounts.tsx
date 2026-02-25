import { getCurrentUser } from '../lib/auth';

export function Accounts() {
  const user = getCurrentUser();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-2">Accounts</h1>
      <p className="text-muted-foreground mb-6">Authenticated account landing page.</p>

      {user ? (
        <div className="rounded-lg border border-border bg-card p-6 space-y-2 max-w-xl">
          <p><span className="text-muted-foreground">Username:</span> {user.username}</p>
          <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
          <p><span className="text-muted-foreground">Provider:</span> {user.authProvider}</p>
          <p><span className="text-muted-foreground">Role:</span> {user.role}</p>
        </div>
      ) : (
        <p>No user found.</p>
      )}
    </div>
  );
}
