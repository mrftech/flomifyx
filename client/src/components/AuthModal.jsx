import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from './CountdownTimer';
import '../styles/AuthModal.css';

function AuthModal({ isOpen, onClose }) {
  const { sendMagicLink, verifyCode, signIn, signUp, authError, retryCount, MAX_RETRIES, authMode, setAuthMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const RESEND_TIMEOUT = 60;

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setVerificationCode('');
      setShowVerification(false);
      setMessage('');
      setCanResend(false);
      setIsSignUp(false);
    }
  }, [isOpen]);

  // Update message when auth error changes
  useEffect(() => {
    if (authError) {
      setMessage(authError);
      // If the error is related to rate limiting, server errors, or already registered, allow resending
      if (
        authError.includes('rate limit') || 
        authError.includes('server error') || 
        authError.includes('already registered') ||
        authError.includes('Unable to send verification email')
      ) {
        setCanResend(true);
      }
    }
  }, [authError]);

  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password) => {
    return password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      return;
    }

    if (authMode === 'password') {
      if (!validatePassword(password)) {
        setMessage('Password must be at least 6 characters long and contain both letters and numbers');
        return;
      }

      if (isSignUp && password !== confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }
    }

    setIsSending(true);
    setMessage('');
    setCanResend(false);

    try {
      if (authMode === 'magic-link') {
        await sendMagicLink(email);
        setShowVerification(true);
        setMessage('Check your email for the magic link or verification code');
      } else {
        if (isSignUp) {
          await signUp(email, password);
          setMessage('Account created successfully! Please check your email to verify your account.');
        } else {
          await signIn(email, password);
          setMessage('Signed in successfully!');
          setTimeout(() => onClose(), 1500);
        }
      }
    } catch (error) {
      setMessage(error.message);
      // Show retry count if we're hitting server errors
      if (error.message.includes('Unable to send verification email')) {
        setMessage(`${error.message}\n\nRetry attempt ${retryCount} of ${MAX_RETRIES}`);
      }
      // Allow resending for certain errors
      if (
        error.message.includes('rate limit') || 
        error.message.includes('server error') || 
        error.message.includes('already registered') ||
        error.message.includes('Unable to send verification email')
      ) {
        setCanResend(true);
      }
    } finally {
      setIsSending(false);
    }
  }, [email, password, confirmPassword, sendMagicLink, signIn, signUp, validateEmail, validatePassword, retryCount, MAX_RETRIES, authMode, isSignUp, onClose]);

  const handleResend = useCallback(async () => {
    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setMessage('');
    setCanResend(false);

    try {
      await sendMagicLink(email);
      setMessage('New verification code sent! Please check your email.');
    } catch (error) {
      setMessage(error.message);
      // Show retry count if we're hitting server errors
      if (error.message.includes('Unable to send verification email')) {
        setMessage(`${error.message}\n\nRetry attempt ${retryCount} of ${MAX_RETRIES}`);
      }
      // If the error is related to rate limiting, show appropriate message
      if (error.message.includes('rate limit')) {
        setMessage('Too many attempts. Please wait before trying again.');
      }
      setCanResend(true);
    } finally {
      setIsSending(false);
    }
  }, [email, sendMagicLink, validateEmail, retryCount, MAX_RETRIES]);

  const handleVerifyCode = useCallback(async (e) => {
    e.preventDefault();

    if (verificationCode.length !== 6) {
      setMessage('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    setMessage('');

    try {
      await verifyCode(email, verificationCode);
      setMessage('Successfully verified! Redirecting...');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Verification error:', error);
      setMessage(error.message || 'Invalid verification code. Please try again.');
      setVerificationCode('');
      // If the error is related to an expired code or server error, allow resending
      if (
        error.message.includes('expired') || 
        error.message.includes('server error')
      ) {
        setCanResend(true);
      }
    } finally {
      setIsVerifying(false);
    }
  }, [email, verificationCode, verifyCode, onClose]);

  const handleReset = useCallback(() => {
    setShowVerification(false);
    setVerificationCode('');
    setMessage('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCanResend(false);
    setIsSignUp(false);
  }, []);

  const handleCodeChange = useCallback((e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    if (value.length <= 6) {
      setVerificationCode(value);
      // Clear error message when user starts typing
      if (message.includes('code')) {
        setMessage('');
      }
    }
  }, [message]);

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    // Clear error message when user starts typing
    if (message.includes('email')) {
      setMessage('');
    }
  }, [message]);

  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    // Clear error message when user starts typing
    if (message.includes('password')) {
      setMessage('');
    }
  }, [message]);

  const handleConfirmPasswordChange = useCallback((e) => {
    setConfirmPassword(e.target.value);
    // Clear error message when user starts typing
    if (message.includes('match')) {
      setMessage('');
    }
  }, [message]);

  const handleModalClose = useCallback((e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  }, [onClose]);

  const toggleAuthMode = useCallback(() => {
    setAuthMode(prev => prev === 'magic-link' ? 'password' : 'magic-link');
    setMessage('');
  }, [setAuthMode]);

  const toggleSignUp = useCallback(() => {
    setIsSignUp(prev => !prev);
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={handleModalClose}>
        <div className="auth-modal" onClick={e => e.stopPropagation()}>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
          
          <h2>Sign In / Sign Up</h2>
          
          {!showVerification ? (
            <>
              <p className="modal-description">
                {authMode === 'magic-link' 
                  ? 'Enter your email to receive a magic link or verification code'
                  : isSignUp 
                    ? 'Create an account with email and password'
                    : 'Sign in with your email and password'
                }
              </p>
              
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    required
                    aria-label="Email address"
                    autoComplete="email"
                    className={message && message.includes('email') ? 'error' : ''}
                  />
                </div>

                {authMode === 'password' && (
                  <>
                    <div className="form-group">
                      <input
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Enter your password"
                        required
                        aria-label="Password"
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        className={message && message.includes('password') ? 'error' : ''}
                      />
                    </div>

                    {isSignUp && (
                      <div className="form-group">
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={handleConfirmPasswordChange}
                          placeholder="Confirm your password"
                          required
                          aria-label="Confirm password"
                          autoComplete="new-password"
                          className={message && message.includes('match') ? 'error' : ''}
                        />
                      </div>
                    )}
                  </>
                )}
                
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={
                    isSending || 
                    !email || 
                    (authMode === 'password' && (!password || (isSignUp && !confirmPassword))) ||
                    (authMode === 'magic-link' && retryCount >= MAX_RETRIES)
                  }
                >
                  {isSending 
                    ? 'Sending...' 
                    : authMode === 'magic-link'
                      ? 'Send Magic Link'
                      : isSignUp
                        ? 'Sign Up'
                        : 'Sign In'
                  }
                </button>

                {authMode === 'password' && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={toggleSignUp}
                  >
                    {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                  </button>
                )}
              </form>
            </>
          ) : (
            <>
              <p className="modal-description">
                Check your email for the magic link or enter the verification code below
              </p>
              
              <form onSubmit={handleVerifyCode} noValidate>
                <div className="form-group">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    placeholder="Enter verification code"
                    maxLength="6"
                    pattern="\d{6}"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    aria-label="Verification code"
                    className={message && message.includes('code') ? 'error' : ''}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isVerifying || verificationCode.length !== 6}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Code'}
                </button>

                <div className="resend-section">
                  {canResend ? (
                    <button
                      type="button"
                      className="resend-button"
                      onClick={handleResend}
                      disabled={isSending || retryCount >= MAX_RETRIES}
                    >
                      {isSending ? 'Sending...' : 'Resend Code'}
                    </button>
                  ) : (
                    <p className="resend-timer">
                      Resend code in <CountdownTimer seconds={RESEND_TIMEOUT} onComplete={() => setCanResend(true)} />
                    </p>
                  )}
                </div>

                <button 
                  type="button"
                  className="secondary-button"
                  onClick={handleReset}
                >
                  Use Different Email
                </button>
              </form>
            </>
          )}

          {message && (
            <div 
              className={`message ${message.includes('success') ? 'success' : 'error'}`}
              role="alert"
              style={{ whiteSpace: 'pre-line' }}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default AuthModal; 