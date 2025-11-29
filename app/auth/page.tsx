'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastHelpers } from '@/components/toast';
import { 
  Loader2, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ArrowLeft,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

// Google Icon Component with fixed dimensions
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// OTP Input Component
const OTPInput = ({ 
  value, 
  onChange, 
  disabled 
}: { 
  value: string[]; 
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) => {
  const handleChange = (index: number, inputValue: string) => {
    if (inputValue.length > 1) return;
    
    const newValue = [...value];
    newValue[index] = inputValue;
    onChange(newValue);

    if (inputValue && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length === 6) {
      onChange(pastedData.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
      {value.map((digit, index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: '48px',
            height: '56px',
            textAlign: 'center',
            fontSize: '20px',
            fontFamily: 'monospace',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            color: 'white',
            outline: 'none',
          }}
        />
      ))}
    </div>
  );
};

// Styles object
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    position: 'relative' as const,
    backgroundColor: '#0a0a14',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  orb1: {
    position: 'absolute' as const,
    top: '-160px',
    right: '-160px',
    width: '384px',
    height: '384px',
    borderRadius: '50%',
    filter: 'blur(80px)',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  orb2: {
    position: 'absolute' as const,
    bottom: '-160px',
    left: '-160px',
    width: '384px',
    height: '384px',
    borderRadius: '50%',
    filter: 'blur(80px)',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    position: 'relative' as const,
    zIndex: 10,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '32px',
    textDecoration: 'none',
  },
  logoIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  },
  logoText: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'white',
  },
  card: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'white',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0,
  },
  googleBtn: {
    width: '100%',
    height: '48px',
    backgroundColor: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 500,
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '24px',
    transition: 'transform 0.2s, background-color 0.2s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    color: '#6b7280',
    fontSize: '14px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    padding: '0 16px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#d1d5db',
    marginBottom: '6px',
  },
  inputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute' as const,
    left: '12px',
    color: '#6b7280',
    pointerEvents: 'none' as const,
  },
  input: {
    width: '100%',
    height: '48px',
    paddingLeft: '44px',
    paddingRight: '44px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    fontSize: '15px',
    color: 'white',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '12px',
    padding: '12px',
    color: '#f87171',
    fontSize: '14px',
    marginBottom: '16px',
  },
  submitBtn: {
    width: '100%',
    height: '48px',
    backgroundColor: '#3b82f6',
    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'transform 0.2s, opacity 0.2s',
  },
  toggle: {
    textAlign: 'center' as const,
    marginTop: '24px',
    fontSize: '14px',
    color: '#9ca3af',
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    color: '#60a5fa',
    fontWeight: 500,
    cursor: 'pointer',
    marginLeft: '4px',
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '24px',
  },
  footerLink: {
    color: '#9ca3af',
    textDecoration: 'none',
  },
  passwordCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    marginTop: '8px',
  },
  passwordRequirements: {
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  otpHeader: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  otpIcon: {
    width: '64px',
    height: '64px',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  otpTimer: {
    textAlign: 'center' as const,
    fontSize: '14px',
    color: '#9ca3af',
    marginTop: '16px',
  },
  actionBtns: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  actionBtn: {
    flex: 1,
    height: '44px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#9ca3af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'color 0.2s, background-color 0.2s',
  },
};

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: showError, info } = useToastHelpers();
  
  const urlMode = searchParams.get('mode');
  const errorParam = searchParams.get('error');
  
  const [mode, setMode] = useState<'signin' | 'signup'>(
    urlMode === 'login' || urlMode === 'signin' ? 'signin' : 'signup'
  );
  const [step, setStep] = useState<'form' | 'otp' | 'session'>('form');
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  // Remembered user state
  const [rememberedUser, setRememberedUser] = useState<{ email: string; name?: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  // Error state
  const [error, setError] = useState('');
  
  // OTP timer
  const [timeLeft, setTimeLeft] = useState(600);
  const [resendCount, setResendCount] = useState(0);

  // Handle URL error params
  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'google_auth_failed': 'Google authentication failed. Please try again.',
        'no_code': 'Authentication failed. No authorization code received.',
        'state_mismatch': 'Authentication failed. Security check failed.',
        'token_exchange_failed': 'Authentication failed. Unable to complete sign-in.',
        'user_info_failed': 'Authentication failed. Unable to get user information.',
        'config_error': 'Google Sign-In is not configured. Please use email instead.',
        'internal_error': 'An unexpected error occurred. Please try again.',
      };
      setError(errorMessages[errorParam] || 'Authentication failed. Please try again.');
    }
  }, [errorParam]);

  // Update mode from URL
  useEffect(() => {
    if (urlMode === 'login' || urlMode === 'signin') {
      setMode('signin');
      setConfirmPassword(''); // Clear confirm password when switching to signin
    } else if (urlMode === 'signup') {
      setMode('signup');
    }
  }, [urlMode]);

  // Clear confirm password when switching modes
  useEffect(() => {
    if (mode === 'signin') {
      setConfirmPassword('');
    }
  }, [mode]);

  // Check for remembered user on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const remembered = localStorage.getItem('yuma_remembered_user');
      if (remembered) {
        const userData = JSON.parse(remembered);
        setRememberedUser(userData);
        // Check if session is still valid
        checkSessionValidity(userData.email);
      }
    } catch (err) {
      console.error('Error reading remembered user:', err);
    }
  }, []);

  // Check if session is still valid
  const checkSessionValidity = async (userEmail: string) => {
    setCheckingSession(true);
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      
      if (data.success && data.user.email === userEmail) {
        // Session is valid, show session prompt
        setStep('session');
      } else {
        // Session expired or invalid, clear remembered user
        localStorage.removeItem('yuma_remembered_user');
        setRememberedUser(null);
      }
    } catch (err) {
      // Error checking session, clear remembered user
      localStorage.removeItem('yuma_remembered_user');
      setRememberedUser(null);
    } finally {
      setCheckingSession(false);
    }
  };

  // Handle continue with remembered session
  const handleContinueSession = () => {
    router.push('/home');
  };

  // Handle switch account
  const handleSwitchAccount = () => {
    localStorage.removeItem('yuma_remembered_user');
    setRememberedUser(null);
    setStep('form');
  };

  // Save remembered user
  const saveRememberedUser = (userEmail: string, userName?: string) => {
    if (rememberMe) {
      localStorage.setItem('yuma_remembered_user', JSON.stringify({
        email: userEmail,
        name: userName
      }));
    }
  };

  // OTP timer
  useEffect(() => {
    if (step !== 'otp') return;
    
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
  }, [step]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Password validation
  const validatePassword = (pwd: string) => {
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    const hasMinLength = pwd.length >= 8;
    
    return {
      hasLowerCase,
      hasUpperCase,
      hasNumber,
      hasSymbol,
      hasMinLength,
      isValid: hasLowerCase && hasUpperCase && hasNumber && hasSymbol && hasMinLength,
    };
  };

  const passwordValidation = validatePassword(password);
  const isPasswordValid = passwordValidation.isValid;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Handle Google Sign-In
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    // Pass rememberMe as query param to store in cookie
    const rememberMeParam = rememberMe ? '?rememberMe=true' : '';
    window.location.href = `/api/auth/google${rememberMeParam}`;
  };

  // Handle Email Sign-In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        saveRememberedUser(data.user.email, data.user.name);
        success('Welcome back!', `Signed in as ${data.user.email}`);
        router.push('/home');
      } else if (data.requiresVerification) {
        setStep('otp');
        setTimeLeft(600);
        info('Verification required', 'Please verify your email first');
        await fetch('/api/auth/resend-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email Sign-Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isPasswordValid) {
      setError('Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one symbol');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (data.success) {
        success('Account created!', 'Please check your email for the verification code');
        setStep('otp');
        setTimeLeft(600);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otpString, rememberMe: mode === 'signin' ? rememberMe : false }),
      });

      const data = await response.json();

      if (data.success) {
        // Save remembered user if remember me was checked (only for signin flow)
        if (mode === 'signin' && rememberMe && data.user) {
          saveRememberedUser(data.user.email, data.user.name);
        }
        success('Email verified!', 'Welcome to YUMA');
        router.push('/home');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (resendCount >= 3) return;
    
    setResendLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setResendCount(prev => prev + 1);
        setTimeLeft(600);
        info('Code sent', 'A new verification code has been sent to your email');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background Animation */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <motion.div
          style={styles.orb1}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          style={styles.orb2}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={styles.container}
      >
        {/* Logo */}
        <Link href="/" style={styles.logo}>
          <div style={styles.logoIcon}>
            <Sparkles style={{ width: 28, height: 28, color: 'white' }} />
          </div>
          <span style={styles.logoText}>YUMA</span>
        </Link>

        {/* Card */}
        <div style={styles.card}>
          {checkingSession ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Loader2 style={{ width: 32, height: 32, color: '#3b82f6', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Checking your session...</p>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            {step === 'session' && rememberedUser ? (
              <motion.div
                key="session"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Session Prompt Header */}
                <div style={styles.header}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <User style={{ width: 32, height: 32, color: '#60a5fa' }} />
                  </div>
                  <h1 style={styles.title}>Welcome back!</h1>
                  <p style={styles.subtitle}>
                    You're signed in as
                  </p>
                </div>

                {/* User Info Card */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#60a5fa',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}>
                      {rememberedUser.name?.charAt(0)?.toUpperCase() || rememberedUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>
                        {rememberedUser.name || 'User'}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '2px' }}>
                        {rememberedUser.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={handleContinueSession}
                    disabled={checkingSession}
                    style={{
                      ...styles.submitBtn,
                      opacity: checkingSession ? 0.5 : 1,
                    }}
                  >
                    {checkingSession ? (
                      <>
                        <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                        Checking session...
                      </>
                    ) : (
                      <>
                        Continue to YUMA
                        <ArrowRight style={{ width: 20, height: 20 }} />
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSwitchAccount}
                    disabled={checkingSession}
                    style={{
                      ...styles.actionBtn,
                      opacity: checkingSession ? 0.5 : 1,
                    }}
                  >
                    Switch account
                  </button>
                </div>
              </motion.div>
            ) : step === 'form' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div style={styles.header}>
                  <h1 style={styles.title}>
                    {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                  </h1>
                  <p style={styles.subtitle}>
                    {mode === 'signin' 
                      ? 'Sign in to continue to YUMA'
                      : 'Start managing your tasks with AI'}
                  </p>
                </div>

                {/* Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || loading}
                  style={{
                    ...styles.googleBtn,
                    opacity: googleLoading || loading ? 0.5 : 1,
                  }}
                >
                  {googleLoading ? (
                    <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div style={styles.divider}>
                  <div style={styles.dividerLine} />
                  <span style={styles.dividerText}>or continue with email</span>
                  <div style={styles.dividerLine} />
                </div>

                {/* Form */}
                <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp}>
                  {/* Name field (signup only) */}
                  {mode === 'signup' && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Full name</label>
                      <div style={styles.inputWrapper}>
                        <User style={{ ...styles.inputIcon, width: 20, height: 20 }} />
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={loading}
                          style={styles.input}
                        />
                      </div>
                    </div>
                  )}

                  {/* Email field */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email address</label>
                    <div style={styles.inputWrapper}>
                      <Mail style={{ ...styles.inputIcon, width: 20, height: 20 }} />
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Password</label>
                    <div style={styles.inputWrapper}>
                      <Lock style={{ ...styles.inputIcon, width: 20, height: 20 }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        style={styles.input}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        {showPassword ? (
                          <EyeOff style={{ width: 20, height: 20 }} />
                        ) : (
                          <Eye style={{ width: 20, height: 20 }} />
                        )}
                      </button>
                    </div>
                    {mode === 'signup' && password.length > 0 && (
                      <div style={styles.passwordRequirements}>
                        <div style={{
                          ...styles.passwordCheck,
                          color: passwordValidation.hasMinLength ? '#34d399' : '#6b7280',
                        }}>
                          <Check style={{ width: 16, height: 16, opacity: passwordValidation.hasMinLength ? 1 : 0.3 }} />
                          <span>At least 8 characters</span>
                        </div>
                        <div style={{
                          ...styles.passwordCheck,
                          color: passwordValidation.hasLowerCase ? '#34d399' : '#6b7280',
                        }}>
                          <Check style={{ width: 16, height: 16, opacity: passwordValidation.hasLowerCase ? 1 : 0.3 }} />
                          <span>One lowercase letter</span>
                        </div>
                        <div style={{
                          ...styles.passwordCheck,
                          color: passwordValidation.hasUpperCase ? '#34d399' : '#6b7280',
                        }}>
                          <Check style={{ width: 16, height: 16, opacity: passwordValidation.hasUpperCase ? 1 : 0.3 }} />
                          <span>One uppercase letter</span>
                        </div>
                        <div style={{
                          ...styles.passwordCheck,
                          color: passwordValidation.hasNumber ? '#34d399' : '#6b7280',
                        }}>
                          <Check style={{ width: 16, height: 16, opacity: passwordValidation.hasNumber ? 1 : 0.3 }} />
                          <span>One number</span>
                        </div>
                        <div style={{
                          ...styles.passwordCheck,
                          color: passwordValidation.hasSymbol ? '#34d399' : '#6b7280',
                        }}>
                          <Check style={{ width: 16, height: 16, opacity: passwordValidation.hasSymbol ? 1 : 0.3 }} />
                          <span>One symbol</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password field (signup only) */}
                  {mode === 'signup' && (
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Retype your password</label>
                      <div style={styles.inputWrapper}>
                        <Lock style={{ ...styles.inputIcon, width: 20, height: 20 }} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          disabled={loading}
                          style={{
                            ...styles.input,
                            ...(confirmPassword.length > 0 && !passwordsMatch ? { borderColor: '#ef4444' } : {}),
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={styles.eyeBtn}
                        >
                          {showConfirmPassword ? (
                            <EyeOff style={{ width: 20, height: 20 }} />
                          ) : (
                            <Eye style={{ width: 20, height: 20 }} />
                          )}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && !passwordsMatch && (
                        <div style={{ ...styles.passwordCheck, color: '#ef4444', marginTop: '4px' }}>
                          <span>Passwords do not match</span>
                        </div>
                      )}
                      {confirmPassword.length > 0 && passwordsMatch && (
                        <div style={{ ...styles.passwordCheck, color: '#34d399', marginTop: '4px' }}>
                          <Check style={{ width: 16, height: 16 }} />
                          <span>Passwords match</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remember Me checkbox (signin only) */}
                  {mode === 'signin' && (
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                        style={{
                          width: '16px',
                          height: '16px',
                          cursor: 'pointer',
                          accentColor: '#3b82f6',
                        }}
                      />
                      <label
                        htmlFor="rememberMe"
                        style={{
                          fontSize: '14px',
                          color: '#d1d5db',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        Remember me
                      </label>
                    </div>
                  )}

                  {/* Error */}
                  {error && <div style={styles.error}>{error}</div>}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading || (mode === 'signup' && (!isPasswordValid || !passwordsMatch))}
                    style={{
                      ...styles.submitBtn,
                      color: '#ffffff',
                      opacity: loading || (mode === 'signup' && (!isPasswordValid || !passwordsMatch)) ? 0.5 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                        {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      <>
                        {mode === 'signin' ? 'Sign in' : 'Create account'}
                        <ArrowRight style={{ width: 20, height: 20 }} />
                      </>
                    )}
                  </button>
                </form>

                {/* Toggle mode */}
                <p style={styles.toggle}>
                  {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === 'signin' ? 'signup' : 'signin');
                        setError('');
                        setConfirmPassword(''); // Clear confirm password when switching modes
                      }}
                      style={styles.toggleBtn}
                    >
                      {mode === 'signin' ? 'Sign up' : 'Sign in'}
                    </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* OTP Header */}
                <div style={styles.otpHeader}>
                  <div style={styles.otpIcon}>
                    <Mail style={{ width: 32, height: 32, color: '#60a5fa' }} />
                  </div>
                  <h1 style={styles.title}>Check your email</h1>
                  <p style={styles.subtitle}>
                    We sent a 6-digit code to{' '}
                    <span style={{ color: 'white', fontWeight: 500 }}>{email}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <OTPInput value={otp} onChange={setOtp} disabled={loading} />

                {/* Timer */}
                <p style={styles.otpTimer}>
                  {timeLeft > 0 ? (
                    <>
                      Code expires in{' '}
                      <span style={{ color: 'white', fontFamily: 'monospace' }}>
                        {formatTime(timeLeft)}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: '#f87171' }}>Code has expired</span>
                  )}
                </p>

                {/* Error */}
                {error && <div style={{ ...styles.error, marginTop: '16px' }}>{error}</div>}

                {/* Verify button */}
                <button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
                  style={{
                    ...styles.submitBtn,
                    marginTop: '16px',
                    opacity: loading || otp.join('').length !== 6 || timeLeft === 0 ? 0.5 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                      Verifying...
                    </>
                  ) : (
                    'Verify code'
                  )}
                </button>

                {/* Action buttons */}
                <div style={styles.actionBtns}>
                  <button
                    onClick={() => {
                      setStep('form');
                      setOtp(['', '', '', '', '', '']);
                      setError('');
                    }}
                    disabled={loading}
                    style={styles.actionBtn}
                  >
                    <ArrowLeft style={{ width: 16, height: 16 }} />
                    Back
                  </button>
                  <button
                    onClick={handleResendOTP}
                    disabled={loading || resendLoading || resendCount >= 3}
                    style={{
                      ...styles.actionBtn,
                      opacity: resendCount >= 3 ? 0.5 : 1,
                    }}
                  >
                    {resendLoading ? (
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <RotateCcw style={{ width: 16, height: 16 }} />
                    )}
                    Resend ({3 - resendCount} left)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <p style={styles.footer}>
          By continuing, you agree to our{' '}
          <Link href="#" style={styles.footerLink}>Terms of Service</Link>
          {' '}and{' '}
          <Link href="#" style={styles.footerLink}>Privacy Policy</Link>
        </p>
      </motion.div>

      {/* CSS for spinner animation */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a14',
      }}>
        <Loader2 style={{ width: 32, height: 32, color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
