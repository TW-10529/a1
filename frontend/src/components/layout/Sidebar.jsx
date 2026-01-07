import { NavLink } from 'react-router-dom';
import { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  CalendarDays,
  ClipboardList,
  Clock,
  MessageSquare,
  UserCheck,
  LogOut,
  Gift
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Sidebar = ({ user, onLogout }) => {
  const { t } = useLanguage();
  const getNavItems = () => {
    if (user.user_type === 'admin') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { path: '/managers', icon: UserCog, label: t('manageManagers') },
        { path: '/departments', icon: Building2, label: t('manageDepartments') },
      ];
    } else if (user.user_type === 'manager') {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { path: '/employees', icon: Users, label: t('manageEmployees') },
        { path: '/schedules', icon: CalendarDays, label: t('scheduleManagement') },
        { path: '/roles', icon: ClipboardList, label: t('roleManagement') },
        { path: '/overtime-approvals', icon: Clock, label: t('overtimeApprovals') },
        { path: '/leaves', icon: UserCheck, label: t('leaveManagement') },
        { path: '/comp-off', icon: Gift, label: t('compOffRequests') },
        { path: '/attendance', icon: Clock, label: t('attendance') },
        { path: '/messages', icon: MessageSquare, label: t('notifications') },
      ];
    } else {
      return [
        { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
        { path: '/schedule', icon: CalendarDays, label: t('mySchedule') },
        { path: '/requests', icon: ClipboardList, label: t('requestsAndApprovals') },
        { path: '/overtime-requests', icon: Clock, label: t('overtimeRequest') },
        { path: '/leaves', icon: UserCheck, label: t('leaveManagement') },
        { path: '/comp-off', icon: Gift, label: t('compOff') },
        { path: '/attendance', icon: Clock, label: t('myAttendance') },
        { path: '/messages', icon: MessageSquare, label: t('notifications') },
      ];
    }
  };

  // Recalculate navItems whenever language changes
  const navItems = useMemo(() => getNavItems(), [t]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-1 mb-2">
          <img 
            src="../../images/ss2__1_-removebg-preview.png" 
            alt="Thirdwave Group Logo"
            className="w-10 h-10"
          />
          <h1 className="text-2xl font-bold">{t('thirdwaveGroup')}</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">
          {user.user_type === 'admin' 
            ? t('adminPortal') 
            : user.user_type === 'manager' 
            ? t('managerPortal') 
            : t('employeePortal')}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-700">
        <div className="px-4 py-2 mb-2">
          <p className="text-sm font-medium">{user.full_name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
