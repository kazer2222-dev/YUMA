'use client';

import { useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { PinVerification } from '@/components/auth/pin-verification';
import { useRouter } from 'next/navigation';
import { YUMALogo } from '@/components/ui/yuma-logo';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [step, setStep] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const router = useRouter();

  const handleEmailSubmitted = (submittedEmail: string) => {
    setEmail(submittedEmail);
    setStep('pin');
  };

  const handleAuthSuccess = () => {
    router.push('/');
  };

  const handleBack = () => {
    setStep('email');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-primary/80 flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center space-y-6">
          <YUMALogo showText={true} size="lg" variant="light" className="justify-center" />
          <p className="text-xl text-white/90 leading-relaxed">
            The all-in-one workspace for your team's productivity
          </p>
          <div className="space-y-4 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Task management with AI assistance</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Real-time collaboration</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Advanced reporting & analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center">
            <div className="flex justify-center mb-4">
              <YUMALogo showText={true} size="md" />
            </div>
            <p className="text-muted-foreground mt-2">
              Task management made simple
            </p>
          </div>

          {/* Auth Form */}
          <div className="notion-card p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="notion-heading-2">
                {step === 'email' ? 'Welcome back' : 'Check your email'}
              </h2>
              <p className="notion-text-muted">
                {step === 'email' 
                  ? 'Enter your email to get started' 
                  : `We sent a 6-digit code to ${email}`
                }
              </p>
            </div>

            {step === 'email' ? (
              <AuthForm
                mode={mode}
                onModeChange={setMode}
                onEmailSubmitted={handleEmailSubmitted}
              />
            ) : (
              <PinVerification
                email={email}
                onBack={handleBack}
                onSuccess={handleAuthSuccess}
              />
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              By continuing, you agree to our{' '}
              <a href="#" className="text-notion-blue hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-notion-blue hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

