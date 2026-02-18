import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Activity, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMedibotsDomain = (email: string) => {
    const domain = email.substring(email.indexOf('@') + 1);
    return domain === 'medibots.com' || domain.endsWith('.medibots.com');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMedibotsDomain(email)) {
      toast({ title: 'Registration denied', description: 'Staff accounts must be created by an administrator. Use a personal email for patient registration.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account before signing in.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Signup failed.';
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 auth-bg">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl gradient-primary shadow-lg">
            <Activity className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">MediBots</h1>
            <p className="text-xs text-muted-foreground">AI Healthcare RCM</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">Patient Registration</h2>
            <p className="text-sm text-muted-foreground mt-1">Create your patient account to get started</p>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border mb-5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Staff accounts (Doctor, Billing, Insurance) are created by your system administrator.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50">
              {loading ? 'Creating account…' : 'Create Patient Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
