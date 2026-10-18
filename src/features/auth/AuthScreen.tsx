import React, { useState, useRef } from 'react';
import { BrandMark, MessageBox } from '../../components/common/CommonWidgets';
import { Landscape } from '../../components/common/Visuals';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  UserCheck,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { User } from '../../types';
import {
  auth,
  setupRecaptchaVerifier,
  TEST_CREDENTIALS,
  getUserProfile,
  saveUserProfile,
  signInWithGoogle,
} from '../../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  ConfirmationResult,
  RecaptchaVerifier,
} from 'firebase/auth';

interface AuthScreenProps {
  onSignIn: (user: User) => void;
}

const FIREBASE_CONSOLE_AUTH_URL =
  'https://console.firebase.google.com/project/crucial-handbook-czbz0/authentication/providers';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignIn }) => {
  // Default to phone authentication per user request
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [isCreatingEmail, setIsCreatingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Errors, Notices, and Console Guidance
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showConsoleGuide, setShowConsoleGuide] = useState(false);
  const [operationNotAllowedType, setOperationNotAllowedType] = useState<'phone' | 'email' | 'google' | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Demo Sign In
  const handleDemoSignIn = () => {
    setBusy(true);
    setTimeout(() => {
      onSignIn({
        uid: 'demo-john-doe',
        displayName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1 650-555-3434',
        emailVerified: true,
        isDemo: true,
      });
    }, 200);
  };

  // Google Sign In (Gmail)
  const handleGoogleSignIn = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    setOperationNotAllowedType(null);

    try {
      const fbUser = await signInWithGoogle();
      const storedProfile = await getUserProfile(fbUser.uid);
      if (!storedProfile) {
        await saveUserProfile({
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email,
          phoneNumber: fbUser.phoneNumber || null,
          wallet: { available_points: 1420, provisional_points: 100 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      onSignIn({
        uid: fbUser.uid,
        displayName: storedProfile?.displayName || fbUser.displayName || 'Google User',
        email: fbUser.email,
        phoneNumber: fbUser.phoneNumber,
        emailVerified: fbUser.emailVerified,
        isDemo: false,
      });
    } catch (err: any) {
      console.error('Google sign in error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowedType('google');
        setError('Google sign-in is not yet enabled in the Firebase Console.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User voluntarily closed the popup
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser. Please allow popups for this page.');
      } else {
        setError(err.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // Quick fill test mobile credentials
  const fillTestMobile = () => {
    setPhoneNumber(TEST_CREDENTIALS.mobile);
    setError(null);
    setOperationNotAllowedType(null);
    setNotice('Filled test mobile: +1 650-555-3434. Click "Send Verification SMS".');
  };

  // Quick fill test email credentials
  const fillTestEmail = () => {
    setEmail(TEST_CREDENTIALS.email);
    setPassword(TEST_CREDENTIALS.password);
    setError(null);
    setOperationNotAllowedType(null);
    setNotice('Filled test email: tester@carbonlens.dev.');
  };

  // Fallback simulator for test phone if Firebase Console hasn't enabled Phone provider yet
  const handleSimulatedTestPhoneSignIn = async () => {
    setBusy(true);
    const testUid = 'test-phone-6505553434';
    try {
      await saveUserProfile({
        uid: testUid,
        displayName: 'Mobile Tester (650)',
        phoneNumber: TEST_CREDENTIALS.mobile,
        wallet: { available_points: 1420, provisional_points: 100 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Could not save test user profile to Firestore:', err);
    }

    onSignIn({
      uid: testUid,
      displayName: 'Mobile Tester (650)',
      email: null,
      phoneNumber: TEST_CREDENTIALS.mobile,
      emailVerified: true,
      isDemo: false,
    });
    setBusy(false);
  };

  // Firebase Phone / Mobile Authentication
  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedNumber = phoneNumber.trim();

    if (!cleanedNumber || cleanedNumber.length < 8) {
      setError('Enter a valid phone number with country code (e.g. +1 650-555-3434).');
      return;
    }

    setError(null);
    setNotice(null);
    setOperationNotAllowedType(null);
    setBusy(true);

    try {
      // Ensure invisible recaptcha container exists
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = setupRecaptchaVerifier('recaptcha-container');
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        cleanedNumber,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(confirmation);
      setAwaitingOtp(true);
      setNotice(`Verification code sent to ${cleanedNumber}.`);

      // If test phone number, prefill the test OTP
      if (cleanedNumber.includes('650-555-3434') || cleanedNumber.includes('5553434')) {
        setOtpCode(TEST_CREDENTIALS.testOtp);
        setNotice(`Verification code sent! Test OTP is "${TEST_CREDENTIALS.testOtp}".`);
      }
    } catch (err: any) {
      console.error('Phone sign-in error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowedType('phone');
        setError('Phone sign-in provider is not enabled in your Firebase Console.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('The phone number format is invalid. Include country code (e.g. +1 650-555-3434).');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Try using the test phone number +1 650-555-3434.');
      } else {
        setError(err.message || 'Failed to send verification SMS.');
      }

      // Reset recaptcha on error so user can retry
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (_) {}
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setError('Enter the 6-digit verification code.');
      return;
    }

    // If confirmationResult is null (e.g. testing mode)
    if (!confirmationResult) {
      if (cleanOtp === TEST_CREDENTIALS.testOtp) {
        await handleSimulatedTestPhoneSignIn();
        return;
      }
      setError('Session expired. Please request a new code.');
      setAwaitingOtp(false);
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const userCred = await confirmationResult.confirm(cleanOtp);
      const fbUser = userCred.user;

      // Check / initialize Firestore user profile
      const storedProfile = await getUserProfile(fbUser.uid);
      if (!storedProfile) {
        await saveUserProfile({
          uid: fbUser.uid,
          displayName: `User ${fbUser.phoneNumber?.slice(-4) || 'Eco'}`,
          phoneNumber: fbUser.phoneNumber,
          wallet: { available_points: 1420, provisional_points: 100 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      onSignIn({
        uid: fbUser.uid,
        displayName: storedProfile?.displayName || `User ${fbUser.phoneNumber?.slice(-4) || ''}`,
        email: fbUser.email || null,
        phoneNumber: fbUser.phoneNumber,
        emailVerified: true,
        isDemo: false,
      });
    } catch (err: any) {
      console.error('OTP confirmation error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid verification code. Please check the OTP.');
      } else if (err.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new one.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowedType('phone');
        setError('Phone sign-in is not enabled in Firebase Console.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // Firebase Email Authentication
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError(null);
    setNotice(null);
    setOperationNotAllowedType(null);
    setBusy(true);

    try {
      let fbUser;
      if (isCreatingEmail) {
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        fbUser = userCred.user;
      } else {
        try {
          const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
          fbUser = userCred.user;
        } catch (signInErr: any) {
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
            fbUser = userCred.user;
          } else {
            throw signInErr;
          }
        }
      }

      const storedProfile = await getUserProfile(fbUser.uid);
      if (!storedProfile) {
        await saveUserProfile({
          uid: fbUser.uid,
          displayName: fbUser.email?.split('@')[0] || 'Eco Champion',
          email: fbUser.email,
          wallet: { available_points: 1420, provisional_points: 100 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      onSignIn({
        uid: fbUser.uid,
        displayName: storedProfile?.displayName || fbUser.email?.split('@')[0] || 'User',
        email: fbUser.email,
        emailVerified: fbUser.emailVerified,
        isDemo: false,
      });
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setOperationNotAllowedType('email');
        setError('Email/Password provider is not enabled in your Firebase Console.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email is already registered. Switch to Sign In.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. If this is a new test account, click "Create account".');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3f3e9] via-[#f8fbf9] to-[#eef4ef] flex items-center justify-center p-4 sm:p-6">
      {/* Invisible container for Firebase Phone Recaptcha */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-[#e8efed] shadow-lg p-6 sm:p-8">
        <BrandMark />

        <div className="my-4">
          <Landscape height={120} />
        </div>

        <div className="text-center mb-5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#10243b]">
            Welcome to CarbonLens
          </h2>
          <p className="text-xs sm:text-sm text-[#53667b] mt-1">
            Sign in with <span className="font-bold text-[#10243b]">Gmail</span> or <span className="font-bold text-[#10243b]">Phone Test Auth</span>.
          </p>
        </div>

        {/* 1. PRIMARY OPTION: GMAIL / GOOGLE SIGN-IN */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={busy}
            className="w-full py-3 px-4 bg-white hover:bg-[#f4fbf7] text-[#10243b] font-bold rounded-2xl transition text-sm border-2 border-[#10243b]/10 hover:border-[#008b5b]/50 shadow-sm flex items-center justify-center gap-3 active:scale-[0.99]"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Gmail / Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-[#e8efed]"></div>
          <span className="flex-shrink mx-3 text-xs text-[#899ba8] font-semibold uppercase tracking-wider">
            Or Use Mobile / Email
          </span>
          <div className="flex-grow border-t border-[#e8efed]"></div>
        </div>

        {/* Tab Selection: Phone (Default) vs Email */}
        <div className="flex bg-[#eef4f5] p-1 rounded-xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('phone');
              setError(null);
              setNotice(null);
              setOperationNotAllowedType(null);
            }}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              authMode === 'phone'
                ? 'bg-[#008b5b] text-white shadow-xs font-bold'
                : 'text-[#53667b] hover:text-[#10243b]'
            }`}
          >
            <Smartphone size={15} />
            Phone / Test Mobile
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('email');
              setError(null);
              setNotice(null);
              setOperationNotAllowedType(null);
            }}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
              authMode === 'email'
                ? 'bg-[#008b5b] text-white shadow-xs font-bold'
                : 'text-[#53667b] hover:text-[#10243b]'
            }`}
          >
            <Mail size={15} />
            Email / Password
          </button>
        </div>

        {/* Notifications and Errors */}
        {error && <MessageBox message={error} isError />}
        {notice && <MessageBox message={notice} />}

        {/* SPECIFIC HELPER FOR OPERATION-NOT-ALLOWED */}
        {operationNotAllowedType && (
          <div className="my-3 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-2.5">
            <div className="flex items-start gap-2 text-amber-900 font-bold">
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span>Firebase Provider Not Enabled Yet</span>
                <p className="font-normal text-[11px] text-amber-800 mt-0.5">
                  In Firebase, {operationNotAllowedType === 'phone' ? 'Phone' : operationNotAllowedType === 'google' ? 'Google' : 'Email'} authentication needs to be toggled ON in your project console.
                </p>
              </div>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <a
                href={FIREBASE_CONSOLE_AUTH_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition"
              >
                <span>Enable in Firebase Console</span>
                <ExternalLink size={13} />
              </a>

              {operationNotAllowedType === 'phone' && (
                <button
                  type="button"
                  onClick={handleSimulatedTestPhoneSignIn}
                  className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-[#008b5b] border border-emerald-400 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition"
                >
                  <CheckCircle2 size={14} />
                  <span>Instant Test Phone Login (+1 650-555-3434)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODE 1: PHONE / TEST MOBILE AUTH */}
        {authMode === 'phone' && (
          <div className="space-y-3.5">
            {/* Quick Test Mobile Banner */}
            <div className="p-3 bg-[#e4f7eb] rounded-2xl border border-[#a9efc3] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#006b48]">Test Phone Number</p>
                <p className="text-[11px] font-mono text-[#315743]">{TEST_CREDENTIALS.mobile}</p>
                <p className="text-[10px] text-[#4b6b5a]">Test OTP code: {TEST_CREDENTIALS.testOtp}</p>
              </div>
              <button
                type="button"
                onClick={fillTestMobile}
                className="py-1.5 px-3 bg-white hover:bg-[#d5f0e0] text-[#008b5b] text-xs font-bold rounded-xl border border-[#a9efc3] shadow-2xs transition"
              >
                1-Click Fill
              </button>
            </div>

            {!awaitingOtp ? (
              <form onSubmit={handleSendPhoneCode} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#10243b] mb-1">
                    Mobile Phone Number (E.164 format)
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-3.5 text-[#899ba8]" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 650-555-3434"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b] focus:ring-1 focus:ring-[#008b5b]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl transition text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Smartphone size={16} />
                  {busy ? 'Connecting to Firebase…' : 'Send Verification SMS'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#10243b]">
                      6-Digit Verification Code (OTP)
                    </label>
                    <span className="text-[11px] text-[#008b5b] font-semibold">
                      Test OTP: 123456
                    </span>
                  </div>
                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-3.5 top-3.5 text-[#899ba8]" />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono tracking-widest text-center rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b] focus:ring-1 focus:ring-[#008b5b]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl transition text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <ArrowRight size={16} />
                  {busy ? 'Verifying OTP Code…' : 'Verify & Enter CarbonLens'}
                </button>

                <div className="flex justify-between items-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingOtp(false);
                      setOtpCode('');
                    }}
                    className="text-[#53667b] hover:underline font-medium"
                  >
                    Change Phone Number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendPhoneCode}
                    disabled={busy}
                    className="text-[#008b5b] hover:underline font-semibold"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: EMAIL / PASSWORD AUTH */}
        {authMode === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="p-3 bg-[#e4f7eb] rounded-2xl border border-[#a9efc3] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#006b48]">Test Email Credentials</p>
                <p className="text-[11px] font-mono text-[#315743]">{TEST_CREDENTIALS.email}</p>
              </div>
              <button
                type="button"
                onClick={fillTestEmail}
                className="py-1 px-2.5 bg-white hover:bg-[#d5f0e0] text-[#008b5b] text-xs font-bold rounded-xl border border-[#a9efc3] shadow-2xs transition"
              >
                1-Click Fill
              </button>
            </div>

            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-[#899ba8]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-[#899ba8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 chars)"
                required
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#899ba8] hover:text-[#10243b]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl transition text-sm shadow-sm flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <KeyRound size={16} />
              {busy ? 'Authenticating…' : isCreatingEmail ? 'Create Firebase Account' : 'Sign in with Email'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingEmail(!isCreatingEmail);
                  setError(null);
                  setOperationNotAllowedType(null);
                }}
                className="text-xs text-[#008b5b] hover:underline font-semibold"
              >
                {isCreatingEmail ? 'Already registered? Sign in with password' : 'New user? Create account'}
              </button>
            </div>
          </form>
        )}

        {/* Demo Mode Button */}
        <div className="mt-4 pt-3 border-t border-[#e8efed]">
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={busy}
            className="w-full py-2.5 px-4 bg-[#f8fbfa] hover:bg-[#eaf4ef] text-[#335345] font-bold rounded-xl transition text-xs border border-[#dce7e2] flex items-center justify-center gap-2"
          >
            <UserCheck size={16} className="text-[#008b5b]" />
            <span>Instant Demo Preview (Explore as John)</span>
          </button>
        </div>

        {/* Firebase Console Setup Guide Collapsible */}
        <div className="mt-4 pt-3 border-t border-[#e8efed]">
          <button
            type="button"
            onClick={() => setShowConsoleGuide(!showConsoleGuide)}
            className="w-full flex items-center justify-between text-[11px] text-[#53667b] hover:text-[#008b5b] font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle size={13} />
              How to enable Phone & Test Numbers in Firebase Console
            </span>
            <span>{showConsoleGuide ? '▲' : '▼'}</span>
          </button>

          {showConsoleGuide && (
            <div className="mt-2.5 p-3 bg-[#f8fbfa] rounded-xl border border-[#e8efed] text-[11px] text-[#425466] space-y-2">
              <p className="font-bold text-[#10243b]">To enable Phone test auth in 30 seconds:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>
                  Open{' '}
                  <a
                    href={FIREBASE_CONSOLE_AUTH_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#008b5b] underline font-medium"
                  >
                    Firebase Console &gt; Authentication &gt; Sign-in method
                  </a>
                  .
                </li>
                <li>Click <strong>Phone</strong> and toggle <strong>Enable</strong>.</li>
                <li>
                  Expand <strong>Phone numbers for testing (optional)</strong> and add:
                  <div className="my-1 font-mono text-[10px] bg-white p-1.5 rounded-sm border border-gray-200">
                    Phone: +1 650-555-3434<br />
                    Code: 123456
                  </div>
                </li>
                <li>Click <strong>Save</strong>.</li>
              </ol>
            </div>
          )}
        </div>

        <p className="mt-3 text-[10px] text-center text-[#899ba8] leading-tight">
          Cloud Project: <span className="font-mono text-[#008b5b]">crucial-handbook-czbz0</span> • Database: <span className="font-mono text-[#008b5b]">ai-studio-gcjapac-504eac8e-1fc1-4bab-921e-67c74c8bb227</span>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
