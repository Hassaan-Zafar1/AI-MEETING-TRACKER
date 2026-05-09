import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { register, verifyOtp } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import styles from './LoginPage.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // OTP states
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client-side validation before hitting the server
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Call the register API function from api/auth.ts
      const res = await register(name.trim(), email.trim().toLowerCase(), password);

      if (res.requiresOtp) {
        toast.success('OTP sent to your email!');
        setShowOtp(true);
      }
    } catch (error: any) {
      // Show the error message from the server (e.g. "User already exists")
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setIsLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), otp);
      
      // Clear any cached data from previous sessions
      queryClient.clear();
      
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.loginIllustration}>
          <img src="/register-illustration.png" alt="Register Illustration" />
        </div>
        <div className={styles.loginFormContainer}>
          <h1 className={styles.title}>Meeting Tracker</h1>
          <p className={styles.subtitle}>
            {showOtp ? 'Enter verification code' : 'Create your free account'}
          </p>

          {!showOtp ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="name">Full name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  required
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />
                {/* Live mismatch warning — shows as user types */}
                {confirmPassword && password !== confirmPassword && (
                  <span className={styles.fieldError}>Passwords do not match</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || (!!confirmPassword && password !== confirmPassword)}
                className={styles.button}
              >
                {isLoading ? 'Sending OTP...' : 'Create account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="otp">One-Time Password</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                  autoFocus
                />
                <span className={styles.fieldError} style={{ color: '#666', marginTop: '5px' }}>
                  We sent an OTP to {email}
                </span>
              </div>
              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className={styles.button}
              >
                {isLoading ? 'Verifying...' : 'Verify Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowOtp(false)}
                style={{ marginTop: '10px', background: 'transparent', color: '#6366f1', border: 'none', cursor: 'pointer', fontSize: '14px', width: '100%' }}
              >
                Go back
              </button>
            </form>
          )}

          <p className={styles.link}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;