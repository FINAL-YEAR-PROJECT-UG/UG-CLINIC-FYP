'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Settings, User, Bell, Shield, LogOut, Lock, Mail, Smartphone, CheckCircle2 } from '@/components/icons';
import StaffNav from '@/components/shared/StaffNav';
import { createClient } from '@/utils/supabase/client';
import { getRecoveryCallbackRedirect } from '@/lib/authUrl';

export default function StaffSettingsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [verifiedTotpFactor, setVerifiedTotpFactor] = useState<{ id: string; friendlyName?: string } | null>(null);
  const [enrollment, setEnrollment] = useState<{ factorId: string; challengeId: string; qrCode: string; secret: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const refreshTotpFactor = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const factor = data.totp.find((item) => item.status === 'verified');
    setVerifiedTotpFactor(factor ? { id: factor.id, friendlyName: factor.friendly_name } : null);
  };

  useEffect(() => {
    if (activeTab !== 'security' || !isAuthenticated) return;
    const loadFactors = async () => {
      try {
        await refreshTotpFactor();
      } catch (error: unknown) {
        setSecurityError(true);
        setSecurityMessage(error instanceof Error ? error.message : 'Could not load two-factor settings.');
      }
    };
    void loadFactors();
  }, [activeTab, isAuthenticated]);

  const sendPasswordResetLink = async () => {
    if (!user?.email) {
      setSecurityError(true);
      setSecurityMessage('Your account email is not available.');
      return;
    }
    setSecurityBusy(true);
    setSecurityError(false);
    setSecurityMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: getRecoveryCallbackRedirect(window.location.origin),
      });
      if (error) throw error;
      setSecurityMessage(`Password reset link sent to ${user.email}.`);
    } catch (error) {
      setSecurityError(true);
      setSecurityMessage(error instanceof Error ? error.message : 'Could not send a password reset link.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const startTotpEnrollment = async () => {
    setSecurityBusy(true);
    setSecurityError(false);
    setSecurityMessage(null);
    try {
      const supabase = createClient();
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      for (const factor of factors.all.filter((item) => item.factor_type === 'totp' && item.status === 'unverified')) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (error) throw error;
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'UG Clinic Staff Portal',
      });
      if (error) throw error;
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: data.id,
      });
      if (challengeError) throw challengeError;
      setEnrollment({
        factorId: data.id,
        challengeId: challenge.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setVerificationCode('');
      setSecurityMessage('Scan the QR code with an authenticator app, then enter its 6-digit code.');
    } catch (error) {
      setSecurityError(true);
      setSecurityMessage(error instanceof Error ? error.message : 'Could not start two-factor setup.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const verifyTotpEnrollment = async () => {
    if (!enrollment || !/^\d{6}$/.test(verificationCode)) {
      setSecurityError(true);
      setSecurityMessage('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setSecurityBusy(true);
    setSecurityError(false);
    setSecurityMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: enrollment.challengeId,
        code: verificationCode,
      });
      if (error) throw error;
      setEnrollment(null);
      setVerificationCode('');
      await refreshTotpFactor();
      setSecurityMessage('Two-factor authentication is enabled.');
    } catch (error) {
      setSecurityError(true);
      setSecurityMessage(error instanceof Error ? error.message : 'The verification code was not accepted.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const disableTotp = async () => {
    if (!verifiedTotpFactor || !window.confirm('Disable two-factor authentication for this account?')) return;
    setSecurityBusy(true);
    setSecurityError(false);
    setSecurityMessage(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedTotpFactor.id });
      if (error) throw error;
      setVerifiedTotpFactor(null);
      setSecurityMessage('Two-factor authentication has been disabled.');
    } catch (error) {
      setSecurityError(true);
      setSecurityMessage(error instanceof Error ? error.message : 'Could not disable two-factor authentication.');
    } finally {
      setSecurityBusy(false);
    }
  };

  if (!isAuthenticated) return null;
  if (user && !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StaffNav userRole={user?.role ?? ''} />

        {/* Page heading */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] rounded-xl flex items-center justify-center shadow-md">
            <Settings className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1221]">Settings</h1>
            <p className="text-xs text-[#6B7A8D]">Manage your account preferences and security</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl border border-[#DDE3EE] p-3 shadow-sm">
              <nav className="space-y-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeTab === id
                        ? 'bg-gradient-to-r from-[#0F172A] to-[#1e3a8a] text-white shadow-md'
                        : 'text-[#4B5A6E] hover:text-[#0F172A] hover:bg-[#F1F4F9]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-5">
            {/* ── Profile Tab ── */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl border border-[#DDE3EE] p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-[#0B1221] mb-5">Profile Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#4B5A6E] mb-1.5">First Name</label>
                      <input
                        type="text"
                        value={user?.firstName || ''}
                        disabled
                        className="w-full px-3.5 py-2.5 border-[1.5px] border-[#DDE3EE] bg-[#F5F7FB] rounded-xl text-sm text-[#6B7A8D] cursor-not-allowed"
                      />
                      <p className="text-[10px] text-[#9CA8BA] mt-1">Cannot be modified here</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#4B5A6E] mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={user?.lastName || ''}
                        disabled
                        className="w-full px-3.5 py-2.5 border-[1.5px] border-[#DDE3EE] bg-[#F5F7FB] rounded-xl text-sm text-[#6B7A8D] cursor-not-allowed"
                      />
                      <p className="text-[10px] text-[#9CA8BA] mt-1">Cannot be modified here</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5A6E] mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline mr-1.5 text-[#9CA8BA]" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 border-[1.5px] border-[#DDE3EE] bg-[#F5F7FB] rounded-xl text-sm text-[#6B7A8D] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B5A6E] mb-1.5">Role</label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-[1.5px] border-[#DDE3EE] bg-[#F5F7FB] rounded-xl">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1e3a8a]/10 text-[#1e3a8a] text-xs font-bold rounded-lg border border-[#1e3a8a]/20">
                        <Shield className="w-3 h-3" />
                        {user?.role || ' '}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications Tab ── */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-2xl border border-[#DDE3EE] p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-[#0B1221] mb-5">Notification Preferences</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Email Notifications', desc: 'Receive appointment reminders via email', icon: Mail, defaultOn: true },
                    { label: 'SMS Notifications', desc: 'Receive appointment reminders via SMS', icon: Smartphone, defaultOn: false },
                    { label: 'Appointment Confirmations', desc: 'Get notified when appointments are confirmed', icon: CheckCircle2, defaultOn: true },
                  ].map(({ label, desc, icon: Icon, defaultOn }) => (
                    <label key={label} className="flex items-center justify-between p-4 border-[1.5px] border-[#DDE3EE] rounded-xl cursor-pointer hover:border-[#94A3B8] hover:bg-[#F5F7FB] transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-[#1e3a8a]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#0B1221] text-sm">{label}</p>
                          <p className="text-xs text-[#6B7A8D]">{desc}</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
                        <div className="w-10 h-5.5 bg-gray-200 peer-checked:bg-[#1e3a8a] rounded-full transition-colors duration-200 cursor-pointer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4.5 after:h-4.5 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:translate-x-[18px]" style={{ width: 40, height: 22 }} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── Security Tab ── */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#DDE3EE] p-6 shadow-sm">
                  <h2 className="text-base font-extrabold text-[#0B1221] mb-5">Security Settings</h2>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => void sendPasswordResetLink()}
                      disabled={securityBusy}
                      className="w-full flex items-center gap-4 p-4 border-[1.5px] border-[#DDE3EE] rounded-xl hover:border-[#94A3B8] hover:bg-[#F5F7FB] transition-all duration-200 text-left group disabled:opacity-60"
                    >
                      <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <Lock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#0B1221] text-sm">Change Password</p>
                        <p className="text-xs text-[#6B7A8D]">Update your password to keep your account secure</p>
                      </div>
                      <span className="text-xs font-bold text-[#0369A1] opacity-0 group-hover:opacity-100 transition-opacity">{securityBusy ? 'Sending…' : 'Email reset link →'}</span>
                    </button>
                    <div className="w-full p-4 border-[1.5px] border-[#DDE3EE] rounded-xl">
                      <div className="w-9 h-9 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <Shield className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="mt-3">
                        <p className="font-semibold text-[#0B1221] text-sm">Two-Factor Authentication</p>
                        <p className="text-xs text-[#6B7A8D]">
                          {verifiedTotpFactor ? 'Authenticator verification is enabled for staff sign-in.' : 'Require an authenticator code during staff sign-in.'}
                        </p>
                      </div>
                      {verifiedTotpFactor ? (
                        <button type="button" onClick={() => void disableTotp()} disabled={securityBusy} className="mt-3 text-xs font-bold text-red-600 hover:underline disabled:opacity-50">
                          Disable two-factor authentication
                        </button>
                      ) : !enrollment ? (
                        <button type="button" onClick={() => void startTotpEnrollment()} disabled={securityBusy} className="mt-3 text-xs font-bold text-[#0369A1] hover:underline disabled:opacity-50">
                          {securityBusy ? 'Preparing…' : 'Set up authenticator →'}
                        </button>
                      ) : (
                        <div className="mt-4 space-y-3">
                          <div className="flex justify-center rounded-xl bg-white p-3">
                            <Image src={enrollment.qrCode} alt="Authenticator setup QR code" width={200} height={200} unoptimized />
                          </div>
                          <p className="text-xs text-[#6B7A8D]">If you cannot scan the QR code, enter this key in your authenticator app:</p>
                          <code className="block break-all rounded-lg bg-[#F5F7FB] p-2 text-xs text-[#0B1221]">{enrollment.secret}</code>
                          <label className="block text-xs font-bold text-[#4B5A6E]">
                            Verification code
                            <input
                              value={verificationCode}
                              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              className="mt-1.5 w-full rounded-xl border border-[#DDE3EE] px-3 py-2.5 text-sm tracking-[0.3em] text-[#0B1221]"
                            />
                          </label>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => void verifyTotpEnrollment()} disabled={securityBusy} className="rounded-lg bg-[#1e3a8a] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                              Verify and enable
                            </button>
                            <button type="button" onClick={() => setEnrollment(null)} disabled={securityBusy} className="rounded-lg border border-[#DDE3EE] px-4 py-2 text-xs font-bold text-[#4B5A6E] disabled:opacity-50">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {securityMessage && (
                    <p className={`mt-4 text-xs font-semibold ${securityError ? 'text-red-600' : 'text-emerald-700'}`} role="status">
                      {securityMessage}
                    </p>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl border-[1.5px] border-red-200 p-6 shadow-sm">
                  <h2 className="text-base font-extrabold text-red-700 mb-1">Danger Zone</h2>
                  <p className="text-xs text-[#6B7A8D] mb-5">Actions here are immediate and cannot be undone.</p>

                  {!logoutConfirm ? (
                    <button
                      onClick={() => setLogoutConfirm(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-[0_2px_8px_rgba(220,38,38,0.30)] hover:bg-red-700 hover:shadow-[0_4px_14px_rgba(220,38,38,0.40)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out of Portal
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm font-semibold text-red-700 flex-1">Are you sure you want to sign out?</p>
                      <button
                        onClick={logout}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
                      >
                        Yes, Sign Out
                      </button>
                      <button
                        onClick={() => setLogoutConfirm(false)}
                        className="px-4 py-2 bg-white border border-[#DDE3EE] text-[#4B5A6E] rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}