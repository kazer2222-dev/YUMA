'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, RotateCcw, Mail } from 'lucide-react';
import { useToastHelpers } from '@/components/toast';

interface PinVerificationProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function PinVerification({ email, onBack, onSuccess }: PinVerificationProps) {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resendCount, setResendCount] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const { success, error: showError, info } = useToastHelpers();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newPin = pastedData.split('');
      setPin(newPin);
      document.getElementById('pin-5')?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 6) {
      setError('Please enter the complete 6-digit PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, pin: pinString }),
      });

      const data = await response.json();

      console.log('[PIN Verification] Response received:', {
        success: data.success,
        hasCookies: document.cookie.includes('accessToken') || document.cookie.length > 0
      });

      if (data.success) {
        success('Verification successful', 'Welcome to YUMA!');
        // Use window.location.href for full page reload to ensure cookies are included
        setTimeout(() => {
          console.log('[PIN Verification] Navigating to home page with full reload...');
          window.location.href = '/';
        }, 500);
      } else {
        setError(data.message);
        showError('Verification failed', data.message);
      }
    } catch (err) {
      const errorMessage = 'Failed to verify PIN. Please try again.';
      setError(errorMessage);
      showError('Network Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendDisabled || resendCount >= 3) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/request-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendCount(prev => prev + 1);
        setTimeLeft(600); // Reset timer
        info('PIN resent', 'A new verification code has been sent to your email');
        if (resendCount >= 2) {
          setResendDisabled(true);
          setTimeout(() => setResendDisabled(false), 30 * 60 * 1000); // 30 minutes
        }
      } else {
        setError(data.message);
        showError('Failed to resend PIN', data.message);
      }
    } catch (err) {
      const errorMessage = 'Failed to resend PIN. Please try again.';
      setError(errorMessage);
      showError('Network Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-notion-blue/10 rounded-xl flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6 text-notion-blue" />
        </div>
        <h2 className="notion-heading-2">Check your email</h2>
        <p className="notion-text-muted">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-sm font-medium text-foreground text-center block">
            Enter verification code
          </Label>
          <div className="flex justify-center space-x-3">
            {pin.map((digit, index) => (
              <Input
                key={index}
                id={`pin-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-lg font-mono notion-input border-2 focus:border-notion-blue"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {timeLeft > 0 ? (
              <>Code expires in <span className="font-medium text-foreground font-mono">{formatTime(timeLeft)}</span></>
            ) : (
              <span className="text-destructive">Code has expired</span>
            )}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSubmit} 
          className="w-full h-11 notion-button-primary" 
          disabled={loading || pin.join('').length !== 6 || timeLeft === 0}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="flex-1 notion-button-ghost"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleResend}
            disabled={loading || resendDisabled || resendCount >= 3}
            className="flex-1 notion-button-ghost"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Resend ({3 - resendCount} left)
          </Button>
        </div>

        {resendCount >= 3 && (
          <p className="text-xs text-muted-foreground text-center">
            Maximum resends reached. Please wait 30 minutes before trying again.
          </p>
        )}
      </div>
    </div>
  );
}

