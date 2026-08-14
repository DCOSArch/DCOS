'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, ArrowRight, Loader2, Sparkles, Building2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { animate, stagger } from 'animejs';

// Custom UI Components
import { AuroraBackground } from '@/components/ui/aceternity/aurora-background';
import { PaperShaderBackground } from '@/components/ui/shaders/PaperShader';
import { ShinyText } from '@/components/ui/reactbits/shiny-text';
import { ShimmerButton } from '@/components/ui/magic/shimmer-button';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Read URL parameters on mount to check if this is a password reset redirection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);

      if (searchParams.get('mode') === 'reset' || hashParams.get('type') === 'recovery') {
        setAuthMode('reset');
      }
    }
  }, []);

  // Anime.js animation trigger
  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll('.anime-item');
      items.forEach((item: any) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(16px)';
      });

      animate('.anime-item', {
        opacity: [0, 1],
        translateY: [16, 0],
        delay: stagger(60, { start: 100 }),
        ease: 'outQuad',
        duration: 600,
      });
    }
  }, [authMode]);

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
          throw new Error('Passwords do not match');
        }
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
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
      setErrorMsg(error.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole: 'DENTIST' | 'LAB_ADMIN') => {
    setLoading(true);
    setErrorMsg('');

    const demoEmail = demoRole === 'DENTIST' ? 'dentist@dcos.in' : 'lab@dcos.in';
    const demoPassword = 'Password123!';

    try {
      // 1. Try logging in with demo account
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) {
        // If demo account doesn't exist yet, sign it up automatically
        const { error: signUpError } = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
          options: {
            data: {
              full_name: demoRole === 'DENTIST' ? 'Dr. Maneesh Vishnoi' : 'Advance Dental Export',
              role: demoRole,
              lab_name: demoRole === 'LAB_ADMIN' ? 'Advance Dental Export' : undefined,
            },
          },
        });

        if (!signUpError) {
          // Attempt sign in once more
          await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });
        }
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.warn('Demo login issue, falling back to direct navigation:', err);
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-[#272822] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Column: Form */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 anime-item">
            <div className="inline-flex items-center justify-center p-3.5 bg-[#1E1F1C]/80 border border-[#3E3D32] shadow-xl rounded-2xl mb-4 backdrop-blur-md">
              <Stethoscope className="w-8 h-8 text-[#66D9EF]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1">
              <ShinyText text="DentalConnect OS" speed={3} className="text-[#F3F1E7]" />
            </h1>
            <p className="text-sm sm:text-base text-[#C2BEAD] font-medium">
              Clinic & Laboratory Collaboration Workspace
            </p>
          </div>

          {/* Quick Demo Login Cards */}
          <div className="anime-item grid grid-cols-2 gap-2.5 mb-5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('DENTIST')}
              className="flex items-center gap-2 p-3 rounded-xl bg-[#1E1F1C]/90 border border-[#3E3D32] hover:border-[#66D9EF] text-left transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <div className="p-2 rounded-lg bg-[#66D9EF]/15 text-[#66D9EF] group-hover:bg-[#66D9EF] group-hover:text-[#272822] transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#F3F1E7] block">Demo Dentist</span>
                <span className="text-[10px] text-[#C2BEAD]">Dr. Maneesh</span>
              </div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('LAB_ADMIN')}
              className="flex items-center gap-2 p-3 rounded-xl bg-[#1E1F1C]/90 border border-[#3E3D32] hover:border-[#A6E22E] text-left transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <div className="p-2 rounded-lg bg-[#A6E22E]/15 text-[#A6E22E] group-hover:bg-[#A6E22E] group-hover:text-[#272822] transition-colors">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#F3F1E7] block">Demo Dental Lab</span>
                <span className="text-[10px] text-[#C2BEAD]">Advance Lab</span>
              </div>
            </button>
          </div>

          <Card className="anime-item border border-[#3E3D32] bg-[#1E1F1C]/80 backdrop-blur-2xl shadow-2xl text-[#F3F1E7] rounded-2xl overflow-hidden transition-all">
            <CardHeader className="text-center pb-5 border-b border-[#3E3D32]/80 anime-item">
              <CardTitle className="text-xl font-bold tracking-tight text-[#F3F1E7]">
                {authMode === 'signup' && 'Create Practice Account'}
                {authMode === 'signin' && 'Sign in to your account'}
                {authMode === 'forgot' && 'Reset Password'}
                {authMode === 'reset' && 'Set New Password'}
              </CardTitle>
              <CardDescription className="text-xs text-[#C2BEAD]">
                {authMode === 'signup' && 'Enter your practice details below to get started'}
                {authMode === 'signin' && 'Enter your credentials to access your workspace'}
                {authMode === 'forgot' && 'Enter your email to receive a password reset link'}
                {authMode === 'reset' && 'Enter your new secure password'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="anime-item bg-red-950/50 border border-red-500 text-red-400 p-2.5 rounded-lg text-xs text-center font-semibold">
                    {errorMsg}
                  </div>
                )}

                {authMode === 'signup' && (
                  <>
                    <div className="space-y-1.5 anime-item">
                      <Label htmlFor="fullName" className="text-xs font-semibold text-[#D6D2C4]">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. Dr. Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#66D9EF] text-xs h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5 anime-item">
                      <Label htmlFor="role" className="text-xs font-semibold text-[#D6D2C4]">Account Type</Label>
                      <Select value={role} onValueChange={(val) => { if (val) setRole(val as Role); }}>
                        <SelectTrigger className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] text-xs h-9 rounded-lg">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E1F1C] border border-[#3E3D32] text-[#F3F1E7] rounded-lg shadow-xl">
                          <SelectItem value="DENTIST" className="text-xs focus:bg-[#3E3D32]">Dentist / Clinic Owner</SelectItem>
                          <SelectItem value="LAB_ADMIN" className="text-xs focus:bg-[#3E3D32]">Dental CAD/CAM Laboratory</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {role === 'LAB_ADMIN' && (
                      <div className="space-y-1.5 anime-item">
                        <Label htmlFor="labName" className="text-xs font-semibold text-[#D6D2C4]">Laboratory Name</Label>
                        <Input
                          id="labName"
                          placeholder="e.g. Advance Dental Export"
                          value={labName}
                          onChange={(e) => setLabName(e.target.value)}
                          required
                          className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#66D9EF] text-xs h-9 rounded-lg"
                        />
                      </div>
                    )}
                  </>
                )}

                {(authMode === 'signin' || authMode === 'signup' || authMode === 'forgot') && (
                  <div className="space-y-1.5 anime-item">
                    <Label htmlFor="email" className="text-xs font-semibold text-[#D6D2C4]">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@clinic.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#66D9EF] text-xs h-9 rounded-lg"
                    />
                  </div>
                )}

                {(authMode === 'signin' || authMode === 'signup') && (
                  <div className="space-y-1.5 anime-item">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold text-[#D6D2C4]">Password</Label>
                      {authMode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgot')}
                          className="text-[11px] text-[#66D9EF] hover:underline focus:outline-none"
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
                      className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#66D9EF] text-xs h-9 rounded-lg"
                    />
                  </div>
                )}

                {authMode === 'reset' && (
                  <>
                    <div className="space-y-1.5 anime-item">
                      <Label htmlFor="newPassword" className="text-xs font-semibold text-[#D6D2C4]">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] text-xs h-9 rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5 anime-item">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#D6D2C4]">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] text-xs h-9 rounded-lg"
                      />
                    </div>
                  </>
                )}

                <div className="anime-item pt-2">
                  <ShimmerButton
                    type="submit"
                    disabled={loading}
                    className="w-full h-10 text-[#272822] font-extrabold text-xs tracking-wide shadow-md rounded-lg"
                    shimmerColor="rgba(0,0,0,0.2)"
                    background="#F3F1E7"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {authMode === 'signup' && 'Create Practice Account'}
                    {authMode === 'signin' && 'Sign In'}
                    {authMode === 'forgot' && 'Send Reset Link'}
                    {authMode === 'reset' && 'Update Password'}
                    {!loading && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
                  </ShimmerButton>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t border-[#3E3D32]/80 bg-[#1E1F1C]/90 py-4 anime-item">
              {authMode === 'forgot' || authMode === 'reset' ? (
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-xs text-[#66D9EF] font-semibold hover:underline"
                >
                  Back to Sign In
                </button>
              ) : (
                <p className="text-xs text-[#C2BEAD]">
                  {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                    className="text-[#A6E22E] font-semibold hover:underline"
                  >
                    {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Right Column: Visual Showcase */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#272822]">
        <AuroraBackground className="absolute inset-0 w-full h-full items-center justify-center p-16">
          <PaperShaderBackground />
          <div className="relative z-20 w-full max-w-lg flex flex-col space-y-6 text-left">
            <div className="h-[2px] w-16 bg-[#A6E22E] rounded anime-item" />

            <h2 className="text-4xl lg:text-5xl font-light text-[#F3F1E7] leading-tight tracking-tight anime-item">
              Uniting clinics and laboratories in <span className="font-semibold text-[#66D9EF]">one unified workspace</span>.
            </h2>

            <p className="text-base text-[#C2BEAD] leading-relaxed font-medium max-w-md anime-item">
              Experience seamless 3D case routing, intraoral scan management, and automated turnaround tracking built for the future of dentistry.
            </p>
          </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
