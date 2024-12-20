import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from './CountdownTimer';
import '../styles/AuthModal.css';

function AuthModal({ isOpen, onClose }) {
  const { sendMagicLink, verifyCode } = useAuth();
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [message, setMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  const RESEND_TIMEOUT = 60;

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSending(true);
    setMessage('');
    setCanResend(false);

    try {
      await sendMagicLink(email);
      setShowVerification(true);
      setMessage('Check your email for the magic link or verification code');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSending(false);
    }
  }, [email, sendMagicLink]);

  const handleResend = useCallback(async () => {
    setIsSending(true);
    setMessage('');
    setCanResend(false);

    try {
      await sendMagicLink(email);
      setMessage('New verification code sent!');
    } catch (error) {
      setMessage(error.message);
      setCanResend(true);
    } finally {
      setIsSending(false);
    }
  }, [email, sendMagicLink]);

  const handleTimerComplete = useCallback(() => {
    setCanResend(true);
  }, []);

  const handleVerifyCode = useCallback(async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setMessage('');

    try {
      await verifyCode(email, verificationCode);
      setMessage('Successfully verified!');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Verification error:', error);
      setMessage(error.message || 'Invalid verification code. Please try again.');
      setVerificationCode('');
    } finally {
      setIsVerifying(false);
    }
  }, [email, verificationCode, verifyCode, onClose]);

  const handleReset = useCallback(() => {
    setShowVerification(false);
    setVerificationCode('');
    setMessage('');
  }, []);

  const handleCodeChange = useCallback((e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setVerificationCode(value);
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="auth-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Sign In / Sign Up</h2>
        
        {!showVerification ? (
          <>
            <p className="modal-description">
              Enter your email to receive a magic link or verification code
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSending}
              >
                {isSending ? 'Sending...' : 'Sign In / Sign Up'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="modal-description">
              Check your email for the magic link or enter the verification code below
            </p>
            
            <form onSubmit={handleVerifyCode}>
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
                />
              </div>
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="resend-section">
                {canResend ? (
                  <button
                    type="button"
                    className="resend-button"
                    onClick={handleResend}
                    disabled={isSending}
                  >
                    {isSending ? 'Sending...' : 'Resend Code'}
                  </button>
                ) : (
                  <p className="resend-timer">
                    Resend code in <CountdownTimer seconds={RESEND_TIMEOUT} onComplete={handleTimerComplete} />
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
          <div className={`message ${message.includes('Invalid') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </>
  );
}

export default AuthModal; 