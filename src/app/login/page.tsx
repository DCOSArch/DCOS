'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, ArrowRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Role = 'DENTIST' | 'LAB_ADMIN';

export default function Login() {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('DENTIST');
  const [labName, setLabName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  // Read URL parameters on mount to check if this is a password reset redirection
  useState(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      if (searchParams.get('mode') === 'reset' || hashParams.get('type') === 'recovery') {
        setAuthMode('reset');
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (authMode === 'signup') {
        const metadata: any = {
          full_name: fullName,
          role: role,
        };
        if (role === 'LAB_ADMIN') {
          metadata.lab_name = labName;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        });
        if (error) throw error;
        alert('Sign up successful! You can now log in.');
        setAuthMode('signin');
      } else if (authMode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login?mode=reset`,
        });
        if (error) throw error;
        alert('Password reset link sent! Please check your email.');
        setAuthMode('signin');
      } else if (authMode === 'reset') {
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (error) throw error;
        alert('Password reset successful! You can now log in with your new password.');
        setAuthMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Stethoscope className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">DentalConnect OS</h1>
          <p className="text-lg text-muted-foreground">The premier operating system for modern dentistry.</p>
        </div>

        <Card className="border-2 shadow-xl bg-background/60 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">
              {authMode === 'signup' && 'Create an Account'}
              {authMode === 'signin' && 'Welcome Back'}
              {authMode === 'forgot' && 'Reset Password'}
              {authMode === 'reset' && 'Set New Password'}
            </CardTitle>
            <CardDescription>
              {authMode === 'signup' && 'Enter your details below to create your account'}
              {authMode === 'signin' && 'Enter your credentials to access your portal'}
              {authMode === 'forgot' && 'Enter your email to receive a password reset link'}
              {authMode === 'reset' && 'Enter your new secure password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-md text-sm text-center font-medium">
                  {errorMsg}
                </div>
              )}
              
              {authMode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input 
                      id="fullName" 
                      placeholder="e.g. Dr. Jane Smith" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(val) => { if (val) setRole(val as Role) }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DENTIST">Dentist / Clinic</SelectItem>
                        <SelectItem value="LAB_ADMIN">Laboratory Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {role === 'LAB_ADMIN' && (
                    <div className="space-y-2">
                      <Label htmlFor="labName">Laboratory Name</Label>
                      <Input 
                        id="labName" 
                        placeholder="e.g. Apex Dental Labs" 
                        value={labName}
                        onChange={(e) => setLabName(e.target.value)}
                        required 
                      />
                    </div>
                  )}
                </>
              )}

              {(authMode === 'signin' || authMode === 'signup' || authMode === 'forgot') && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              )}

              {(authMode === 'signin' || authMode === 'signup') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {authMode === 'signin' && (
                      <button 
                        type="button" 
                        onClick={() => setAuthMode('forgot')} 
                        className="text-xs text-primary hover:underline focus:outline-none"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    minLength={6}
                  />
                </div>
              )}

              {authMode === 'reset' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password" 
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required 
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                      minLength={6}
                    />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full mt-6 h-11" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {authMode === 'signup' && 'Sign Up'}
                {authMode === 'signin' && 'Sign In'}
                {authMode === 'forgot' && 'Send Reset Link'}
                {authMode === 'reset' && 'Update Password'}
                {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 border-t border-border pt-6">
            {authMode === 'forgot' || authMode === 'reset' ? (
              <button 
                type="button" 
                onClick={() => setAuthMode('signin')} 
                className="text-sm text-primary font-medium hover:underline focus:outline-none"
              >
                Back to Sign In
              </button>
            ) : (
              <p className="text-sm text-muted-foreground">
                {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button 
                  type="button" 
                  onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')} 
                  className="text-primary font-medium hover:underline focus:outline-none"
                >
                  {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
