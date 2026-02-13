import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Lock, User, KeyRound, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { authenticate } from '../lib/auth';
import { toast } from 'sonner';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }

    setIsLoading(true);

    try {
      const user = await authenticate({ username, password });
      
      if (user) {
        toast.success(`Welcome, ${user.username}`);
        navigate('/');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-lg mb-4">
            <Lock className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">PhishGuard AI</h1>
          <p className="text-sm text-muted-foreground">
            Security Operations Console
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs">
            <Shield className="w-3 h-3" />
            <span>OFFLINE MODE • SECURE</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Operator ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter operator ID"
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Access Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access code"
                  className="pl-10"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Access Console'}
            </Button>
          </form>

          {/* Demo Credentials Info */}
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

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Critical Infrastructure Security System</p>
          <p className="mt-1">Unauthorized access is prohibited</p>
        </div>
      </div>
    </div>
  );
}
