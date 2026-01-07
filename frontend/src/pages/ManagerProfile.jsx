import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Mail, Phone, Building2, RefreshCw, AlertCircle, User, Lock, Pencil } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getManagerProfile, changePassword } from '../services/api';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

const ManagerProfilePage = ({ user }) => {
  const { t, language } = useLanguage();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await getManagerProfile();
      setProfileData(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setPasswordError(t('required'));
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError(t('passwordsDoNotMatch'));
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordError(t('passwordMinLength'));
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });

      setPasswordSuccess(t('passwordChanged'));
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to change password:', err);
      const errorMessage = err.response?.data?.detail || t('passwordChangeFailed');
      if (errorMessage.includes('incorrect')) {
        setPasswordError(t('currentPasswordIncorrect'));
      } else if (errorMessage.includes('match')) {
        setPasswordError(t('passwordsDoNotMatch'));
      } else if (errorMessage.includes('different')) {
        setPasswordError(t('passwordMustBeDifferent'));
      } else {
        setPasswordError(errorMessage);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title={t('profile')} subtitle={t('myProfile')} />
        <div className="p-6 flex items-center justify-center h-96">
          <div className="text-xl text-gray-500">{t('loading')}</div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div>
        <Header title={t('profile')} subtitle={t('myProfile')} />
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900">{error || t('profileLoadError')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadProfile}
                  className="mt-4"
                >
                  {t('tryAgain')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return format(date, 'dd MMM yyyy HH:mm', { locale: language === 'ja' ? ja : undefined });
  };

  const profileSections = [
    {
      title: t('personalInformation'),
      fields: [
        {
          label: t('fullName'),
          value: profileData.full_name,
          icon: User
        },
        {
          label: t('username'),
          value: profileData.username
        },
        {
          label: t('email'),
          value: profileData.email,
          icon: Mail
        },
        {
          label: t('password'),
          value: '••••••••',
          icon: Lock,
          editable: true,
          editLabel: t('changePassword')
        }
      ]
    },
    {
      title: t('managerDetails'),
      fields: [
        {
          label: t('managerId'),
          value: profileData.manager_id
        },
        {
          label: t('department'),
          value: profileData.department_name,
          icon: Building2
        },
        {
          label: t('status'),
          value: profileData.is_active ? t('active') : t('inactive'),
          badge: profileData.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }
      ]
    },
    {
      title: t('systemInformation'),
      fields: [
        {
          label: t('createdAt'),
          value: formatDateTime(profileData.created_at)
        },
        {
          label: t('updatedAt'),
          value: formatDateTime(profileData.updated_at)
        }
      ]
    }
  ];

  return (
    <div>
      <Header title={t('profile')} subtitle={t('myProfile')} />
      
      <div className="px-6 pt-4 pb-6 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={loadProfile}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          {t('refresh')}
        </Button>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Sections */}
        {profileSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
            </div>

            {/* Section Content */}
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field, fieldIndex) => {
                  const IconComponent = field.icon;
                  return (
                    <div key={fieldIndex} className="flex items-start gap-4">
                      {IconComponent && (
                        <IconComponent className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {field.label}
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-base text-gray-900 break-words">
                            {field.value}
                          </p>
                          {field.badge && (
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${field.badge}`}>
                              {field.value}
                            </span>
                          )}
                          {field.editable && (
                            <button
                              onClick={() => setShowPasswordModal(true)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                              title={field.editLabel}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Last Updated Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">{t('lastUpdated')}:</span> {formatDateTime(profileData.updated_at)}
          </p>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordError(null);
            setPasswordSuccess(null);
            setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
          }}
          title={t('changePassword')}
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{passwordError}</p>
                </div>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">{passwordSuccess}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('currentPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.old_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, old_password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('enterPassword')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('newPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('enterNewPassword')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('confirmPassword')}
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('confirmNewPassword')}
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
                }}
                disabled={passwordLoading}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={passwordLoading}
              >
                {passwordLoading ? t('submitting') : t('update')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ManagerProfilePage;
