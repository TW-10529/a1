import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

const NotificationBell = () => {
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000); // Refresh every 5 seconds for faster updates
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDelete = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await deleteNotification(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_approved':
        return '✅';
      case 'leave_rejected':
        return '❌';
      case 'leave_request':
        return '📝';
      case 'comp_off_approved':
        return '✅';
      case 'comp_off_rejected':
        return '❌';
      case 'comp_off_request':
        return '📝';
      case 'overtime_approved':
        return '✅';
      case 'overtime_rejected':
        return '❌';
      case 'overtime_request':
        return '📝';
      case 'comp_off_earned':
        return '💰';
      case 'comp_off_used':
        return '📅';
      case 'schedule_update':
        return '📅';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const translateNotificationTitle = (title, type) => {
    if (language !== 'ja') return title;

    // Parse and translate notification titles
    if (title.includes('Leave Request from')) {
      const name = title.replace('📝 Leave Request from ', '');
      return `📝 ${name}からの休暇申請`;
    }
    if (title.includes('Leave Request Approved')) {
      return '✅ 休暇申請が承認されました';
    }
    if (title.includes('Leave Request Rejected')) {
      return '❌ 休暇申請が却下されました';
    }
    if (title.includes('Comp-Off Request from')) {
      const name = title.replace('📝 Comp-Off Request from ', '');
      return `📝 ${name}からの代休申請`;
    }
    if (title.includes('Comp-Off Usage Approved')) {
      return '✅ 代休使用が承認されました';
    }
    if (title.includes('Comp-Off Usage Rejected')) {
      return '❌ 代休使用が却下されました';
    }
    if (title.includes('Overtime Request from')) {
      const name = title.replace('📝 Overtime Request from ', '');
      return `📝 ${name}からの残業申請`;
    }
    if (title.includes('Overtime Request Approved')) {
      return '✅ 残業申請が承認されました';
    }
    if (title.includes('Overtime Request Rejected')) {
      return '❌ 残業申請が却下されました';
    }
    return title;
  };

  const translateNotificationMessage = (message, type) => {
    if (language !== 'ja') return message;

    // Parse and translate notification messages
    const leaveRequestMatch = message.match(/^(.+) has requested (\w+) leave from (.+) to (.+)\.$/);
    if (leaveRequestMatch) {
      const [, name, leaveType, startDate, endDate] = leaveRequestMatch;
      const leaveTypeJa = leaveType === 'paid' ? '有給' : leaveType === 'unpaid' ? '無給' : leaveType === 'comp_off' ? '代休' : leaveType;
      return `${name}が${leaveTypeJa}休暇を${startDate}から${endDate}まで申請しました。`;
    }

    const leaveApprovedMatch = message.match(/^Your (.+) leave request from (.+) to (.+) has been approved\.$/);
    if (leaveApprovedMatch) {
      const [, leaveType, startDate, endDate] = leaveApprovedMatch;
      const leaveTypeJa = leaveType.toLowerCase() === 'paid' ? '有給' : leaveType.toLowerCase() === 'unpaid' ? '無給' : leaveType.toLowerCase() === 'comp_off' ? '代休' : leaveType;
      return `あなたの${leaveTypeJa}休暇申請（${startDate}から${endDate}まで）が承認されました。`;
    }

    const leaveRejectedMatch = message.match(/^Your (.+) leave request from (.+) to (.+) has been rejected\.$/);
    if (leaveRejectedMatch) {
      const [, leaveType, startDate, endDate] = leaveRejectedMatch;
      const leaveTypeJa = leaveType.toLowerCase() === 'paid' ? '有給' : leaveType.toLowerCase() === 'unpaid' ? '無給' : leaveType.toLowerCase() === 'comp_off' ? '代休' : leaveType;
      return `あなたの${leaveTypeJa}休暇申請（${startDate}から${endDate}まで）が却下されました。`;
    }

    const compOffRequestMatch = message.match(/^(.+) has requested comp-off for working on (.+)\.$/);
    if (compOffRequestMatch) {
      const [, name, date] = compOffRequestMatch;
      return `${name}が${date}の勤務に対して代休を申請しました。`;
    }

    const compOffApprovedMatch = message.match(/^Your comp-off request for (.+) has been approved\.$/);
    if (compOffApprovedMatch) {
      const [, date] = compOffApprovedMatch;
      return `${date}の代休申請が承認されました。`;
    }

    const compOffRejectedMatch = message.match(/^Your comp-off request for (.+) has been rejected\.$/);
    if (compOffRejectedMatch) {
      const [, date] = compOffRejectedMatch;
      return `${date}の代休申請が却下されました。`;
    }

    const overtimeRequestMatch = message.match(/^(.+) has requested overtime approval for (.+) hours on (.+)\.$/);
    if (overtimeRequestMatch) {
      const [, name, hours, date] = overtimeRequestMatch;
      return `${name}が${date}に${hours}時間の残業承認を申請しました。`;
    }

    const overtimeApprovedMatch = message.match(/^Your overtime request for (.+) hours on (.+) has been approved\.$/);
    if (overtimeApprovedMatch) {
      const [, hours, date] = overtimeApprovedMatch;
      return `${date}の${hours}時間の残業申請が承認されました。`;
    }

    const overtimeRejectedMatch = message.match(/^Your overtime request for (.+) hours on (.+) has been rejected\.$/);
    if (overtimeRejectedMatch) {
      const [, hours, date] = overtimeRejectedMatch;
      return `${date}の${hours}時間の残業申請が却下されました。`;
    }

    return message;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{t('notifications')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                {t('markAllRead')}
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t('loading')}...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">{t('noNotificationsYet')}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getNotificationIcon(notification.notification_type)}</span>
                        <h4 className="text-sm font-semibold text-gray-900">
                          {translateNotificationTitle(notification.title, notification.notification_type)}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {translateNotificationMessage(notification.message, notification.notification_type)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true,
                          locale: language === 'ja' ? ja : undefined
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notification.id);
                          }}
                          className="text-blue-600 hover:text-blue-700"
                          title={t('markAsRead')}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="text-gray-400 hover:text-red-500"
                        title={t('delete')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
