import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

interface FieldErrors {
  email?: string;
  password?: string;
}

export function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!email.trim()) e.email = 'Please enter your email address';
    if (!password) e.password = 'Please enter your password';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setBannerError('');
    if (!validate()) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login') || error.message.includes('Invalid password')) {
        setBannerError('The email or password you entered is incorrect. Please try again.');
      } else if (error.message.includes('not found') || error.message.includes('no user')) {
        setBannerError("We couldn't find an account with that email. Want to sign up instead?");
      } else {
        setBannerError('The email or password you entered is incorrect. Please try again.');
      }
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const inputClass = (field: keyof FieldErrors) =>
    `w-full h-11 px-4 text-[15px] rounded-lg border-[1.5px] outline-none transition-colors duration-150 ${
      errors[field] ? 'border-error' : 'border-border focus:border-primary'
    }`;

  return (
    <div className="min-h-screen bg-page flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-xl border border-border p-10 w-full max-w-[440px]">
        <Logo color="#1C1C1E" size={24} showText className="text-[22px]" />
        <p className="text-secondary text-[15px] mt-2 mb-8">Welcome back</p>

        {bannerError && (
          <div className="bg-error-bg border border-error rounded-xl px-4 py-3 mb-4">
            <p className="text-error text-sm">
              {bannerError}
              {bannerError.includes('sign up instead') && (
                <Link to="/signup" className="underline ml-1">Sign up</Link>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-primary mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
              className={inputClass('email')}
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-[13px] font-medium text-primary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
              className={inputClass('password')}
              placeholder="Your password"
            />
            {errors.password && <p className="text-error text-xs mt-1">{errors.password}</p>}
          </div>
          <div className="text-right">
            <button type="button" className="text-[12px] text-tertiary hover:text-primary transition-colors">
              Forgot password?
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-sm font-medium bg-amber text-primary rounded-lg hover:bg-amber-dark transition-colors duration-150 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-[13px] text-secondary mt-4">
          Don't have an account?{' '}
          <Link to="/signup" className="text-tertiary hover:text-primary transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
