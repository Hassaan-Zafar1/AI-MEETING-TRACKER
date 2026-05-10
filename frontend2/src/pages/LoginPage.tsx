import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  // Local state for form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setErrorMessage('Email or password incorrect');
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
          <p className={styles.subtitle}>Sign in to your account</p>

          {errorMessage && (
            <div className={styles.fieldError} style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '6px', textAlign: 'center', fontSize: '13px' }}>
              {errorMessage}
            </div>
          )}

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
              <label>Password</label>
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

          <p className={styles.link}>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;