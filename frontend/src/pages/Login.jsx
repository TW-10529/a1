import React, { useState } from 'react';
import { AlertCircle, LogIn } from 'lucide-react';
import { login } from '../services/api';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import LanguageToggle from '../components/common/LanguageToggle';
import { useLanguage } from '../context/LanguageContext';

const Login = ({ onLogin }) => {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with username:', username);
      const response = await login(username, password);
      console.log('Login successful:', response);
      onLogin(response.user, response.access_token);
      // Redirect after a short delay to allow state to update
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage = err.response?.data?.detail || err.message || t('loginFailed');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4">
            <img 
              src="../images/ss2__1_-removebg-preview.png" 
              alt="Thirdwave Group Logo"
              className="w-12 h-12 -ml-3"
            />
            <div>
              <h1 className="text-5xl font-bold text-white mb-2 -ml-3">{t('thirdwaveGroup')}</h1>
            </div>
          </div>
          <p className="text-blue-100">{t('employeeManagementSystem')}</p>
        </div>

        <Card padding={false}>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('signIn')}</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('username')}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={t('enterYourUsername')}
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder={t('enterYourPassword')}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                fullWidth
                disabled={loading}
                className="mt-6"
              >
                <div className="flex items-center justify-center">
                  <LogIn className="w-5 h-5 mr-2" />
                  {loading ? t('signingIn') : t('signIn')}
                </div>
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">{t('demoCredentials')}:</p>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p><strong>{t('admin')}:</strong> admin / admin123</p>
                <p><strong>{t('manager')}:</strong> manager1 / manager123</p>
                <p><strong>{t('employee')}:</strong> john.smith / employee123</p>
              </div>
            </div>
          </div>
        </Card>

        <p className="text-center text-white text-sm mt-6">
          Thirdwave v5.1.0
        </p>
      </div>
    </div>
  );
};

export default Login;
