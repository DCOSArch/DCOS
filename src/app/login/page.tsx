'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, ArrowRight, Loader2 } from 'lucide-react';
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
      // Reset opacity first
      const items = containerRef.current.querySelectorAll('.anime-item');
      items.forEach((item: any) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
      });

      animate('.anime-item', {
        opacity: [0, 1],
        translateY: [20, 0],
        delay: stagger(100, { start: 300 }),
        ease: 'outQuad',
        duration: 800
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
    <div ref={containerRef} className="min-h-screen w-full bg-[#272822] flex flex-col lg:flex-row overflow-hidden">
      {/* Left Column: Form */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          
          <div className="text-center mb-8 anime-item">
            <div className="inline-flex items-center justify-center p-4 bg-[#1E1F1C]/60 border border-[#3E3D32] shadow-xl rounded-2xl mb-6 backdrop-blur-md">
              <Stethoscope className="w-10 h-10 text-[#66D9EF]" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              <ShinyText text="DentalConnect OS" speed={3} className="text-[#F3F1E7]" />
            </h1>
            <p className="text-lg text-[#C2BEAD] font-medium">Log in to your dashboard.</p>
          </div>

          <Card className="anime-item border border-[#3E3D32] bg-[#1E1F1C]/80 backdrop-blur-2xl shadow-2xl text-[#F3F1E7] rounded-2xl overflow-hidden transition-all">
            <CardHeader className="text-center pb-6 border-b border-[#3E3D32]/80 anime-item">
              <CardTitle className="text-2xl font-bold tracking-tight text-[#F3F1E7]">
                {authMode === 'signup' && 'Create an Account'}
                {authMode === 'signin' && 'Welcome Back'}
                {authMode === 'forgot' && 'Reset Password'}
                {authMode === 'reset' && 'Set New Password'}
              </CardTitle>
              <CardDescription className="text-[#C2BEAD] font-medium">
                {authMode === 'signup' && 'Enter your details below to create your account'}
                {authMode === 'signin' && 'Enter your credentials to access your portal'}
                {authMode === 'forgot' && 'Enter your email to receive a password reset link'}
                {authMode === 'reset' && 'Enter your new secure password'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {errorMsg && (
                  <div className="anime-item bg-red-950/50 border-2 border-red-500 text-red-400 p-3 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)] text-sm text-center font-bold">
                    {errorMsg}
                  </div>
                )}
                
                {authMode === 'signup' && (
                  <>
                    <div className="space-y-2 anime-item">
                      <Label htmlFor="fullName" className="font-semibold text-[#D6D2C4]">Full Name</Label>
                      <Input 
                        id="fullName" 
                        placeholder="e.g. Dr. Jane Smith" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required 
                        className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#A6E22E] focus-visible:border-[#A6E22E] rounded-lg transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2 anime-item">
                      <Label htmlFor="role" className="font-semibold text-[#D6D2C4]">Role</Label>
                      <Select value={role} onValueChange={(val) => { if (val) setRole(val as Role) }}>
                        <SelectTrigger className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] rounded-lg focus:ring-1 focus:ring-[#A6E22E] focus:border-[#A6E22E] transition-all shadow-sm">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E1F1C] border border-[#3E3D32] text-[#F3F1E7] rounded-lg shadow-xl">
                          <SelectItem value="DENTIST" className="focus:bg-[#3E3D32]">Dentist / Clinic</SelectItem>
                          <SelectItem value="LAB_ADMIN" className="focus:bg-[#3E3D32]">Laboratory Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {role === 'LAB_ADMIN' && (
                      <div className="space-y-2 anime-item">
                        <Label htmlFor="labName" className="font-semibold text-[#D6D2C4]">Laboratory Name</Label>
                        <Input 
                          id="labName" 
                          placeholder="e.g. Apex Dental Labs" 
                          value={labName}
                          onChange={(e) => setLabName(e.target.value)}
                          required 
                          className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#A6E22E] focus-visible:border-[#A6E22E] rounded-lg transition-all shadow-sm"
                        />
                      </div>
                    )}
                  </>
                )}

                {(authMode === 'signin' || authMode === 'signup' || authMode === 'forgot') && (
                  <div className="space-y-2 anime-item">
                    <Label htmlFor="email" className="font-semibold text-[#D6D2C4]">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#A6E22E] focus-visible:border-[#A6E22E] rounded-lg transition-all shadow-sm"
                    />
                  </div>
                )}

                {(authMode === 'signin' || authMode === 'signup') && (
                  <div className="space-y-2 anime-item">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="font-semibold text-[#D6D2C4]">Password</Label>
                      {authMode === 'signin' && (
                        <button 
                          type="button" 
                          onClick={() => setAuthMode('forgot')} 
                          className="text-xs text-[#66D9EF] font-semibold hover:text-[#F3F1E7] hover:underline focus:outline-none transition-colors"
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
                      className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#A6E22E] focus-visible:border-[#A6E22E] rounded-lg transition-all shadow-sm"
                    />
                  </div>
                )}

                {authMode === 'reset' && (
                  <>
                    <div className="space-y-2 anime-item">
                      <Label htmlFor="newPassword" className="font-semibold text-[#D6D2C4]">New Password</Label>
                      <Input 
                        id="newPassword" 
                        type="password" 
                        placeholder="Minimum 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required 
                        minLength={6}
                        className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#A6E22E] focus-visible:border-[#A6E22E] rounded-lg transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2 anime-item">
                      <Label htmlFor="confirmPassword" className="font-semibold text-[#D6D2C4]">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        placeholder="Repeat new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                        minLength={6}
                        className="border border-[#3E3D32] bg-[#272822]/50 text-[#F3F1E7] placeholder:text-[#8E8B7F] focus-visible:ring-1 focus-visible:ring-[#A6E22E] focus-visible:border-[#A6E22E] rounded-lg transition-all shadow-sm"
                      />
                    </div>
                  </>
                )}

                <div className="anime-item pt-4">
                  <ShimmerButton 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-11 text-[#272822] font-extrabold tracking-wide shadow-lg rounded-lg"
                    shimmerColor="rgba(0,0,0,0.2)"
                    background="#F3F1E7"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {authMode === 'signup' && 'Sign Up'}
                    {authMode === 'signin' && 'Sign In'}
                    {authMode === 'forgot' && 'Send Reset Link'}
                    {authMode === 'reset' && 'Update Password'}
                    {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </ShimmerButton>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t border-[#3E3D32]/80 bg-[#1E1F1C]/90 pt-6 anime-item">
              {authMode === 'forgot' || authMode === 'reset' ? (
                <button 
                  type="button" 
                  onClick={() => setAuthMode('signin')} 
                  className="text-sm text-[#66D9EF] font-semibold hover:text-[#F3F1E7] transition-colors focus:outline-none"
                >
                  Back to Sign In
                </button>
              ) : (
                <p className="text-sm text-[#C2BEAD] font-medium">
                  {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')} 
                    className="text-[#A6E22E] font-semibold hover:text-[#F3F1E7] transition-colors focus:outline-none"
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
              {/* Minimal Accent Line */}
              <div className="h-[2px] w-16 bg-[#A6E22E] rounded anime-item" />
              
              <h2 className="text-4xl lg:text-5xl font-light text-[#F3F1E7] leading-tight tracking-tight anime-item">
                Uniting clinics and laboratories in <span className="font-semibold text-[#66D9EF]">one unified workspace</span>.
              </h2>
              
              <p className="text-base text-[#C2BEAD] leading-relaxed font-medium max-w-md anime-item">
                Experience seamless 3D case routing, instant messaging, and automated turnaround tracking built for the future of dentistry.
              </p>
           </div>
        </AuroraBackground>
      </div>
    </div>
  );
}
