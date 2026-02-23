import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User, KeyRound, Shield, AlertCircle, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { authenticate, authenticateWithGoogle, signupWithPassword } from '../lib/auth';
import { toast } from 'sonner';

type AuthMode = 'login' | 'signup';

export function Login() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (authMode === 'login') {
      if (!usernameOrEmail || !password) {
        toast.error('Please enter username/email and password');
        return;
      }

      setIsLoading(true);

      try {
        const user = await authenticate({ usernameOrEmail, password });

        if (user) {
          toast.success(`Welcome, ${user.username}`);
          navigate('/');
        } else {
          toast.error('Invalid credentials');
        }
      } catch {
        toast.error('Authentication failed');
      } finally {
        setIsLoading(false);
      }

      return;
    }

    if (!username || !email || !password) {
      toast.error('Please fill username, email and password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await signupWithPassword({ username, email, password });
      toast.success(`Account created for ${user.email}`);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const googleEmail = window.prompt('Enter your Google email for secure sign-in');
    if (!googleEmail) return;

    setIsLoading(true);
    try {
      const user = await authenticateWithGoogle(googleEmail);
      toast.success(`Signed in with Google as ${user.email}`);
      navigate('/');
    } catch {
      toast.error('Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">PhishGuard AI</h1>
          <p className="text-sm text-muted-foreground">Security Operations Console</p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs">
            <Shield className="w-3 h-3" />
            <span>OFFLINE MODE • SECURE</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <div className="grid grid-cols-2 mb-6 rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2 text-sm ${authMode === 'login' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`py-2 text-sm ${authMode === 'signup' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'login' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Operator ID / Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="Enter operator ID or email"
                    className="pl-10"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Create username"
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="pl-10"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">{authMode === 'login' ? 'Access Code' : 'Password'}</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'login' ? 'Enter access code' : 'Create password'}
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing...' : authMode === 'login' ? 'Access Console' : 'Create Account'}
            </Button>

            <Button type="button" variant="outline" className="w-full" disabled={isLoading} onClick={handleGoogleAuth}>
              Continue with Google
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Demo Credentials</span>
            </button>

            {showCredentials && (
              <div className="mt-3 p-3 bg-muted rounded text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operator:</span>
                  <span>operator1 / SecureOps2026!</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Analyst:</span>
                  <span>analyst1 / SecureOps2026!</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin:</span>
                  <span>admin1 / SecureOps2026!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Critical Infrastructure Security System</p>
          <p className="mt-1">Unauthorized access is prohibited</p>
        </div>
      </div>
    </div>
  );
}
