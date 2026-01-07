import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import CheckInOut from '../components/CheckInOut';
import OvertimeRequest from '../components/OvertimeRequest';
import CompOffManagement from '../components/CompOffManagement';
import EmployeeProfilePage from './EmployeeProfile';
import { useLanguage } from '../context/LanguageContext';
import api, {
  listLeaveRequests,
  listEmployees,
  getSchedules,
  getAttendance,
  checkIn,
  checkOut,
  getMessages,
  deleteMessage,
  markMessageAsRead,
  createLeaveRequest,
  getLeaveStatistics
} from '../services/api';
import {
  Plus, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Calendar,
  CalendarDays, MessageSquare, UserCheck, Mail, MailOpen, AlertCircle, LogOut, Trash2, X, Download, RefreshCw
} from 'lucide-react';

// =============== EMPLOYEE PAGES ===============

const EmployeeDashboardHome = ({ user }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leaveStats, setLeaveStats] = useState(null);
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  useEffect(() => {
    loadData();
    // Auto-refresh dashboard data every 30 seconds to catch schedule updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [schedulesRes, statsRes] = await Promise.all([
        getSchedules(today, today),
        getLeaveStatistics()
      ]);
      setTodaySchedule(schedulesRes.data[0] || null);
      setLeaveStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div>
      <Header title={t('employeeDashboard')} subtitle={`${t('welcome')}, ${user.full_name}`} />
      <div className="p-6">
        <div className="mb-6 flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('refresh')}
          </Button>
        </div>
        {/* Paid Leave Notification */}
        {leaveStats && leaveStats.taken_paid_leave <= 1 && (
          <div className="mb-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900">{t('paidLeaveStatus')}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {t('youHaveTaken')} <strong>{leaveStats.taken_paid_leave}</strong> {leaveStats.taken_paid_leave > 1 ? t('daysOfPaidLeaveAvailable') : t('dayOfPaidLeave')} {t('youHave')} <strong>{leaveStats.available_paid_leave}</strong> {t('daysOfPaidLeaveAvailable')}.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card title={`${t('todaysSchedule')}${t(monthKeys[new Date().getMonth()])} ${new Date().getDate()}, ${new Date().getFullYear()}`}>
            {todaySchedule ? (
              <div className="space-y-4">
                {todaySchedule.status !== 'comp_off_taken' && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">{t('shiftTime')}</p>
                      <p className="text-lg font-semibold text-blue-900">
                        {todaySchedule.start_time} - {todaySchedule.end_time}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                {todaySchedule.status === 'comp_off_taken' && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">{t('status')}</p>
                      <p className="text-lg font-semibold text-purple-900">
                        {t('fullDayCompOff')}
                      </p>
                      {todaySchedule.start_time && todaySchedule.end_time && (
                        <p className="text-xs text-purple-600 mt-2">
                          {t('regularShift')}: {todaySchedule.start_time} - {todaySchedule.end_time}
                        </p>
                      )}
                    </div>
                    <Clock className="w-8 h-8 text-purple-600" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">{t('noShiftScheduledForToday')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('enjoyYourDayOff')}</p>
              </div>
            )}
          </Card>
          <CheckInOut />
          <Card title={t('quickAccess')}>
            <div className="space-y-3">
              <Button variant="outline" fullWidth className="justify-start" onClick={() => navigate('/schedule')}>
                <CalendarDays className="w-5 h-5 mr-3" />
                {t('viewMySchedule')}
              </Button>
              <Button variant="outline" fullWidth className="justify-start" onClick={() => navigate('/requests')}>
                <Clock className="w-5 h-5 mr-3" />
                {t('requestLeave')}
              </Button>
              <Button variant="outline" fullWidth className="justify-start" onClick={() => navigate('/messages')}>
                <MessageSquare className="w-5 h-5 mr-3" />
                {t('messages')}
              </Button>
              <Button variant="outline" fullWidth className="justify-start" onClick={() => navigate('/attendance')}>
                <UserCheck className="w-5 h-5 mr-3" />
                {t('viewAttendanceHistory')}
              </Button>
            </div>
          </Card>
        </div>
        <Card title={t('importantInformation')}>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• {t('rememberToCheckIn')}</p>
            <p>• {t('checkScheduleRegularly')}</p>
            <p>• {t('submitLeaveRequestsInAdvance')}</p>
            <p>• {t('contactManagerIfQuestions')}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

const EmployeeCheckIn = ({ user }) => {
  const { t } = useLanguage();
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [location, setLocation] = useState('Office');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  useEffect(() => {
    loadSchedule();
    // Auto-refresh schedule every 30 seconds to catch manager updates
    const interval = setInterval(loadSchedule, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSchedule = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await getSchedules(today, today);
      setTodaySchedule(response.data[0] || null);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setMessage({ type: '', text: '' });
    try {
      await checkIn(location);
      setCheckedIn(true);
      setCheckInTime(new Date());
      setMessage({ type: 'success', text: t('successfullyCheckedIn') });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || t('failedToCheckIn')
      });
    }
  };

  const handleCheckOut = async () => {
    setMessage({ type: '', text: '' });
    try {
      await checkOut(notes);
      setCheckedIn(false);
      setMessage({ type: 'success', text: t('successfullyCheckedOut') });
      setTimeout(() => {
        setCheckInTime(null);
        setNotes('');
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || t('failedToCheckOut')
      });
    }
  };

  if (loading) return <div className="p-6">{t('loading')}</div>;

  if (!todaySchedule) {
    return (
      <div>
        <Header title={t('checkInOut')} subtitle={t('recordYourAttendance')} />
        <div className="p-6">
          <Card>
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">{t('noShiftScheduledForToday')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('youDontNeedToCheckInToday')}</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={t('checkInOut')} subtitle={t('recordYourAttendance')} />
      <div className="p-6">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            )}
            <span className={`text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
              {message.text}
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={`${t('todaysShift')}${t(monthKeys[new Date().getMonth()])} ${new Date().getDate()}, ${new Date().getFullYear()}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">{t('attendanceScheduledTime')}</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {todaySchedule.start_time} - {todaySchedule.end_time}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              {checkedIn && checkInTime && (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">{t('attendanceCheckIn')}</p>
                    <p className="text-lg font-semibold text-green-900">
                      {format(checkInTime, 'HH:mm:ss')}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">{t('currentTime')}</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {format(new Date(), 'HH:mm:ss')}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </Card>
          <Card title={checkedIn ? t('checkOut') : t('checkIn')}>
            {!checkedIn ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('location')}
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Office">{t('office')}</option>
                    <option value="Remote">{t('remote')}</option>
                    <option value="Client Site">{t('clientSite')}</option>
                  </select>
                </div>
                <Button variant="success" fullWidth className="h-14 text-lg" onClick={handleCheckIn}>
                  <UserCheck className="w-6 h-6 mr-2 inline" />
                  {t('checkInNow')}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  {t('clickButtonWhenArrive')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-2" />
                  <p className="text-green-800 font-semibold">{t('youAreCheckedIn')}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {t('since')} {checkInTime && format(checkInTime, 'HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('notesOptional')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows="3"
                    placeholder={t('addAnyNotesAboutShift')}
                  />
                </div>
                <Button variant="danger" fullWidth className="h-14 text-lg" onClick={handleCheckOut}>
                  <LogOut className="w-6 h-6 mr-2 inline" />
                  {t('checkOutNow')}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  {t('clickButtonWhenLeaving')}
                </p>
              </div>
            )}
          </Card>
        </div>
        <Card title={t('tips')} className="mt-6">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• {t('checkInWhenArrive')}</li>
            <li>• {t('makeSureToCheckOut')}</li>
            <li>• {t('lateCheckInsFlagged')}</li>
            <li>• {t('contactManagerCheckInIssues')}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

const EmployeeSchedule = () => {
  const { t, language } = useLanguage();
  const [schedules, setSchedules] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  useEffect(() => {
    loadSchedules();
    // Auto-refresh schedule every 30 seconds to catch manager updates
    const interval = setInterval(loadSchedules, 30000);
    return () => clearInterval(interval);
  }, [currentMonth]);

  const loadSchedules = async () => {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const response = await getSchedules(start, end);
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div>
      <Header title={t('mySchedule')} subtitle={t('viewYourUpcomingShifts')} />
      <div className="p-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {t(monthKeys[currentMonth.getMonth()])} {currentMonth.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadSchedules}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {t('refresh')}
            </Button>
          </div>
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('noShiftsScheduledForMonth')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('checkBackLaterUpdates')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => {
                // Determine status color and label
                const getStatusColor = (status) => {
                  switch (status) {
                    case 'scheduled':
                      return 'bg-blue-100 text-blue-800';
                    case 'leave':
                      return 'bg-orange-100 text-orange-800';
                    case 'leave_half_morning':
                      return 'bg-yellow-100 text-yellow-800';
                    case 'leave_half_afternoon':
                      return 'bg-amber-100 text-amber-800';
                    case 'comp_off_earned':
                      return 'bg-green-100 text-green-800';
                    case 'comp_off_taken':
                      return 'bg-purple-100 text-purple-800';
                    default:
                      return 'bg-gray-100 text-gray-800';
                  }
                };

                const getStatusLabel = (status) => {
                  switch (status) {
                    case 'scheduled':
                      return t('scheduled');
                    case 'leave':
                      return t('leaveFullDay');
                    case 'leave_half_morning':
                      return t('leaveHalfMorning');
                    case 'leave_half_afternoon':
                      return t('leaveHalfAfternoon');
                    case 'comp_off_earned':
                      return t('compOffEarned');
                    case 'comp_off_taken':
                      return t('compOffTaken');
                    default:
                      return status;
                  }
                };

                const getTimeDisplay = (schedule) => {
                  // For leaves and comp-off taken, don't show times
                  if (schedule.status === 'leave' || 
                      schedule.status === 'leave_half_morning' || 
                      schedule.status === 'leave_half_afternoon' ||
                      schedule.status === 'comp_off_taken') {
                    return '-';
                  }
                  // For other statuses, show times if available
                  if (!schedule.start_time || !schedule.end_time) return '-';
                  return `${schedule.start_time} - ${schedule.end_time}`;
                };

                return (
                  <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(schedule.date + 'T00:00:00'), 'EEEE, MMMM dd, yyyy', { locale: language === 'ja' ? ja : undefined })}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {getTimeDisplay(schedule)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(schedule.status)}`}>
                          {getStatusLabel(schedule.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card title={t('scheduleInformation')} className="mt-6">
          <div className="space-y-2 text-sm text-gray-600">
            <p>• {t('yourScheduleUpdatedRegularly')}</p>
            <p>• {t('makeSureCheckInOnTime')}</p>
            <p>• {t('ifCantMakeShift')}</p>
            <p>• {t('contactManagerScheduleQuestions')}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

const EmployeeLeaves = ({ user }) => {
  const { t, language } = useLanguage();
  const [leaves, setLeaves] = useState([]);
  const [leaveStats, setLeaveStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [employeeId, setEmployeeId] = useState(null);
  const [formData, setFormData] = useState({
    leave_type: 'paid',
    duration_type: 'full_day',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      // Get employee data to find employee_id
      const empRes = await listEmployees();
      const employees = empRes.data;
      
      // Find current employee
      const currentEmp = employees.find(e => e.user_id === user.id);
      if (currentEmp) {
        setEmployeeId(currentEmp.id);
      }
      
      const response = await listLeaveRequests();
      setLeaves(response.data);
      
      // Fetch leave statistics
      try {
        const statsRes = await getLeaveStatistics();
        setLeaveStats(statsRes.data);
        
        // Set initial leave_type based on available balance
        const stats = statsRes.data;
        if (stats.available_paid_leave > 0) {
          setFormData(prev => ({ ...prev, leave_type: 'paid' }));
        } else if (stats.comp_off_available > 0) {
          setFormData(prev => ({ ...prev, leave_type: 'comp_off' }));
        } else {
          setFormData(prev => ({ ...prev, leave_type: 'unpaid' }));
        }
      } catch (statsError) {
        console.error('Failed to load leave statistics:', statsError);
      }
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!employeeId) {
      setError('Unable to find your employee record. Please refresh the page.');
      return;
    }
    
    try {
      const submitData = {
        ...formData,
        employee_id: employeeId
      };
      
      // For half-day leaves, auto-set end_date = start_date
      if (submitData.duration_type.startsWith('half_day')) {
        submitData.end_date = submitData.start_date;
      }
      
      await createLeaveRequest(submitData);
      setShowModal(false);
      // Reset form with smart leave_type based on available balance
      if (leaveStats?.available_paid_leave > 0) {
        setFormData({ leave_type: 'paid', duration_type: 'full_day', start_date: '', end_date: '', reason: '' });
      } else if (leaveStats?.comp_off_available > 0) {
        setFormData({ leave_type: 'comp_off', duration_type: 'full_day', start_date: '', end_date: '', reason: '' });
      } else {
        setFormData({ leave_type: 'unpaid', duration_type: 'full_day', start_date: '', end_date: '', reason: '' });
      }
      loadLeaves();
    } catch (err) {
      let errorMsg = 'Failed to create leave request';
      
      // Handle validation errors from backend
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        
        // Check if it's an array of validation errors
        if (Array.isArray(detail)) {
          errorMsg = detail.map(e => {
            if (typeof e === 'object' && e.msg) {
              const field = e.loc?.[1] || 'field';
              return `${field}: ${e.msg}`;
            }
            return String(e);
          }).join('; ');
        } else if (typeof detail === 'object' && detail.msg) {
          errorMsg = detail.msg;
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        }
      }
      
      setError(errorMsg);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };
    const config = configs[status] || configs.pending;
    const Icon = config.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${config.bg} ${config.text} flex items-center`}>
        <Icon className="w-3 h-3 mr-1" />
        {t(status)}
      </span>
    );
  };

  if (loading) return <div className="p-6">{t('loading')}</div>;

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;

  return (
    <div>
      <Header title={t('leaveRequests')} subtitle={t('requestAndManageTimeOff')} />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('pendingLeaveRequests')}</p>
                  <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('approvedLeaveRequests')}</p>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('totalLeaveRequests')}</p>
                  <p className="text-3xl font-bold text-blue-600">{leaves.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {leaveStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card padding={false}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('totalPaidLeaveAmount')}</p>
                    <p className="text-3xl font-bold text-purple-600">{leaveStats.total_paid_leave || 0}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </Card>
            <Card padding={false}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('takenPaidLeaveAmount')}</p>
                    <p className="text-3xl font-bold text-orange-600">{leaveStats.taken_paid_leave || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </Card>
            <Card padding={false}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('availablePaidLeaveAmount')}</p>
                    <p className="text-3xl font-bold text-green-600">{leaveStats.available_paid_leave || 0}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </Card>
            <Card padding={false}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('usagePercentage')}</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {leaveStats.total_paid_leave > 0 
                        ? Math.round((leaveStats.taken_paid_leave / leaveStats.total_paid_leave) * 100)
                        : 0}%
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </Card>
          </div>
        )}
        <Card
          title={t('myLeaveRequests')}
          subtitle={`${leaves.length} ${t('totalRequests')}`}
          headerAction={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2 inline" />
              {t('newRequest')}
            </Button>
          }
        >
          {leaves.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('noLeaveRequestsYet')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('createFirstLeaveRequest')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaves.map((leave) => (
                <div key={leave.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-gray-900 capitalize">
                          {t(leave.leave_type) || leave.leave_type.replace('_', ' ')}
                        </span>
                        {getStatusBadge(leave.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {format(new Date(leave.start_date), 'MMM dd, yyyy', { locale: language === 'ja' ? ja : undefined })} -{' '}
                        {format(new Date(leave.end_date), 'MMM dd, yyyy', { locale: language === 'ja' ? ja : undefined })}
                      </p>
                      <p className="text-sm text-gray-700">{leave.reason}</p>
                      {leave.review_notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          <p className="text-xs text-gray-500">{t('managersNote')}:</p>
                          <p className="text-sm text-gray-700">{leave.review_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={t('requestLeaveModal')}
          footer={
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleSubmit}>
                {t('submitRequest')}
              </Button>
            </div>
          }
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Leave Type and Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">📋 {t('leaveTypeLabel')}</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                  required
                >
                  {leaveStats?.available_paid_leave > 0 && (
                    <option value="paid">{t('paidLeaveWithDays').replace('{0}', leaveStats.available_paid_leave)}</option>
                  )}
                  <option value="unpaid">{t('unpaidLeaveLabel')}</option>
                  {leaveStats?.comp_off_available > 0 && (
                    <option value="comp_off">{t('compOffLabel').replace('{0}', leaveStats.comp_off_available)}</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('selectLeaveType')}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">⏰ {t('durationTypeLabel')}</label>
                <select
                  value={formData.duration_type}
                  onChange={(e) => setFormData({ ...formData, duration_type: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                  required
                >
                  <option value="full_day">{t('fullDayEntireDay')}</option>
                  <option value="half_day_morning">{t('halfDayMorning')}</option>
                  <option value="half_day_afternoon">{t('halfDayAfternoon')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('chooseFullOrHalfDay')}</p>
              </div>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">📅 {t('startDateLabel')}</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">📅 {t('endDateLabel')}</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                  required
                  disabled={formData.duration_type.startsWith('half_day')}
                />
                {formData.duration_type.startsWith('half_day') && (
                  <p className="text-xs text-blue-600 mt-1">{t('autoSetToStartDate')}</p>
                )}
              </div>
            </div>

            {/* Reason Field */}
            <div className="pb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">📝 {t('reasonLabel')}</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows="3"
                placeholder={t('provideReasonForRequest')}
              />
            </div>

            {/* Summary */}
            {formData.leave_type && formData.duration_type && formData.start_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  {t('requestSummaryLabel')} {formData.duration_type.startsWith('half_day') ? t('halfDay') : t('fullDayEntireDay')} {formData.leave_type} leave 
                  on {new Date(formData.start_date).toLocaleDateString()}
                  {formData.duration_type === 'half_day_morning' && ` (${t('morningLabel')})`}
                  {formData.duration_type === 'half_day_afternoon' && ` (${t('afternoonLabel')})`}
                </p>
              </div>
            )}
          </form>
        </Modal>
      </div>
    </div>
  );
};

const EmployeeAttendance = () => {
  const { t, language } = useLanguage();
  const [attendance, setAttendance] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 });
  const [downloading, setDownloading] = useState(false);
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  useEffect(() => {
    loadAttendance();
  }, [currentMonth]);

  const loadAttendance = async () => {
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const response = await getAttendance(start, end);
      setAttendance(response.data);

      // Calculate real statistics from attendance data
      let present = 0, late = 0, absent = 0;
      response.data.forEach(record => {
        if (record.in_time) {
          if (record.status === 'onTime') present++;
          else late++;
        } else {
          absent++;
        }
      });

      setStats({ present, late, absent });
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMonthly = async () => {
    try {
      setDownloading(true);
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/attendance/export/employee-monthly?year=${year}&month=${month}&language=${language}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_${format(currentMonth, 'MMMM_yyyy')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert(t('failedToDownloadReport'));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div>
      <Header title={t('myAttendance')} subtitle={t('viewAttendanceHistory')} />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('attendanceOnTime')}</p>
                  <p className="text-3xl font-bold text-green-600">{stats.present}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('attendanceLate')}</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('attendanceAbsent')}</p>
                  <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {t(monthKeys[currentMonth.getMonth()])} {currentMonth.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={handleDownloadMonthly} 
              disabled={downloading}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? t('downloading') : t('downloadReport')}</span>
            </Button>
          </div>

          {/* Monthly Summary Stats */}
          {attendance.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-xs text-gray-600 mb-1">{t('totalHoursWorked')}</p>
                <p className="text-lg font-bold text-blue-600">
                  {(attendance.reduce((sum, r) => sum + (r.worked_hours || 0), 0)).toFixed(2)}h
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{t('attendanceNightHours')}</p>
                <p className="text-lg font-bold text-purple-600">
                  {(attendance.reduce((sum, r) => sum + (r.night_hours || 0), 0)).toFixed(2)}h
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{t('overtimeHoursLabel')}</p>
                <p className="text-lg font-bold text-orange-600">
                  {(attendance.reduce((sum, r) => sum + (r.overtime_hours || 0), 0)).toFixed(2)}h
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{t('attendanceDaysWorked')}</p>
                <p className="text-lg font-bold text-green-600">
                  {attendance.filter(r => r.in_time).length}
                </p>
              </div>
            </div>
          )}

          {attendance.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('noAttendanceRecordsForMonth')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceDate')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceScheduledTime')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceCheckIn')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceCheckOut')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceHoursWorked')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceNightHours')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceBreak')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceOTHours')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('attendanceStatus')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {format(new Date(record.date + 'T00:00:00'), 'MMM dd, yyyy', { locale: language === 'ja' ? ja : undefined })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.schedule ? `${record.schedule.start_time} - ${record.schedule.end_time}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {record.in_time ? record.in_time : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {record.out_time ? record.out_time : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {record.worked_hours ? `${record.worked_hours.toFixed(2)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                        {record.night_hours ? `${record.night_hours.toFixed(2)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.break_minutes ? `${record.break_minutes}m` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        {record.overtime_hours ? `${record.overtime_hours.toFixed(2)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'onTime' ? 'bg-green-100 text-green-800' :
                          record.status === 'slightlyLate' ? 'bg-yellow-100 text-yellow-800' :
                          record.status === 'late' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {record.status === 'onTime' ? t('onTime') :
                           record.status === 'slightlyLate' ? t('slightlyLate') :
                           record.status === 'late' ? t('late') :
                           t('scheduled')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title={t('attendanceTips')} className="mt-6">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• {t('alwaysCheckInOnTime')}</li>
            <li>• {t('lateArrivalsMayImpact')}</li>
            <li>• {t('notifyManagerInAdvance')}</li>
            <li>• {t('attendanceHistoryVisible')}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

const EmployeeMessages = () => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await getMessages();
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(id);
        loadMessages();
      } catch (error) {
        alert(t('failedToDeleteMessage'));
      }
    }
  };

  const handleMarkAsRead = async (id, isRead) => {
    try {
      if (!isRead) {
        await markMessageAsRead(id);
      }
      loadMessages();
    } catch (error) {
      alert(t('failedToUpdateMessageStatus'));
    }
  };

  if (loading) return <div className="p-6">{t('loading')}</div>;

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div>
      <Header title={t('messages')} subtitle={t('messagesFromManager')} />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('unreadMessages')}</p>
                  <p className="text-3xl font-bold text-blue-600">{unreadCount}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('totalMessages')}</p>
                  <p className="text-3xl font-bold text-gray-900">{messages.length}</p>
                </div>
                <MailOpen className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </Card>
        </div>
        <Card title={t('messages')} subtitle={`${messages.length} ${t('totalMessages')}`}>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('noMessagesYet')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('messagesFromManager')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    msg.is_read
                      ? 'border-gray-200 bg-white hover:border-gray-300'
                      : 'border-blue-200 bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {!msg.is_read && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-200 text-yellow-800">
                            {t('unread')}
                          </span>
                        )}
                        <h4 className="font-semibold text-gray-900">{msg.subject}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('from')}: {msg.department_id ? t('departmentManager') : t('manager')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className="text-xs text-gray-500">
                        {format(new Date(msg.created_at), 'MMM dd, HH:mm', { locale: language === 'ja' ? ja : undefined })}
                      </span>
                      <button
                        onClick={() => handleMarkAsRead(msg.id, msg.is_read)}
                        className={`p-1 rounded ${msg.is_read ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}`}
                        title={msg.is_read ? 'Mark as unread' : 'Mark as read'}
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Delete message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mt-3 pl-2 border-l-2 border-gray-300 whitespace-pre-wrap">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// =============== EMPLOYEE REQUESTS COMPONENT ===============

const EmployeeRequests = ({ user }) => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    leave_type: 'paid',
    duration_type: 'full_day',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [compOffBalance, setCompOffBalance] = useState(0);

  useEffect(() => {
    loadRequests();
    loadCompOffBalance();
  }, []);

  const loadCompOffBalance = async () => {
    try {
      const response = await api.get('/comp-off/balance');
      if (response.data && response.data.balance) {
        setCompOffBalance(response.data.balance);
      }
    } catch (err) {
      console.error('Failed to load comp-off balance:', err);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await listLeaveRequests();
      setRequests(response.data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // For half-day leaves, set end_date to start_date
      const submitData = { ...formData };
      if (submitData.duration_type && submitData.duration_type.startsWith('half_day')) {
        submitData.end_date = submitData.start_date;
      }
      
      await createLeaveRequest(submitData);
      setSuccess('✅ Leave request submitted successfully! Your manager will review it.');
      setFormData({ leave_type: 'paid', duration_type: 'full_day', start_date: '', end_date: '', reason: '' });
      setShowModal(false);
      loadRequests();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 inline mr-2 text-green-600" />;
      case 'rejected':
        return <X className="w-5 h-5 inline mr-2 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 inline mr-2 text-yellow-600" />;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  if (loading) return <div className="p-6">{t('loading')}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        title={t('requestsApprovals')} 
        subtitle={t('manageYourLeaveAndOvertimeRequests')}
      />
      
      <div className="p-6">
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Pending Requests */}
        <Card 
          title={t('pendingRequests')} 
          subtitle={pendingRequests.length === 0 ? t('noPendingRequests') : ''}
          action={
            <Button onClick={() => setShowModal(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('newRequest')}
            </Button>
          }
        >
          {pendingRequests.length > 0 && (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        {getStatusIcon(req.status)}
                        <span className="font-semibold capitalize">{t(req.leave_type) || req.leave_type}</span>
                        {req.duration_type && req.duration_type !== 'full_day' && (
                          <span className="text-xs ml-2 px-2 py-1 bg-yellow-100 rounded capitalize">
                            {req.duration_type.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(req.status)}`}>
                          {t(req.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {req.start_date} to {req.end_date}
                      </p>
                      {req.reason && (
                        <p className="text-sm text-gray-600 mt-2"><strong>Reason:</strong> {req.reason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Approved Requests */}
        {approvedRequests.length > 0 && (
          <Card title={t('approvedRequests')} className="mt-6">
            <div className="space-y-3">
              {approvedRequests.map((req) => (
                <div key={req.id} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold capitalize">{t(req.leave_type) || req.leave_type}</span>
                        {req.duration_type && req.duration_type !== 'full_day' && (
                          <span className="text-xs ml-2 px-2 py-1 bg-green-100 rounded capitalize">
                            {req.duration_type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {req.start_date} to {req.end_date}
                      </p>
                      {req.reason && (
                        <p className="text-sm text-gray-600 mt-2"><strong>Reason:</strong> {req.reason}</p>
                      )}
                      {req.reviewed_by && (
                        <p className="text-xs text-gray-500 mt-2">Approved by manager on {req.reviewed_at}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <Card title={t('rejectedRequests')} className="mt-6">
            <div className="space-y-3">
              {rejectedRequests.map((req) => (
                <div key={req.id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-start">
                    <X className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-semibold capitalize">{t(req.leave_type) || req.leave_type}</span>
                        {req.duration_type && req.duration_type !== 'full_day' && (
                          <span className="text-xs ml-2 px-2 py-1 bg-red-100 rounded capitalize">
                            {req.duration_type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">
                        {req.start_date} to {req.end_date}
                      </p>
                      {req.reason && (
                        <p className="text-sm text-gray-600 mt-2"><strong>Reason:</strong> {req.reason}</p>
                      )}
                      {req.reviewed_by && (
                        <p className="text-xs text-gray-500 mt-2">Rejected by manager on {req.reviewed_at}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Modal for new request */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={t('submitLeaveRequest')}
          footer={
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" form="leaveRequestForm">
                {t('submitRequest')}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} id="leaveRequestForm" className="space-y-6">
            {/* Leave Type and Duration Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">📋 {t('leaveTypeLabel')}</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                >
                  <option value="paid">✓ {t('paidLeaveWithDays', { days: 'N/A' })}</option>
                  <option value="unpaid">⊘ {t('unpaidLeaveLabel')}</option>
                  {compOffBalance > 0 && <option value="comp_off">♻ {t('compOffLabel')} ({compOffBalance})</option>}
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('selectLeaveType')}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">⏰ {t('durationTypeLabel')}</label>
                <select
                  value={formData.duration_type}
                  onChange={(e) => setFormData({ ...formData, duration_type: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                >
                  <option value="full_day">{t('fullDayEntireDay')}</option>
                  <option value="half_day_morning">{t('halfDayMorning')}</option>
                  <option value="half_day_afternoon">{t('halfDayAfternoon')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('chooseFullOrHalfDay')}</p>
              </div>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">📅 {t('startDateLabel')}</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">📅 {t('endDateLabel')}</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
                  required
                  disabled={formData.duration_type.startsWith('half_day')}
                />
                {formData.duration_type.startsWith('half_day') && (
                  <p className="text-xs text-blue-600 mt-1">{t('autoSetToStartDate')}</p>
                )}
              </div>
            </div>

            {/* Reason Field */}
            <div className="pb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">📝 {t('reasonLabel')}</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows="3"
                placeholder={t('provideReasonForRequest')}
              />
            </div>

            {/* Summary */}
            {formData.leave_type && formData.duration_type && formData.start_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>{t('requestSummaryLabel')}:</strong> {formData.duration_type.startsWith('half_day') ? t('halfDay') : t('fullDayEntireDay')} {formData.leave_type} leave 
                  on {new Date(formData.start_date).toLocaleDateString()}
                  {formData.duration_type === 'half_day_morning' && ` (${t('morningLabel')})`}
                  {formData.duration_type === 'half_day_afternoon' && ` (${t('afternoonLabel')})`}
                </p>
              </div>
            )}
          </form>
        </Modal>
      </div>
    </div>
  );
};

// =============== EMPLOYEE COMP-OFF COMPONENT ===============

const EmployeeCompOff = ({ user }) => {
  const { t } = useLanguage();
  return (
    <div>
      <Header title={t('compOffManagement')} subtitle={t('applyAndManageCompOff')} />
      <div className="p-6">
        <CompOffManagement currentUser={user} departmentId={null} />
      </div>
    </div>
  );
};

// =============== MAIN EMPLOYEE DASHBOARD COMPONENT ===============

const EmployeeDashboard = ({ user, onLogout }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<EmployeeDashboardHome user={user} />} />
            <Route path="/profile" element={<EmployeeProfilePage user={user} />} />
            <Route path="/check-in" element={<EmployeeCheckIn user={user} />} />
            <Route path="/schedule" element={<EmployeeSchedule />} />
            <Route path="/leaves" element={<EmployeeLeaves user={user} />} />
            <Route path="/requests" element={<EmployeeRequests user={user} />} />
            <Route path="/overtime-requests" element={<OvertimeRequest />} />
            <Route path="/comp-off" element={<EmployeeCompOff user={user} />} />
            <Route path="/attendance" element={<EmployeeAttendance />} />
            <Route path="/messages" element={<EmployeeMessages />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
