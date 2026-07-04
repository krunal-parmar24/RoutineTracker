import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signup } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setInfoMessage('');
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await signup({ email, password, name });
        setInfoMessage(
          'Account created successfully. Please check your email and verify your account using the link we sent. After verification, return here to log in.',
        );
        return;
      }

      const user = await login({ email, password });
      if (!user) {
        setError('Invalid email or password.');
        return;
      }

      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      if (message.toLowerCase().includes('email rate limit exceeded')) {
        setError(
          'Too many verification emails have been sent to this address. Please wait a few minutes and try again, or use login if you already registered.',
        );
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '36px' }}>
        <div className="hero-badge">Welcome back</div>
        <h1 className="hero-title">{isSignup ? 'Create your account' : 'Sign in to continue'}</h1>
        <p className="hero-copy">{isSignup ? 'Start building better routines and track your daily momentum.' : 'Access your routines, add todos, and review your progress.'}</p>

        <form onSubmit={handleSubmit} className="form-card">
          <div className="form-row">
            {isSignup && (
              <label className="control-label">
                Name
                <input value={name} onChange={(event) => setName(event.target.value)} required className="input" />
              </label>
            )}

            <label className="control-label">
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="input" />
            </label>

            <label className="control-label">
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="input" />
            </label>
          </div>

          {error ? <p className="alert" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>{error}</p> : null}
          {infoMessage ? <p className="alert" style={{ background: '#ecfdf5', borderColor: '#bbf7d0', color: '#166534' }}>{infoMessage}</p> : null}

          <div className="button-row" style={{ marginTop: '12px' }}>
            <button type="submit" className="button button-primary" disabled={isSubmitting}>
              {isSignup ? 'Create account' : 'Log in'}
            </button>
            <button type="button" onClick={() => setIsSignup((value) => !value)} className="button button-secondary">
              {isSignup ? 'Already have an account' : 'Need an account?'}
            </button>
          </div>

          {isSignup ? (
            <p className="small-text" style={{ marginTop: '16px' }}>
              If you already signed up, please use login instead of resending another verification email.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
