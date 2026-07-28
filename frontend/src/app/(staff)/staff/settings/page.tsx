'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Settings, User, Bell, Shield, LogOut } from 'lucide-react';

export default function StaffSettingsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (!isAuthenticated) {
    return null;
  }

  if (user && !['RECEPTIONIST', 'DOCTOR', 'ADMIN'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Settings className="w-6 h-6 text-[#1e3a8a]" />
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-[#1e3a8a] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-[#1e3a8a] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'bg-[#1e3a8a] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Security
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={user?.firstName || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Cannot be modified</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={user?.lastName || ''}
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Cannot be modified</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      value={user?.role || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive appointment reminders via email</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-[#1e3a8a] rounded" />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">SMS Notifications</p>
                      <p className="text-sm text-gray-600">Receive appointment reminders via SMS</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 text-[#1e3a8a] rounded" />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Appointment Confirmations</p>
                      <p className="text-sm text-gray-600">Get notified when appointments are confirmed</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-[#1e3a8a] rounded" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Security Settings</h2>
                  <div className="space-y-4">
                    <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                    </button>
                    <button className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-red-900 mb-4">Danger Zone</h2>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}