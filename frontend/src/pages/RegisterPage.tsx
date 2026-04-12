import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useGoogleLogin } from '@react-oauth/google'
import './RegisterPage.css'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isOtpStep, setIsOtpStep] = useState(false)
  const [otp, setOtp] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!isOtpStep) {
      // Simulate sending OTP to the user's email
      console.log('Sending OTP for:', { fullName, email, password })
      setIsOtpStep(true)
      return
    }

    // =========================================================================
    // FUTURE API INTEGRATION (OTP VERIFICATION):
    // 1. Call your verify API here (e.g., POST /api/auth/verify-otp)
    // 2. Handle the response:
    //    - On success: Redirect the user to the login page (`/login`)
    //    - On error: Display an error message to the user
    // =========================================================================

    console.log('Verifying OTP:', { otp })
  }

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('Google Auth Success on Register! Got Token:', tokenResponse.access_token)
      // TODO: Send `tokenResponse.access_token` to your backend POST /api/auth/google
    },
    onError: () => console.error('Google Login Failed'),
  })

  return (
    <div className="register-root">
      {/* Brand header */}
      <div className="register-brand">
        <div className="brand-icon-rocket">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 2.5C13.5 2.5 17.5 2 19 3.5C20.5 5 20 9 20 9L19.5 10.5L18.5 13L15.5 10L12.5 7L10 6L11.5 5.5L13.5 2.5Z" fill="#4338ca"/>
            <path d="M12.5 7L15.5 10L14 13C14 13 11 16 9.5 17.5C8 19 5.5 19 5.5 19C5.5 19 5.5 16.5 7 15C8.5 13.5 11.5 10.5 11.5 10.5L12.5 7Z" fill="#4338ca"/>
            <circle cx="15" cy="7" r="1.5" fill="white"/>
            <path d="M6 18C6 18 5 21 3 22C4 20 5 19 6 18Z" fill="#4338ca"/>
          </svg>
        </div>
        <h1 className="brand-name">Meeting Tracker</h1>

      </div>

      {/* Card */}
      <div className="register-card">
        <div className="card-header">
          <h2>{isOtpStep ? 'Verify your email' : 'Create an account'}</h2>
          <p>{isOtpStep ? `We sent a code to ${email || 'your email'}` : 'Join the community of focused professionals.'}</p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          {!isOtpStep ? (
            <>
              {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">FULL NAME</label>
            <div className="input-wrapper">
              <input
                id="fullName"
                type="text"
                className="form-input no-icon"
                placeholder="Enter Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">EMAIL ADDRESS</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                className="form-input no-icon"
                placeholder="Enter Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">PASSWORD</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                className="form-input no-icon"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <span className="input-hint">Must be at least 8 characters long.</span>
          </div>
          </>
          ) : (
            /* OTP Field */
            <div className="form-group">
              <label htmlFor="otp" className="form-label">ONE-TIME PASSWORD</label>
              <div className="input-wrapper">
                <input
                  id="otp"
                  type="text"
                  className="form-input no-icon"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />
              </div>
              <span className="input-hint">Check your inbox for the code.</span>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="btn-register" id="register-submit-btn">
            {isOtpStep ? 'Verify OTP' : 'Sign up'} <span className="arrow">→</span>
          </button>
        </form>

        {!isOtpStep && (
          <>
            {/* Divider */}
        <div className="divider">
          <span>OR CONTINUE WITH</span>
        </div>

        {/* Social */}
        <div className="social-row">
          <button type="button" className="btn-social" id="google-register-btn" onClick={() => loginWithGoogle()}>
            <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
        </div>
          </>
        )}
      </div>
      
      {/* Login link outside card */}
      <p className="login-row">
        Already have an account? <Link to="/login" className="login-link">Login</Link>
      </p>
    </div>
  )
}
