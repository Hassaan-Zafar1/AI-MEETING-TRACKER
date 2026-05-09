import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { login, forgotPassword, resetPassword } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  // View states
  const [view, setView] = useState<'login' | 'forgot-password' | 'reset-password'>('login');

  // Local state for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent page refresh (default form behavior)
    setIsLoading(true);
    setErrorMessage(''); // clear previous errors

    try {
      // Call the login API
      const user = await login(email, password);

      // Clear any cached data from previous sessions
      queryClient.clear();

      // Save user + token to the store (and localStorage)
      setUser(user);

      toast.success(`Welcome back, ${user.name}!`);
      navigate('/'); // redirect to dashboard
    } catch (error: any) {
      // Show error message inline
      setErrorMessage(error.response?.data?.message || 'Email or password incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordClick = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address first to reset your password');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    try {
      await forgotPassword(email);
      toast.success('Password reset OTP sent to your email');
      setView('reset-password');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      await resetPassword(email, otp, newPassword);
      toast.success('Password reset successfully. Please log in.');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setView('login');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.loginIllustration}>
          <img src="/login-illustration.png" alt="Login Illustration" />
        </div>
        <div className={styles.loginFormContainer}>
          <h1 className={styles.title}>Meeting Tracker</h1>
          <p className={styles.subtitle}>
            {view === 'login' && 'Sign in to your account'}
            {view === 'forgot-password' && 'Reset your password'}
            {view === 'reset-password' && 'Enter OTP and new password'}
          </p>

          {errorMessage && (
            <div className={styles.fieldError} style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '6px', textAlign: 'center', fontSize: '13px' }}>
              {errorMessage}
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email Address"
                  required
                />
              </div>

              <div className={styles.field}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Password</span>
                  <span 
                    onClick={handleForgotPasswordClick}
                    style={{ color: '#6366f1', fontSize: '13px', cursor: 'pointer' }}
                  >
                    Forgot Password?
                  </span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>

              <button type="submit" disabled={isLoading} className={styles.button}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}

          {view === 'reset-password' && (
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.field}>
                <label>One-Time Password (OTP)</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                />
              </div>
              <button type="submit" disabled={isLoading} className={styles.button}>
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => { setView('login'); setErrorMessage(''); }}
                style={{ marginTop: '10px', background: 'transparent', color: '#6366f1', border: 'none', cursor: 'pointer', fontSize: '14px', width: '100%' }}
              >
                Cancel
              </button>
            </form>
          )}

          <p className={styles.link}>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;