import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const validate = (): boolean => {
    const e: FieldErrors = {};
    if (!name.trim()) e.name = 'Please enter your full name';
    if (!email.trim()) e.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "That doesn't look like a valid email address";
    if (!password) e.password = 'Please create a password';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!confirm) e.confirm = 'Please confirm your password';
    else if (password !== confirm) e.confirm = "Your passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setAuthError('');
    if (!validate()) return;
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        setAuthError('An account with this email already exists. Sign in instead?');
      } else {
        setAuthError(error.message);
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
        <p className="text-secondary text-[15px] mt-2 mb-8">Create your account</p>

        {authError && (
          <div className="bg-error-bg border border-error rounded-xl px-4 py-3 mb-4">
            <p className="text-error text-sm">
              {authError}
              {authError.includes('Sign in instead') && (
                <Link to="/signin" className="underline ml-1">Sign in</Link>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-primary mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })); }}
              className={inputClass('name')}
              placeholder="Your full name"
            />
            {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
          </div>
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
              placeholder="At least 8 characters"
            />
            {errors.password && <p className="text-error text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-[13px] font-medium text-primary mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setErrors(prev => ({ ...prev, confirm: undefined })); }}
              className={inputClass('confirm')}
              placeholder="Confirm your password"
            />
            {errors.confirm && <p className="text-error text-xs mt-1">{errors.confirm}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 text-sm font-medium bg-amber text-primary rounded-lg hover:bg-amber-dark transition-colors duration-150 disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-[13px] text-secondary mt-4">
          Already have an account?{' '}
          <Link to="/signin" className="text-tertiary hover:text-primary transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
