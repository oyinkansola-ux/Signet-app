import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MobileLayout } from '../components/MobileLayout';
import { useToast } from '../components/Toast';

export function Settings() {
  const { profile, refreshProfile } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(profile?.name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) { setName(profile.name); setEmail(profile.email); }
  }, [profile]);

  const saveProfile = async () => {
    setProfileLoading(true);
    const { error } = await supabase.from('users').update({ name: name.trim(), email: email.trim() }).eq('id', profile!.id);
    if (error) { addToast('Failed to update profile.', 'error'); }
    else { await refreshProfile(); addToast('Profile updated successfully.', 'success'); }
    setProfileLoading(false);
  };

  const updatePassword = async () => {
    const e: Record<string, string> = {};
    if (!currentPassword) e.current = 'Please enter your current password';
    if (!newPassword) e.new = 'Please enter a new password';
    else if (newPassword.length < 8) e.new = 'Password must be at least 8 characters';
    if (newPassword !== confirmPassword) e.confirm = "Your new passwords don't match";
    setPasswordErrors(e);
    if (Object.keys(e).length > 0) return;
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      if (error.message.includes('current password') || error.message.includes('invalid')) setPasswordErrors({ current: 'Your current password is incorrect' });
      else addToast('Failed to update password.', 'error');
    } else { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); addToast('Password updated successfully.', 'success'); }
    setPasswordLoading(false);
  };

  const inputClass = (errorKey?: string) =>
    `w-full h-11 px-4 text-[15px] rounded-lg border-[1.5px] outline-none transition-colors duration-150 ${
      errorKey && passwordErrors[errorKey] ? 'border-error' : 'border-border focus:border-primary'
    }`;

  return (
    <MobileLayout>
      <div className="max-w-[600px] mx-auto md:mx-0 animate-fade-in">
        <h1 className="font-medium text-3xl text-primary mb-10">Settings</h1>

        {/* Profile */}
        <h2 className="font-medium text-lg text-primary mb-5">Profile</h2>
        <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium text-primary mb-1.5">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full h-11 px-4 text-[15px] rounded-lg border-[1.5px] border-border focus:border-primary outline-none transition-colors duration-150" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-primary mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full h-11 px-4 text-[15px] rounded-lg border-[1.5px] border-border focus:border-primary outline-none transition-colors duration-150" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button onClick={saveProfile} disabled={profileLoading}
              className="text-sm font-medium text-primary border-[1.5px] border-primary px-6 py-2.5 rounded-lg hover:bg-row-hover transition-colors duration-150 disabled:opacity-50">
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="border-t border-border my-8" />

          <p className="font-medium text-[15px] text-primary mb-4">Change Password</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-primary mb-1.5">Current Password</label>
              <input type="password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPasswordErrors(p => ({ ...p, current: '' })); }} className={inputClass('current')} />
              {passwordErrors.current && <p className="text-error text-xs mt-1">{passwordErrors.current}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-primary mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordErrors(p => ({ ...p, new: '' })); }} className={inputClass('new')} />
              {passwordErrors.new && <p className="text-error text-xs mt-1">{passwordErrors.new}</p>}
            </div>
            <div>
              <label className="block text-[13px] font-medium text-primary mb-1.5">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordErrors(p => ({ ...p, confirm: '' })); }} className={inputClass('confirm')} />
              {passwordErrors.confirm && <p className="text-error text-xs mt-1">{passwordErrors.confirm}</p>}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button onClick={updatePassword} disabled={passwordLoading}
              className="text-sm font-medium text-primary border-[1.5px] border-primary px-6 py-2.5 rounded-lg hover:bg-row-hover transition-colors duration-150 disabled:opacity-50">
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <h2 className="font-medium text-lg text-primary mt-8 mb-5">Danger Zone</h2>
        <div className="bg-surface border border-border rounded-xl p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[15px] text-primary">Delete Account</p>
              <p className="text-[13px] text-secondary mt-0.5">Permanently delete your account and all event data.</p>
            </div>
            <button className="text-sm font-medium text-error border-[1.5px] border-error px-5 py-2 rounded-lg hover:bg-error-bg transition-colors duration-150">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
