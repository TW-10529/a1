import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, addDays } from 'date-fns';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import RoleManagement from '../components/RoleManagement';
import ScheduleManager from '../components/ScheduleManager';
import OvertimeApproval from '../components/OvertimeApproval';
import CompOffManagement from '../components/CompOffManagement';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import {
  listEmployees,
  listLeaveRequests,
  getSchedules,
  getAttendance,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  createRole,
  listRoles,
  listShifts,
  generateSchedule,
  generateSchedules,
  approveLeave,
  rejectLeave,
  sendMessage,
  getMessages,
  deleteMessage,
  deleteShift,
  getEmployeeLeaveStatistics
} from '../services/api';
import {
  Plus, Edit2, Trash2, AlertCircle, Clock, CheckCircle, XCircle, ChevronLeft,
  ChevronRight, Calendar, Sparkles, Users, UserCheck, ClipboardList, CalendarDays,
  Send
} from 'lucide-react';

// =============== MANAGER PAGES ===============

const ManagerDashboardHome = ({ user }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    todayScheduled: 0,
    activeEmployees: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [employeesRes, leavesRes] = await Promise.all([
        listEmployees(),
        listLeaveRequests()
      ]);
      const employees = employeesRes.data;
      const leaves = leavesRes.data;
      setStats({
        totalEmployees: employees.length,
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
        todayScheduled: 0,
        activeEmployees: employees.filter(e => e.is_active).length
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: t('totalEmployees'), value: stats.totalEmployees, icon: Users, color: 'blue' },
    { title: t('pendingLeaves'), value: stats.pendingLeaves, icon: ClipboardList, color: 'yellow' },
    { title: t('activeEmployees'), value: stats.activeEmployees, icon: UserCheck, color: 'green' },
    { title: t('todaysSchedule'), value: stats.todayScheduled, icon: CalendarDays, color: 'purple' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title={t('dashboard')} subtitle={`${t('welcome')}, ${user.full_name}`} />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statCards.map((stat, index) => (
            <Card key={index} padding={false}>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                    <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={t('recentActivity')}>
            <div className="space-y-4">
              <p className="text-gray-600">
                {t('youAreManaging')} {stats.totalEmployees} {t('employeesInDepartment')}.
              </p>
              <p className="text-gray-600">
                {stats.pendingLeaves > 0 ? (
                  <span className="text-yellow-600 font-semibold">
                    {stats.pendingLeaves} {t('leaveRequest')}{stats.pendingLeaves > 1 ? 's' : ''} {t('pendingReview')}.
                  </span>
                ) : (
                  t('noPendingLeaveRequests')
                )}
              </p>
            </div>
          </Card>
          <Card title={t('quickTips')}>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• {t('reviewApproveLeaveRegularly')}</p>
              <p>• {t('checkDailyAttendance')}</p>
              <p>• {t('createSchedulesInAdvance')}</p>
              <p>• {t('keepEmployeeInfoUpdated')}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ManagerEmployees = ({ user }) => {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [managerDeptId, setManagerDeptId] = useState(user?.manager_department_id);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role_id: null,
    employment_type: 'full_time',
    hire_date: '',
    weekly_hours: 40,
    daily_max_hours: 8,
    shifts_per_week: 5,
    paid_leave_per_year: 10,
    skills: []
  });

  useEffect(() => {
    // If manager_department_id is not set, fetch it from the user's manager record
    if (!managerDeptId) {
      fetchManagerDept();
    }
    loadData();
  }, [showInactive]);

  const fetchManagerDept = async () => {
    try {
      const response = await api.get('/users/me');
      if (response.data?.manager_department_id) {
        setManagerDeptId(response.data.manager_department_id);
        console.log('Fetched manager department:', response.data.manager_department_id);
      }
    } catch (error) {
      console.error('Failed to fetch manager department:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesRes, rolesRes] = await Promise.all([
        api.get('/employees', { params: { show_inactive: showInactive } }),
        listRoles()
      ]);
      setEmployees(employeesRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await listEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      // Use the manager's department ID (from user object or fetched from API)
      const departmentId = managerDeptId || user?.manager_department_id;
      
      console.log('=== Employee Form Submit ===');
      console.log('User:', user);
      console.log('Manager Department ID:', departmentId);
      console.log('Form Data:', formData);
      
      const employeeData = {
        ...formData,
        department_id: departmentId
      };
      
      // Validate department_id exists
      if (!employeeData.department_id) {
        setError(t('deptInfoMissing'));
        return;
      }
      
      console.log('Employee Data to Submit:', employeeData);
      
      let response;
      if (editingEmployee) {
        console.log('Updating employee...');
        response = await updateEmployee(editingEmployee.id, employeeData);
        setSuccess(t('employeeUpdatedSuccess'));
      } else {
        console.log('Creating new employee...');
        response = await createEmployee(employeeData);
        console.log('Response:', response);
        setSuccess(t('employeeCreatedSuccess'));
      }
      
      // Only clear form if response was successful
      if (response) {
        console.log('Success! Clearing form...');
        setShowModal(false);
        setEditingEmployee(null);
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          address: '',
          password: '',
          role_id: null,
          employment_type: 'full_time',
          hire_date: '',
          weekly_hours: 40,
          daily_max_hours: 8,
          shifts_per_week: 5,
          paid_leave_per_year: 10,
          skills: []
        });
        loadData();  // ← Use loadData to respect showInactive filter

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      let errorMsg = t('failedSaveEmployee');
      
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        // Handle Pydantic validation errors (array of error objects)
        if (Array.isArray(detail)) {
          errorMsg = detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join('; ');
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        }
      }
      
      console.error('Final error message:', errorMsg);
      setError(errorMsg);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone || '',
      address: employee.address || '',
      password: '',
      role_id: employee.role_id || null,
      employment_type: employee.employment_type || 'full_time',
      hire_date: employee.hire_date || '',
      weekly_hours: employee.weekly_hours || 40,
      daily_max_hours: employee.daily_max_hours || 8,
      shifts_per_week: employee.shifts_per_week || 5,
      paid_leave_per_year: employee.paid_leave_per_year || 10,
      skills: employee.skills || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id, isInactive = false) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    let message = isInactive
      ? t('permanentlyDeleteInactiveEmployee')
      : t('confirmDeleteEmployee');

    if (window.confirm(message)) {
      try {
        // For inactive employees, use hard delete. For active, use soft delete.
        await deleteEmployee(id, isInactive);
        const successMsg = isInactive ? t('employeePermanentlyDeleted') : t('employeeDeletedSuccess');
        setSuccess(successMsg);
        setTimeout(() => setSuccess(''), 3000);
        loadData();  // ← Use loadData to respect showInactive filter
      } catch (error) {
        setError(t('failedDeleteEmployee'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const columns = [
    { header: t('employeeID'), accessor: 'employee_id' },
    { header: t('firstName'), render: (row) => `${row.first_name} ${row.last_name}` },
    { header: t('email'), accessor: 'email' },
    { header: t('phone'), accessor: 'phone' },
    {
      header: t('status'),
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.is_active ? t('active') : t('inactive')}
        </span>
      )
    },
    {
      header: t('actions'),
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, !row.is_active)}
            className={`${!row.is_active ? 'text-red-700 hover:text-red-900' : 'text-red-600 hover:text-red-800'}`}
            title={!row.is_active ? t('hardDeletePermanent') : t('softDeleteMarkInactive')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <Header title={t('manageEmployees')} subtitle={t('manageYourTeam')} />
      <div className="p-6">
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        )}
        <Card
          title={t('allEmployees')}
          subtitle={`${employees.length} ${t('totalEmployees')}`}
          headerAction={
            <div className="flex gap-2">
              <select
                value={employmentTypeFilter}
                onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('allTypes')}</option>
                <option value="full_time">{t('fullTime')}</option>
                <option value="part_time">{t('partTime')}</option>
              </select>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">{t('showInactive')}</span>
              </label>
              <Button onClick={() => { setEditingEmployee(null); setShowModal(true); }}>
                <Plus className="w-4 h-4 mr-2 inline" />
                {t('addEmployee')}
              </Button>
            </div>
          }
        >
          <Table columns={columns} data={employees.filter(emp => employmentTypeFilter === 'all' || emp.employment_type === employmentTypeFilter)} emptyMessage={t('noDataAvailable')} />
        </Card>
        <Modal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingEmployee(null); }}
          title={editingEmployee ? t('editEmployeeTitle') : t('addNewEmployeeTitle')}
          footer={
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => { setShowModal(false); setEditingEmployee(null); }}>
                {t('cancel')}
              </Button>
              <Button type="submit" form="employee-form">
                {editingEmployee ? t('updateButtonLabel') : t('createButtonLabel')} {t('employee')}
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
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('firstName')}</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('lastName')}</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
                {formData.email && (
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{t('loginUsername')}</strong> <code className="font-mono">{formData.email.split('@')[0]}</code>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">{t('employeeWillUseThisUsername')}</p>
                </div>
                {editingEmployee && editingEmployee.employee_id && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Employee ID:</strong> <code className="font-mono">{editingEmployee.employee_id}</code>
                    </p>
                    <p className="text-xs text-green-600 mt-1">{t('uniqueEmployeeIdentifier')}</p>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('password')} {!editingEmployee && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder={editingEmployee ? t('leaveBlankToKeepPassword') : t('enterInitialPassword')}
                required={!editingEmployee}
              />
              {editingEmployee && (
                <p className="text-xs text-gray-500 mt-1">{t('leaveBlankToKeepCurrentPassword')}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')} ({t('optional')})</label>
                <select
                  value={formData.role_id || ''}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">{t('selectRole')}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('hireDateOptional')}</label>
                <input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  placeholder={t('dateFormatPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('employmentTypeLabel')}</label>
              <select
                value={formData.employment_type}
                onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="full_time">{t('fullTimeMonthly')}</option>
                <option value="part_time">{t('partTimeHalfMonth')}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('monthlyAttendanceCycle')}
                <br />
                {t('partTimeCycle')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('weeklyHoursLabel')}</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.weekly_hours}
                onChange={(e) => setFormData({ ...formData, weekly_hours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('dailyMaxHoursLabel')}</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.daily_max_hours}
                onChange={(e) => setFormData({ ...formData, daily_max_hours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('shiftsPerWeekLabel')}</label>
              <input
                type="number"
                min="1"
                value={formData.shifts_per_week}
                onChange={(e) => setFormData({ ...formData, shifts_per_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('annualPaidLeaveDays')}</label>
              <input
                type="number"
                min="0"
                value={formData.paid_leave_per_year}
                onChange={(e) => setFormData({ ...formData, paid_leave_per_year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">{t('annualPaidLeaveHelp')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('skillsCommaSeparated')}</label>
              <input
                type="text"
                value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
                onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., machine operation, quality control"
              />
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

const ManagerRoles = ({ user }) => {
  const { t } = useLanguage();
  const [roles, setRoles] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // 'role' or 'shift'
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'role'|'shift', id, name }
  const [selectedRole, setSelectedRole] = useState(null);
  const [editingRole, setEditingRole] = useState(null); // null or role id being edited
  const [editingShift, setEditingShift] = useState(null); // null or shift id being edited
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [archivedError, setArchivedError] = useState('');
  const [showArchivedShifts, setShowArchivedShifts] = useState(false);
  const [archivedShifts, setArchivedShifts] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    priority: 50,
    priority_percentage: 50,
    break_minutes: 60,
    weekend_required: false,
    required_skills: [],
    schedule_config: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    }
  });
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const [shiftForm, setShiftForm] = useState({
    name: '',
    start_time: '09:00',
    end_time: '17:00',
    min_emp: 1,
    max_emp: 5,
    priority: 50,
    schedule_config: {}
  });

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    if (showArchivedShifts && selectedRole?.id) {
      loadArchivedShifts(selectedRole.id);
    } else {
      setArchivedShifts([]);
      setArchivedError('');
    }
  }, [showArchivedShifts, selectedRole]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await listRoles();
      console.log('Loaded roles:', response.data);
      setRoles(response.data);

      // If a role is selected, refresh its details with shifts
      if (selectedRole && selectedRole.id) {
        try {
          const detailRes = await api.get(`/roles/${selectedRole.id}`);
          console.log('Loaded role details:', detailRes.data);
          setSelectedRole(detailRes.data);

          // Also update the role in the list with shifts
          const updatedRoles = response.data.map(role =>
            role.id === selectedRole.id ? detailRes.data : role
          );
          setRoles(updatedRoles);
        } catch (detailError) {
          console.error('Failed to load role details:', detailError);
          // Continue anyway with the basic role data
        }
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedShifts = async (roleId) => {
    if (!roleId) return;
    try {
      setLoadingArchived(true);
      setArchivedError('');
      const response = await listShifts(roleId, true);
      const inactiveShifts = (response.data || []).filter(shift => !shift.is_active);
      setArchivedShifts(inactiveShifts);
    } catch (error) {
      console.error('Failed to load archived shifts:', error);
      setArchivedError(error.response?.data?.detail || 'Failed to load archived shifts');
    } finally {
      setLoadingArchived(false);
    }
  };

  const openEditRole = async (role) => {
    setEditingRole(role.id);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      priority: role.priority || 50,
      priority_percentage: role.priority_percentage || 50,
      break_minutes: role.break_minutes || 60,
      weekend_required: role.weekend_required || false,
      required_skills: role.required_skills || [],
      schedule_config: role.schedule_config || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
      }
    });
    setShowRoleModal(true);
  };

  const openEditShift = async (shift) => {
    setEditingShift(shift.id);
    setShiftForm({
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      min_emp: shift.min_emp || 1,
      max_emp: shift.max_emp || 5,
      priority: shift.priority || 50,
      schedule_config: shift.schedule_config || {}
    });
    setShowShiftModal(true);
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const departmentId = user?.manager_department_id;
      if (editingRole) {
        // Update existing role
        await api.put(`/roles/${editingRole}`, roleForm);
        setEditingRole(null);
      } else {
        // Create new role
        await createRole({
          ...roleForm,
          department_id: departmentId
        });
      }
      setShowRoleModal(false);
      setRoleForm({
        name: '',
        description: '',
        priority: 50,
        priority_percentage: 50,
        break_minutes: 60,
        weekend_required: false,
        required_skills: [],
        schedule_config: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        }
      });
      loadRoles();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save role');
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!shiftForm.name || !shiftForm.name.trim()) {
      setError(t('shiftNameRequired'));
      return;
    }
    if (!shiftForm.start_time || !shiftForm.end_time) {
      setError(t('startTimeEndTimeRequired'));
      return;
    }

    if (!editingShift && (!selectedRole || !selectedRole.id)) {
      setError('Please select a role first');
      return;
    }

    try {
      const shiftData = {
        name: shiftForm.name,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        min_emp: parseInt(shiftForm.min_emp) || 1,
        max_emp: parseInt(shiftForm.max_emp) || 5,
        priority: parseInt(shiftForm.priority) || 50,
        schedule_config: shiftForm.schedule_config || {}
      };

      console.log('Submitting shift:', shiftData, 'Role ID:', selectedRole?.id);

      if (editingShift) {
        // Update existing shift
        console.log('Updating shift:', editingShift);
        await api.put(`/shifts/${editingShift}`, shiftData);
        setEditingShift(null);
      } else {
        // Create new shift
        const createData = {
          ...shiftData,
          role_id: selectedRole.id
        };
        console.log('Creating shift with:', createData);
        const response = await api.post('/shifts', createData);
        console.log('Shift created:', response.data);
      }

      setShowShiftModal(false);
      setShiftForm({
        name: '',
        start_time: '09:00',
        end_time: '17:00',
        min_emp: 1,
        max_emp: 5,
        priority: 50,
        schedule_config: {}
      });

      // Reload roles to show new shift
      await loadRoles();

    } catch (err) {
      console.error('Shift error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to save shift';
      setError(errorMsg);
    }
  };

  const handleDeleteRole = async (roleId) => {
    setError('');
    try {
      await api.delete(`/roles/${roleId}`);
      setShowDeleteConfirm(null);
      setDeleteTarget(null);
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
        setShowArchivedShifts(false);
        setArchivedShifts([]);
        setArchivedError('');
      }
      loadRoles();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete role');
    }
  };

  const handleDeleteShift = async (shiftId, hardDelete = false) => {
    if (hardDelete) {
      setArchivedError('');
    } else {
      setError('');
    }
    try {
      await deleteShift(shiftId, hardDelete);
      setShowDeleteConfirm(null);
      setDeleteTarget(null);
      await loadRoles();
      if (hardDelete && selectedRole?.id) {
        await loadArchivedShifts(selectedRole.id);
      }
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to delete shift';
      if (hardDelete) {
        setArchivedError(message);
      } else {
        setError(message);
      }
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <Header title={t('rolesShiftsManagement')} subtitle={t('configureJobRoles')} />
      <div className="p-6 space-y-6">

        {/* Roles Section */}
        <Card
          title={t('jobRoles')}
          subtitle={`${roles.length} ${t('rolesConfigured')}`}
          headerAction={
            <Button onClick={() => { setSelectedRole(null); setShowRoleModal(true); }}>
              <Plus className="w-4 h-4 mr-2 inline" />
              {t('addRole')}
            </Button>
          }
        >
          <div className="space-y-3">
            {roles.length === 0 ? (
              <p className="text-center text-gray-500 py-4">{t('noRolesCreated')}</p>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  onClick={async () => {
                    setShowArchivedShifts(false);
                    setArchivedShifts([]);
                    setArchivedError('');
                    try {
                      console.log('Loading role details for:', role.id);
                      const res = await api.get(`/roles/${role.id}`);
                      console.log('Role details loaded:', res.data);
                      setSelectedRole(res.data);
                    } catch (err) {
                      console.error('Failed to load role details:', err);
                      setSelectedRole(role);
                    }
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedRole?.id === role.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>Skills: {role.required_skills?.length || 0}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          role.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {role.is_active ? t('active') : t('inactive')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded">
                        {role.shifts?.length || 0} {t('shiftsLabel')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditRole(role);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                        title={t('editRole')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ type: 'role', id: role.id, name: role.name });
                          setShowDeleteConfirm('role');
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                        title={t('deleteRole')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Shifts under this role */}
                  {selectedRole?.id === role.id && (
                    <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">{t('shiftsLabel')} ({role.shifts?.length || 0}):</p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowArchivedShifts(prev => !prev);
                            }}
                            className={`text-xs px-3 py-1 rounded border ${
                              showArchivedShifts ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-600 bg-white'
                            }`}
                          >
                            {showArchivedShifts ? t('hideArchived') : t('viewArchived')}
                          </button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowShiftModal(true);
                            }}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm"
                          >
                            <Plus className="w-3 h-3 mr-1 inline" />
                            {t('addShift')}
                          </Button>
                        </div>
                      </div>

                      {role.shifts && role.shifts.length > 0 ? (
                        <div className="space-y-2">
                          {role.shifts.map((shift) => (
                            <div key={shift.id} className="ml-4 p-3 bg-white rounded border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-800">{shift.name}</p>
                                  <p className="text-sm text-gray-600">{shift.start_time} - {shift.end_time}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {t('capacity')}: {shift.min_emp}-{shift.max_emp} {t('employees')}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {t('priority')}: {shift.priority}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditShift(shift);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                    title={t('editShift')}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget({ type: 'shift', id: shift.id, name: shift.name, hardDelete: false });
                                      setShowDeleteConfirm('shift');
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                                    title={t('deleteShift')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 ml-4 italic">{t('noShiftsYet')}</p>
                      )}

                      {showArchivedShifts && (
                        <div className="mt-4 p-3 border border-dashed border-gray-300 rounded bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">
                              Archived Shifts ({archivedShifts.length})
                            </p>
                            {loadingArchived && <span className="text-xs text-gray-500">Loading...</span>}
                          </div>
                          {archivedError && (
                            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                              {archivedError}
                            </div>
                          )}
                          {!loadingArchived && archivedShifts.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No archived shifts for this role.</p>
                          )}
                          {!loadingArchived && archivedShifts.length > 0 && (
                            <div className="space-y-2">
                              {archivedShifts.map(shift => (
                                <div key={shift.id} className="p-3 bg-white border border-gray-200 rounded flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-800">{shift.name}</p>
                                    <p className="text-sm text-gray-600">{shift.start_time} - {shift.end_time}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t('capacity')}: {shift.min_emp}-{shift.max_emp} {t('employees')}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget({ type: 'shift', id: shift.id, name: shift.name, hardDelete: true });
                                      setShowDeleteConfirm('shift');
                                    }}
                                    className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded border border-red-200"
                                  >
                                    {t('deletePermanently')}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Create/Edit Role Modal */}
        <Modal
          isOpen={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            setEditingRole(null);
            setRoleForm({
              name: '',
              description: '',
              priority: 50,
              priority_percentage: 50,
              break_minutes: 60,
              weekend_required: false,
              required_skills: [],
              schedule_config: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: false,
                sunday: false
              }
            });
          }}
          title={editingRole ? `${t('editRole')}: ${roleForm.name}` : t('createNewJobRole')}
          footer={
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowRoleModal(false);
                setEditingRole(null);
                setRoleForm({
                  name: '',
                  description: '',
                  priority: 50,
                  priority_percentage: 50,
                  break_minutes: 60,
                  weekend_required: false,
                  required_skills: [],
                  schedule_config: {
                    monday: true,
                    tuesday: true,
                    wednesday: true,
                    thursday: true,
                    friday: true,
                    saturday: false,
                    sunday: false
                  }
                });
              }}>
                {t('cancel')}
              </Button>
              <Button type="submit" form="role-form">
                {editingRole ? t('updateRole') : t('createRole')}
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
          <form id="role-form" onSubmit={handleCreateRole} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('roleName')} *</label>
              <input
                type="text"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Engineer, Manager, Assembly Line Worker"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
              <textarea
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows="3"
                placeholder={t('describeJobRole')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('priorityRange')}</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={roleForm.priority}
                  onChange={(e) => setRoleForm({ ...roleForm, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('priorityPercentageRange')}</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={roleForm.priority_percentage}
                  onChange={(e) => setRoleForm({ ...roleForm, priority_percentage: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('breakMinutes')}</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={roleForm.break_minutes}
                  onChange={(e) => setRoleForm({ ...roleForm, break_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleForm.weekend_required}
                    onChange={(e) => setRoleForm({ ...roleForm, weekend_required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">{t('weekendRequired')}</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('requiredSkills')}</label>
              <input
                type="text"
                value={roleForm.required_skills.join(', ')}
                onChange={(e) => setRoleForm({
                  ...roleForm,
                  required_skills: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder={t('exampleSkills')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('operatingDays')}</label>
              <div className="grid grid-cols-4 gap-3">
                {days.map((day) => (
                  <label key={day} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleForm.schedule_config[day] || false}
                      onChange={(e) => setRoleForm({
                        ...roleForm,
                        schedule_config: {
                          ...roleForm.schedule_config,
                          [day]: e.target.checked
                        }
                      })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{t(day)}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </Modal>

        {/* Create/Edit Shift Modal */}
        <Modal
          isOpen={showShiftModal}
          onClose={() => {
            setShowShiftModal(false);
            setEditingShift(null);
            setShiftForm({
              name: '',
              start_time: '09:00',
              end_time: '17:00',
              min_emp: 1,
              max_emp: 5,
              priority: 50,
              schedule_config: {}
            });
          }}
          title={editingShift ? `${t('editShift')}: ${shiftForm.name}` : `${t('createShift')} ${t('for')} ${selectedRole?.name || t('role')}`}
          footer={
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => {
                setShowShiftModal(false);
                setEditingShift(null);
                setShiftForm({
                  name: '',
                  start_time: '09:00',
                  end_time: '17:00',
                  min_emp: 1,
                  max_emp: 5,
                  priority: 50,
                  schedule_config: {}
                });
              }}>
                {t('cancel')}
              </Button>
              <Button type="submit" form="shift-form">
                {editingShift ? t('updateRole') : t('createShift')}
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
          <form id="shift-form" onSubmit={handleCreateShift} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('shiftName')} *</label>
              <input
                type="text"
                value={shiftForm.name}
                onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="e.g., Morning 5AM, Evening 2PM, Night 11PM"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('startTime')} *</label>
                <input
                  type="time"
                  value={shiftForm.start_time}
                  onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('endTime')} *</label>
                <input
                  type="time"
                  value={shiftForm.end_time}
                  onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('minEmployees')}</label>
                <input
                  type="number"
                  value={shiftForm.min_emp}
                  onChange={(e) => setShiftForm({ ...shiftForm, min_emp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxEmployees')}</label>
                <input
                  type="number"
                  value={shiftForm.max_emp}
                  onChange={(e) => setShiftForm({ ...shiftForm, max_emp: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('priority')}</label>
                <input
                  type="number"
                  value={shiftForm.priority}
                  onChange={(e) => setShiftForm({ ...shiftForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(null);
            setDeleteTarget(null);
          }}
          title={t('confirmDelete')}
          footer={
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!deleteTarget) return;
                  if (deleteTarget.type === 'role') {
                    handleDeleteRole(deleteTarget.id);
                  } else if (deleteTarget.type === 'shift') {
                    handleDeleteShift(deleteTarget.id, deleteTarget.hardDelete);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                {t('delete')}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {(deleteTarget?.type === 'shift' && deleteTarget?.hardDelete ? archivedError : error) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">
                  {deleteTarget?.type === 'shift' && deleteTarget?.hardDelete ? archivedError : error}
                </span>
              </div>
            )}
            <p className="text-gray-700">
              {deleteTarget?.type === 'role' 
                ? t('confirmDeleteRoleMessage', { name: deleteTarget?.name })
                : t('confirmDeleteShiftMessage', { name: deleteTarget?.name })}
            </p>
            <p className="text-sm text-gray-600">
              {deleteTarget?.type === 'role'
                ? t('deleteRoleWarning')
                : deleteTarget?.hardDelete
                  ? t('deleteArchivedShiftWarning')
                  : t('deleteShiftWarning')}
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
};
const ManagerSchedules = ({ user }) => {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, rolesRes] = await Promise.all([
        listEmployees(),
        listRoles()
      ]);

      setEmployees(empRes?.data || []);
      setRoles(rolesRes?.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title={t('scheduleManagement')} subtitle={t('scheduleSubtitle')} />
      <div className="p-6">
        <ScheduleManager
          employees={employees}
          roles={roles}
        />
      </div>
    </div>
  );
};

function getWeekDates() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    weekDates.push(format(date, 'yyyy-MM-dd'));
  }
  return weekDates;
}

const ManagerLeaves = () => {
  const { t } = useLanguage();
  const [leaves, setLeaves] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchEmpId, setSearchEmpId] = useState('');
  const [employeeStats, setEmployeeStats] = useState(null);
  const [showEmployeeStats, setShowEmployeeStats] = useState(false);
  const [leaveFilter, setLeaveFilter] = useState('all'); // all, paid, unpaid, comp-off

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const response = await listLeaveRequests();
      setLeaves(response.data);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEmployee = async () => {
    if (!searchEmpId.trim()) {
      alert(t('pleaseEnterEmployeeID'));
      return;
    }
    try {
      const response = await getEmployeeLeaveStatistics(searchEmpId.trim());
      setEmployeeStats(response.data);
      setShowEmployeeStats(true);
    } catch (error) {
      console.error('Failed to load employee leave statistics:', error);
      alert(t('employeeNotFoundOrError'));
    }
  };

  const handleReview = (leave, actionType) => {
    setSelectedLeave(leave);
    setAction(actionType);
    setShowModal(true);
  };

  const handleSubmitReview = async () => {
    try {
      if (action === 'approve') {
        await approveLeave(selectedLeave.id, reviewNotes || undefined);
      } else {
        await rejectLeave(selectedLeave.id, reviewNotes || undefined);
      }
      setShowModal(false);
      setReviewNotes('');
      setSelectedLeave(null);
      loadLeaves();
    } catch (error) {
      alert('Failed to process leave request');
    }
  };

  const downloadAsExcel = (stats) => {
    // Create HTML table format for Excel with better organization
    const html = `
    <table border="1" cellspacing="0" cellpadding="8">
      <!-- ========== HEADER ========== -->
      <tr style="background-color: #1e40af; color: white; font-weight: bold; height: 30px;">
        <td colspan="5" style="font-size: 18px; text-align: center; padding: 15px;">
          EMPLOYEE LEAVE STATISTICS REPORT
        </td>
      </tr>
      
      <!-- Employee Info -->
      <tr style="background-color: #e0e7ff;">
        <td style="font-weight: bold;">Employee Name:</td>
        <td>${stats.employee_name}</td>
        <td style="font-weight: bold;">Employee ID:</td>
        <td colspan="2">${stats.employee_id}</td>
      </tr>
      <tr style="background-color: #e0e7ff;">
        <td style="font-weight: bold;">Report Generated:</td>
        <td colspan="4">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</td>
      </tr>
      
      <!-- Spacing -->
      <tr style="height: 15px;"><td colspan="5"></td></tr>
      
      <!-- ========== OVERALL SUMMARY ========== -->
      <tr style="background-color: #fbbf24; color: #1f2937; font-weight: bold; height: 25px;">
        <td colspan="5" style="font-size: 14px;">OVERALL YEARLY SUMMARY</td>
      </tr>
      
      <tr style="background-color: #fef3c7;">
        <td style="font-weight: bold; width: 25%;">Metric</td>
        <td style="font-weight: bold; text-align: center; width: 18%;">Paid Days</td>
        <td style="font-weight: bold; text-align: center; width: 18%;">Unpaid Days</td>
        <td style="font-weight: bold; text-align: center; width: 18%;">Total Days</td>
        <td style="font-weight: bold; text-align: center; width: 21%;">Usage %</td>
      </tr>
      
      <tr style="background-color: #fffbeb;">
        <td style="font-weight: bold;">Total Taken</td>
        <td style="text-align: center;">${stats.taken_paid_leave}</td>
        <td style="text-align: center;">${stats.taken_unpaid_leave}</td>
        <td style="text-align: center; font-weight: bold;">${stats.total_leaves_taken}</td>
        <td style="text-align: center;">${stats.total_paid_leave > 0 ? Math.round((stats.taken_paid_leave / stats.total_paid_leave) * 100) : 0}%</td>
      </tr>
      
      <tr style="background-color: #fffbeb;">
        <td style="font-weight: bold;">Entitlement</td>
        <td style="text-align: center;">${stats.total_paid_leave}</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: center; font-weight: bold;">-</td>
        <td style="text-align: center;">-</td>
      </tr>
      
      <tr style="background-color: #fffbeb;">
        <td style="font-weight: bold;">Available/Remaining</td>
        <td style="text-align: center;">${stats.available_paid_leave}</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: center; font-weight: bold;">-</td>
        <td style="text-align: center;">-</td>
      </tr>
      
      <!-- Spacing -->
      <tr style="height: 15px;"><td colspan="5"></td></tr>
      
      <!-- ========== MONTHLY BREAKDOWN ========== -->
      <tr style="background-color: #3b82f6; color: white; font-weight: bold; height: 25px;">
        <td colspan="5" style="font-size: 14px;">MONTH-WISE BREAKDOWN</td>
      </tr>
      
      <tr style="background-color: #dbeafe; font-weight: bold;">
        <td style="width: 25%; text-align: center;">Month</td>
        <td style="width: 18%; text-align: center; background-color: #ede9fe;">Paid Days</td>
        <td style="width: 18%; text-align: center; background-color: #fee2e2;">Unpaid Days</td>
        <td style="width: 18%; text-align: center; background-color: #ccfbf1;">Total Days</td>
        <td style="width: 21%; text-align: center;">Daily Avg</td>
      </tr>
      
      ${stats.monthly_breakdown && stats.monthly_breakdown.length > 0
        ? stats.monthly_breakdown
            .map(
              (month, idx) => {
                const daysInMonth = new Date(new Date(month.month + ' 1').getFullYear(), new Date(month.month + ' 1').getMonth() + 1, 0).getDate();
                const dailyAvg = (month.total / daysInMonth).toFixed(2);
                return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="text-align: center; font-weight: 500;">${month.month}</td>
          <td style="text-align: center; background-color: ${idx % 2 === 0 ? '#f3e8ff' : '#faf5ff'};">${month.paid}</td>
          <td style="text-align: center; background-color: ${idx % 2 === 0 ? '#fef2f2' : '#fdf8f8'};">${month.unpaid}</td>
          <td style="text-align: center; background-color: ${idx % 2 === 0 ? '#ccfbf1' : '#e5fdf9'}; font-weight: bold;">${month.total}</td>
          <td style="text-align: center;">${dailyAvg} days/day</td>
        </tr>
                `;
              }
            )
            .join('')
        : '<tr><td colspan="5" style="text-align: center; padding: 20px;">No monthly data available</td></tr>'
      }
      
      <!-- Monthly Summary Row -->
      <tr style="background-color: #e5e7eb; font-weight: bold; height: 25px;">
        <td style="text-align: center;">TOTAL</td>
        <td style="text-align: center; background-color: #ede9fe;">
          ${stats.monthly_breakdown && stats.monthly_breakdown.length > 0
            ? stats.monthly_breakdown.reduce((sum, month) => sum + month.paid, 0)
            : stats.taken_paid_leave
          }
        </td>
        <td style="text-align: center; background-color: #fee2e2;">
          ${stats.monthly_breakdown && stats.monthly_breakdown.length > 0
            ? stats.monthly_breakdown.reduce((sum, month) => sum + month.unpaid, 0)
            : stats.taken_unpaid_leave
          }
        </td>
        <td style="text-align: center; background-color: #ccfbf1;">
          ${stats.total_leaves_taken}
        </td>
        <td style="text-align: center;">
          ${stats.monthly_breakdown && stats.monthly_breakdown.length > 0
            ? (stats.total_leaves_taken / stats.monthly_breakdown.length).toFixed(2)
            : stats.total_leaves_taken
          } days/month
        </td>
      </tr>
      
      <!-- Spacing -->
      <tr style="height: 15px;"><td colspan="5"></td></tr>
      
      <!-- ========== DETAILED BREAKUP ========== -->
      <tr style="background-color: #10b981; color: white; font-weight: bold; height: 25px;">
        <td colspan="5" style="font-size: 14px;">DETAILED STATISTICS</td>
      </tr>
      
      <tr style="background-color: #d1fae5;">
        <td style="font-weight: bold; width: 40%;">Category</td>
        <td colspan="4" style="font-weight: bold; text-align: center;">Value</td>
      </tr>
      
      <tr style="background-color: #f0fdf4;">
        <td style="font-weight: bold;">Total Paid Leave Entitlement (Annual)</td>
        <td colspan="4" style="text-align: center;">${stats.total_paid_leave} days</td>
      </tr>
      
      <tr style="background-color: #f0fdf4;">
        <td style="font-weight: bold;">Paid Leave Taken</td>
        <td colspan="4" style="text-align: center;">${stats.taken_paid_leave} days</td>
      </tr>
      
      <tr style="background-color: #f0fdf4;">
        <td style="font-weight: bold;">Paid Leave Available/Remaining</td>
        <td colspan="4" style="text-align: center;">${stats.available_paid_leave} days</td>
      </tr>
      
      <tr style="background-color: #f0fdf4;">
        <td style="font-weight: bold;">Unpaid Leave Taken</td>
        <td colspan="4" style="text-align: center;">${stats.taken_unpaid_leave} days</td>
      </tr>
      
      <tr style="background-color: #f0fdf4;">
        <td style="font-weight: bold;">Paid Leave Usage Percentage</td>
        <td colspan="4" style="text-align: center;">${stats.total_paid_leave > 0 ? Math.round((stats.taken_paid_leave / stats.total_paid_leave) * 100) : 0}%</td>
      </tr>
      
      <tr style="background-color: #f0fdf4;">
        <td style="font-weight: bold;">Average Days per Month</td>
        <td colspan="4" style="text-align: center;">
          ${stats.monthly_breakdown && stats.monthly_breakdown.length > 0
            ? (stats.total_leaves_taken / stats.monthly_breakdown.length).toFixed(2)
            : 0
          } days
        </td>
      </tr>

      <!-- Spacing -->
      <tr style="height: 15px;"><td colspan="5"></td></tr>

      <!-- ========== COMP-OFF SUMMARY ========== -->
      <tr style="background-color: #0891b2; color: white; font-weight: bold; height: 25px;">
        <td colspan="5" style="font-size: 14px;">COMP-OFF SUMMARY</td>
      </tr>

      <tr style="background-color: #cffafe;">
        <td style="font-weight: bold; width: 40%;">Metric</td>
        <td colspan="4" style="font-weight: bold; text-align: center;">Value</td>
      </tr>

      <tr style="background-color: #ecfeff;">
        <td style="font-weight: bold;">Comp-Off Earned</td>
        <td colspan="4" style="text-align: center;">${stats.comp_off_earned || 0} days</td>
      </tr>

      <tr style="background-color: #ecfeff;">
        <td style="font-weight: bold;">Comp-Off Used</td>
        <td colspan="4" style="text-align: center;">${stats.comp_off_used || 0} days</td>
      </tr>

      <tr style="background-color: #ecfeff;">
        <td style="font-weight: bold;">Comp-Off Available</td>
        <td colspan="4" style="text-align: center; font-weight: bold;">${stats.comp_off_available || 0} days</td>
      </tr>

      <tr style="background-color: #ecfeff;">
        <td style="font-weight: bold;">Comp-Off Usage Percentage</td>
        <td colspan="4" style="text-align: center;">
          ${stats.comp_off_earned > 0 ? Math.round((stats.comp_off_used / stats.comp_off_earned) * 100) : 0}%
        </td>
      </tr>

      <!-- Spacing -->
      <tr style="height: 15px;"><td colspan="5"></td></tr>

      <!-- ========== COMP-OFF MONTHLY BREAKDOWN ========== -->
      ${stats.comp_off_monthly_breakdown && stats.comp_off_monthly_breakdown.length > 0 ? `
      <tr style="background-color: #0891b2; color: white; font-weight: bold; height: 25px;">
        <td colspan="5" style="font-size: 14px;">COMP-OFF MONTH-WISE BREAKDOWN</td>
      </tr>

      <tr style="background-color: #cffafe; font-weight: bold;">
        <td style="text-align: center;">Month</td>
        <td style="text-align: center; background-color: #a5f3fc;">Earned</td>
        <td style="text-align: center; background-color: #fed7aa;">Used</td>
        <td style="text-align: center; background-color: #e5e7eb;">Expired</td>
        <td style="text-align: center; background-color: #a7f3d0;">Available</td>
      </tr>

      ${stats.comp_off_monthly_breakdown
        .map((month, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="text-align: center; font-weight: 500;">${month.month}</td>
          <td style="text-align: center; background-color: ${idx % 2 === 0 ? '#cffafe' : '#ecfeff'};">${month.earned}</td>
          <td style="text-align: center; background-color: ${idx % 2 === 0 ? '#ffedd5' : '#fed7aa'};">${month.used}</td>
          <td style="text-align: center; background-color: ${idx % 2 === 0 ? '#f3f4f6' : '#e5e7eb'};">${month.expired}</td>
          <td style="text-align: center; background-color: ${idx % 2 === 0 ? '#d1fae5' : '#a7f3d0'}; font-weight: bold;">${month.available}</td>
        </tr>
        `)
        .join('')}

      <!-- Spacing -->
      <tr style="height: 15px;"><td colspan="5"></td></tr>
      ` : ''}

      <!-- ========== COMP-OFF TRANSACTIONS ========== -->
      ${stats.comp_off_details && stats.comp_off_details.length > 0 ? `
      <tr style="background-color: #0891b2; color: white; font-weight: bold; height: 25px;">
        <td colspan="5" style="font-size: 14px;">RECENT COMP-OFF TRANSACTIONS (LAST 10)</td>
      </tr>

      <tr style="background-color: #cffafe; font-weight: bold;">
        <td style="text-align: center;">Date</td>
        <td style="text-align: center;">Type</td>
        <td style="text-align: center;">Month</td>
        <td colspan="2" style="text-align: center;">Notes</td>
      </tr>

      ${stats.comp_off_details
        .map((detail, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="text-align: center;">${new Date(detail.date).toLocaleDateString()}</td>
          <td style="text-align: center; font-weight: 500; ${detail.type === 'earned' ? 'background-color: #cffafe;' : detail.type === 'used' ? 'background-color: #fed7aa;' : 'background-color: #e5e7eb;'}">
            ${detail.type.toUpperCase()}
          </td>
          <td style="text-align: center;">${detail.month || '-'}</td>
          <td colspan="2" style="padding: 5px;">${detail.notes || '-'}</td>
        </tr>
        `)
        .join('')}
      ` : ''}

    </table>
    `;

    // Create blob with HTML content
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${stats.employee_name}_leave_compoff_report_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      pending: t('pending'),
      approved: t('approved'),
      rejected: t('rejected')
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const columns = [
    {
      header: t('employee') || 'Employee',
      render: (row) => {
        if (row.employee) {
          return `${row.employee.first_name} ${row.employee.last_name} (${row.employee.employee_id})`;
        }
        return `Employee #${row.employee_id}`;
      }
    },
    {
      header: t('leaveType'),
      render: (row) => {
        let durationLabel = t('fullDay');
        if (row.duration_type === 'half_day_morning') {
          durationLabel = t('halfDayMorning');
        } else if (row.duration_type === 'half_day_afternoon') {
          durationLabel = t('halfDayAfternoon');
        }

        const isCompOffUsage = row.leave_type === 'comp_off';
        const typeLabel = row.leave_type === 'comp_off' ? t('compOffUsage') :
                         (row.leave_type.charAt(0).toUpperCase() + row.leave_type.slice(1));

        return (
          <div className="flex items-center gap-2">
            <span>{typeLabel} - {durationLabel}</span>
            {isCompOffUsage && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded">
                USES EARNED
              </span>
            )}
          </div>
        );
      }
    },
    { header: t('startDate') || 'Start Date', render: (row) => format(new Date(row.start_date), 'MMM dd, yyyy') },
    { header: t('endDate') || 'End Date', render: (row) => format(new Date(row.end_date), 'MMM dd, yyyy') },
    { header: t('reason') || 'Reason', accessor: 'reason' },
    { header: t('status') || 'Status', render: (row) => getStatusBadge(row.status) },
    {
      header: t('actions'),
      render: (row) => (
        row.status === 'pending' ? (
          <div className="flex space-x-2">
            <button
              onClick={() => handleReview(row, 'approve')}
              className="text-green-600 hover:text-green-800"
              title={t('approve')}
            >
              <CheckCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleReview(row, 'reject')}
              className="text-red-600 hover:text-red-800"
              title={t('reject')}
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">{t('reviewed')}</span>
        )
      )
    }
  ];

  if (loading) return <div className="p-6">Loading...</div>;

  // Apply filter
  const filteredLeaves = leaveFilter === 'all'
    ? leaves
    : leaves.filter(leave => leave.leave_type === leaveFilter);

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const paidCount = leaves.filter(l => l.leave_type === 'paid').length;
  const unpaidCount = leaves.filter(l => l.leave_type === 'unpaid').length;
  const compOffCount = leaves.filter(l => l.leave_type === 'comp_off').length;

  return (
    <div>
      <Header title={t('leaveManagement')} subtitle={t('reviewAndManageLeaveRequests')} />
      <div className="p-6">
        {/* Employee Search Section */}
        <Card title={t('searchEmployeeLeaveDetails')} className="mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={t('enterEmployeeId')}
              value={searchEmpId}
              onChange={(e) => setSearchEmpId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchEmployee()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <Button onClick={handleSearchEmployee}>{t('search')}</Button>
          </div>
        </Card>

        {/* Employee Quick Summary */}
        {showEmployeeStats && employeeStats && (
          <div className="mb-6">
            <Card className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{employeeStats.employee_name}</h3>
                  <p className="text-sm text-gray-600">{t('employeeId')}: {employeeStats.employee_id}</p>
                </div>
                <Button onClick={() => setShowEmployeeStats(true)}>{t('viewFullDetails')}</Button>
              </div>
            </Card>

            {/* Quick Stats Cards - Leave */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">📅 {t('leaveSummary')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">{t('totalPaidLeave')}</p>
                  <p className="text-2xl font-bold text-purple-600">{employeeStats.total_paid_leave}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-xs text-gray-600 mb-1">{t('takenPaid')}</p>
                  <p className="text-2xl font-bold text-orange-600">{employeeStats.taken_paid_leave}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">{t('availablePaid')}</p>
                  <p className="text-2xl font-bold text-green-600">{employeeStats.available_paid_leave}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-gray-600 mb-1">{t('takenUnpaid')}</p>
                  <p className="text-2xl font-bold text-red-600">{employeeStats.taken_unpaid_leave}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards - Comp-Off */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">⏰ {t('compOffSummary')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200 border-l-4">
                  <p className="text-xs text-gray-600 mb-1">{t('compOffEarned')}</p>
                  <p className="text-2xl font-bold text-cyan-600">{employeeStats.comp_off_earned || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('totalDaysEarned')}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 border-l-4">
                  <p className="text-xs text-gray-600 mb-1">{t('compOffUsed')}</p>
                  <p className="text-2xl font-bold text-amber-600">{employeeStats.comp_off_used || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('daysTaken')}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 border-l-4">
                  <p className="text-xs text-gray-600 mb-1">{t('compOffAvailable')}</p>
                  <p className="text-2xl font-bold text-emerald-600">{employeeStats.comp_off_available || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('daysRemaining')}</p>
                </div>
              </div>
            </div>

            {/* Detailed Modal for Full View */}
            {showEmployeeStats && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
                <div className="bg-white rounded-lg max-w-5xl w-full shadow-2xl">
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 flex justify-between items-center rounded-t-lg">
                    <div>
                      <h2 className="text-2xl font-bold">{employeeStats.employee_name}</h2>
                      <p className="text-sm text-blue-100">{t('employeeId')}: {employeeStats.employee_id}</p>
                      <p className="text-xs text-blue-200 mt-1">{t('generatedOn')} {new Date().toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => setShowEmployeeStats(false)}
                      className="text-3xl font-bold hover:text-blue-200 transition"
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Content - Scrollable */}
                  <div className="p-6 max-h-96 overflow-y-auto">
                    {/* Paid Leave Statistics - Detailed */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-500">
                        📋 {t('paidLeaveStatistics')}
                      </h3>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">{t('totalAnnualEntitlement')}</p>
                          <p className="text-4xl font-bold text-purple-600">{employeeStats.total_paid_leave}</p>
                          <p className="text-xs text-gray-500 mt-1">{t('daysPerYear')}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">{t('daysTaken')}</p>
                          <p className="text-4xl font-bold text-orange-600">{employeeStats.taken_paid_leave}</p>
                          <p className="text-xs text-gray-500 mt-1">{t('daysUtilized')}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">{t('daysAvailable')}</p>
                          <p className="text-4xl font-bold text-green-600">{employeeStats.available_paid_leave}</p>
                          <p className="text-xs text-gray-500 mt-1">{t('daysRemaining')}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-gray-700">{t('usageProgress')}</p>
                          <p className="text-sm font-bold text-purple-600">
                            {employeeStats.total_paid_leave > 0
                              ? Math.round((employeeStats.taken_paid_leave / employeeStats.total_paid_leave) * 100)
                              : 0}%
                          </p>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-3">
                          <div
                            className="bg-purple-600 h-3 rounded-full transition-all"
                            style={{
                              width: `${employeeStats.total_paid_leave > 0
                                ? Math.min((employeeStats.taken_paid_leave / employeeStats.total_paid_leave) * 100, 100)
                                : 0}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          {employeeStats.taken_paid_leave} / {employeeStats.total_paid_leave} {t('daysUsed')}
                        </p>
                      </div>
                    </div>

                    {/* Unpaid Leave Statistics - Detailed */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-red-500">
                        📌 {t('unpaidLeaveStatistics')}
                      </h3>
                      <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                        <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">{t('totalUnpaidDaysTaken')}</p>
                        <p className="text-4xl font-bold text-red-600">{employeeStats.taken_unpaid_leave}</p>
                        <p className="text-xs text-gray-500 mt-2">{t('includesAllApprovedUnpaidLeave')}</p>
                      </div>
                    </div>

                    {/* Comp-Off Statistics - Detailed */}
                    <div className="mb-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-500">
                        ⏰ {t('compOffStatistics')}
                      </h3>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-cyan-50 rounded-lg border-l-4 border-cyan-500">
                          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">{t('compOffEarned')}</p>
                          <p className="text-4xl font-bold text-cyan-600">{employeeStats.comp_off_earned || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">{t('totalDaysEarned')}</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">{t('compOffUsed')}</p>
                          <p className="text-4xl font-bold text-amber-600">{employeeStats.comp_off_used || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">{t('daysUtilized')}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                          <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">{t('compOffAvailable')}</p>
                          <p className="text-4xl font-bold text-emerald-600">{employeeStats.comp_off_available || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">{t('daysRemaining')}</p>
                        </div>
                      </div>

                      {/* Comp-Off Progress Bar */}
                      {employeeStats.comp_off_earned > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-semibold text-gray-700">{t('usageProgress')}</p>
                            <p className="text-sm font-bold text-cyan-600">
                              {employeeStats.comp_off_earned > 0
                                ? Math.round((employeeStats.comp_off_used / employeeStats.comp_off_earned) * 100)
                                : 0}%
                            </p>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-3">
                            <div
                              className="bg-cyan-600 h-3 rounded-full transition-all"
                              style={{
                                width: `${employeeStats.comp_off_earned > 0
                                  ? Math.min((employeeStats.comp_off_used / employeeStats.comp_off_earned) * 100, 100)
                                  : 0}%`
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">
                            {employeeStats.comp_off_used} / {employeeStats.comp_off_earned} {t('daysUsed')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Monthly Breakdown - Leave */}
                    {employeeStats.monthly_breakdown && employeeStats.monthly_breakdown.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
                          📅 {t('monthlyBreakdown')}
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-300">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('month')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-purple-700 bg-purple-50">{t('paidDays')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-red-700 bg-red-50">{t('unpaidDays')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-blue-700 bg-blue-50">{t('totalDays')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {employeeStats.monthly_breakdown.map((month, idx) => (
                                <tr
                                  key={idx}
                                  className="border-b border-gray-200 hover:bg-blue-50 transition"
                                >
                                  <td className="px-4 py-3 text-gray-900 font-medium">{month.month}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold text-sm">
                                      {month.paid}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-3 py-1 rounded-full font-semibold text-sm ${month.unpaid > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {month.unpaid}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">
                                      {month.total}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Monthly Breakdown - Comp-Off */}
                    {employeeStats.comp_off_monthly_breakdown && employeeStats.comp_off_monthly_breakdown.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-500">
                          ⏰ {t('compOffMonthlyBreakdown')}
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-300">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('month')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-cyan-700 bg-cyan-50">{t('earned')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-amber-700 bg-amber-50">{t('used')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-700 bg-gray-50">{t('expired')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-emerald-700 bg-emerald-50">{t('available')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {employeeStats.comp_off_monthly_breakdown.map((month, idx) => (
                                <tr key={idx} className="border-b border-gray-200 hover:bg-cyan-50 transition">
                                  <td className="px-4 py-3 text-gray-900 font-medium">{month.month}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full font-semibold text-sm">
                                      {month.earned}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold text-sm">
                                      {month.used}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-3 py-1 rounded-full font-semibold text-sm ${month.expired > 0 ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'}`}>
                                      {month.expired}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm">
                                      {month.available}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Recent Comp-Off Transactions */}
                    {employeeStats.comp_off_details && employeeStats.comp_off_details.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-cyan-500">
                          ⏰ {t('recentCompOffTransactions')} {t('last10Transactions')}
                        </h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-300">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300">
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('date')}</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-700">{t('type')}</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('month')}</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-700">{t('notes')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {employeeStats.comp_off_details.map((detail, idx) => {
                                // Translate notes dynamically
                                let translatedNotes = detail.notes || '-';
                                if (translatedNotes !== '-') {
                                  translatedNotes = translatedNotes
                                    .replace(/Earned by working on/g, t('earnedByWorkingOn'))
                                    .replace(/Used on/g, t('usedOn'));
                                }
                                
                                return (
                                  <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 text-gray-900">{new Date(detail.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`px-3 py-1 rounded-full font-semibold text-sm ${
                                        detail.type === 'earned' ? 'bg-cyan-100 text-cyan-700' :
                                        detail.type === 'used' ? 'bg-amber-100 text-amber-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {t(detail.type)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{detail.month || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600 text-xs">{translatedNotes}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Year Summary - Enhanced */}
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-500">
                        📊 {t('annualSummary')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-xs text-gray-600 uppercase tracking-wide">{t('paidDaysYear')}</p>
                          <p className="text-2xl font-bold text-purple-600 mt-2">{employeeStats.taken_paid_leave}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs text-gray-600 uppercase tracking-wide">{t('unpaidDaysYear')}</p>
                          <p className="text-2xl font-bold text-red-600 mt-2">{employeeStats.taken_unpaid_leave}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-gray-600 uppercase tracking-wide">{t('totalDaysYear')}</p>
                          <p className="text-2xl font-bold text-blue-600 mt-2">{employeeStats.total_leaves_taken}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-gray-600 uppercase tracking-wide">{t('usageRate')}</p>
                          <p className="text-2xl font-bold text-green-600 mt-2">
                            {employeeStats.total_paid_leave > 0
                              ? Math.round((employeeStats.taken_paid_leave / employeeStats.total_paid_leave) * 100)
                              : 0}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-indigo-500">
                      <h4 className="font-semibold text-gray-900 mb-3">{t('keyMetrics')}</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('monthlyAveragePaid')}</span>
                          <span className="font-bold text-gray-900">
                            {employeeStats.monthly_breakdown && employeeStats.monthly_breakdown.length > 0
                              ? (employeeStats.taken_paid_leave / employeeStats.monthly_breakdown.length).toFixed(2)
                              : 0} {t('days')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('daysPerMonthEntitlement')}</span>
                          <span className="font-bold text-gray-900">
                            {(employeeStats.total_paid_leave / 12).toFixed(2)} {t('days')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download and Close Buttons - Sticky Bottom */}
                  <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <Button
                      onClick={() => downloadAsExcel(employeeStats)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2"
                    >
                      📥 {t('downloadAsExcel')}
                    </Button>
                    <Button
                      onClick={() => setShowEmployeeStats(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2"
                    >
                      {t('close')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('pendingLabel')}</p>
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
                  <p className="text-sm text-gray-500 mb-1">{t('approvedLabel')}</p>
                  <p className="text-3xl font-bold text-green-600">
                    {leaves.filter(l => l.status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('rejectedLabel')}</p>
                  <p className="text-3xl font-bold text-red-600">
                    {leaves.filter(l => l.status === 'rejected').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <button
            onClick={() => setLeaveFilter('all')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              leaveFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('allRequests')} ({leaves.length})
          </button>
          <button
            onClick={() => setLeaveFilter('paid')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              leaveFilter === 'paid'
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('paidLeave')} ({paidCount})
          </button>
          <button
            onClick={() => setLeaveFilter('unpaid')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              leaveFilter === 'unpaid'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('unpaidLeave')} ({unpaidCount})
          </button>
          <button
            onClick={() => setLeaveFilter('comp_off')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              leaveFilter === 'comp_off'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('compOffUsage')} ({compOffCount})
          </button>
        </div>

        <Card
          title={
            leaveFilter === 'all' ? t('allRequests') :
            leaveFilter === 'paid' ? t('paidLeave') :
            leaveFilter === 'unpaid' ? t('unpaidLeave') :
            t('compOffUsage')
          }
          subtitle={`${filteredLeaves.length} ${leaveFilter === 'all' ? t('total') : leaveFilter === 'comp_off' ? t('compOffUsage').toLowerCase() : t(leaveFilter)} ${t('total').toLowerCase()}`}
        >
          <Table columns={columns} data={filteredLeaves} emptyMessage={t('noDataAvailable')} />
        </Card>
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`${action === 'approve' ? t('approveLeavRequest') : t('rejectLeavRequest')} ${selectedLeave?.leave_type === 'comp_off' ? t('compOffUsage') : t('leaveType')} ${t('total')}`}
          footer={
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button
                variant={action === 'approve' ? 'success' : 'danger'}
                onClick={handleSubmitReview}
              >
                {action === 'approve' ? t('approveLeavRequest') : t('rejectLeavRequest')}
              </Button>
            </div>
          }
        >
          {selectedLeave && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">{t('employee')}</p>
                <p className="font-medium">
                  {selectedLeave.employee
                    ? `${selectedLeave.employee.first_name} ${selectedLeave.employee.last_name} (${selectedLeave.employee.employee_id})`
                    : `Employee #${selectedLeave.employee_id}`}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('leaveType')}</p>
                <p className="font-medium">
                  {selectedLeave.leave_type === 'comp_off' ? t('compOffUsage') :
                   (selectedLeave.leave_type.charAt(0).toUpperCase() + selectedLeave.leave_type.slice(1))}
                  {selectedLeave.duration_type && (
                    <span className="ml-2">
                      ({selectedLeave.duration_type === 'half_day_morning'
                        ? t('halfDayMorning')
                        : selectedLeave.duration_type === 'half_day_afternoon'
                        ? t('halfDayAfternoon')
                        : t('fullDay')})
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('leavePeriod')}</p>
                <p className="font-medium">
                  {format(new Date(selectedLeave.start_date), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(selectedLeave.end_date), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('reason')}</p>
                <p className="font-medium">{selectedLeave.reason}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('reviewNotes')} ({t('optional')})
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  rows="3"
                  placeholder={t('addNotesAboutDecision')}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

const ManagerAttendance = ({ user }) => {
  const { t, language } = useLanguage();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const [stats, setStats] = useState({ present: 0, late: 0, absent: 0 });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [empDownloadMonth, setEmpDownloadMonth] = useState(new Date().getMonth() + 1);
  const [empDownloadYear, setEmpDownloadYear] = useState(new Date().getFullYear());
  const [empDownloading, setEmpDownloading] = useState(false);
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
  const [managerDepartmentId, setManagerDepartmentId] = useState(null);

  useEffect(() => {
    loadAttendance();
    loadManagerDepartment();
    // load roles so we can resolve role names when schedule.role object is not included
    (async () => {
      try {
        const res = await listRoles();
        setRoles(res.data || []);
      } catch (err) {
        console.error('Failed to load roles for attendance view:', err);
      }
    })();
  }, []);

  const loadManagerDepartment = async () => {
    try {
      // Get the current manager's department
      const response = await api.get('/managers/me');
      if (response.data && response.data.department_id) {
        setManagerDepartmentId(response.data.department_id);
      }
    } catch (err) {
      console.error('Failed to load manager department:', err);
    }
  };

  const loadAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await getAttendance(today, today);
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

  const downloadMonthlyReport = async (employmentType = '') => {
    try {
      if (!managerDepartmentId) {
        alert('Loading manager information... Please wait and try again.');
        return;
      }
      const params = new URLSearchParams({
        department_id: managerDepartmentId,
        year: selectedYear,
        month: selectedMonth,
        language: language
      });
      if (employmentType) {
        params.append('employment_type', employmentType);
      }
      
      const response = await api.get(`/attendance/export/monthly?${params.toString()}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const typeLabel = employmentType ? `_${employmentType}` : '';
      link.setAttribute('download', `attendance_${selectedYear}-${String(selectedMonth).padStart(2, '0')}${typeLabel}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download monthly report', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      alert(`Download failed: ${errorMsg}`);
    }
  };

  const downloadWeeklyReport = async (employmentType = '') => {
    try {
      if (!managerDepartmentId) {
        alert('Loading manager information... Please wait and try again.');
        return;
      }
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const params = new URLSearchParams({
        department_id: managerDepartmentId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        language: language
      });
      if (employmentType) {
        params.append('employment_type', employmentType);
      }
      
      const response = await api.get(`/attendance/export/weekly?${params.toString()}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const typeLabel = employmentType ? `_${employmentType}` : '';
      link.setAttribute('download', `attendance_weekly_${startDate.toISOString().split('T')[0]}${typeLabel}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download weekly report', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Unknown error';
      alert(`Download failed: ${errorMsg}`);
    }
  };

  const downloadEmployeeMonthly = async () => {
    if (!employeeIdInput) {
      alert(t('pleaseEnterEmployeeID'));
      return;
    }

    try {
      setEmpDownloading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/attendance/export/employee-monthly?year=${empDownloadYear}&month=${empDownloadMonth}&employee_id=${employeeIdInput}&language=${language}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employee_${employeeIdInput}_attendance_${empDownloadYear}-${String(empDownloadMonth).padStart(2, '0')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert(t('failedDownloadReport'));
    } finally {
      setEmpDownloading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <Header title={t('attendance')} subtitle={t('trackDailyEmployeeAttendance')} />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('present')}</p>
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
                  <p className="text-sm text-gray-500 mb-1">{t('late')}</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </Card>
          <Card padding={false}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('absent')}</p>
                  <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </Card>
        </div>
        <Card title={`${t('todaysAttendance')} - ${t(dayKeys[new Date().getDay()])}, ${t(monthKeys[new Date().getMonth()])} ${new Date().getDate()}, ${new Date().getFullYear()}`}>
          {/* Month Selector and Download Buttons */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectMonthYear')}</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                    return (
                      <option key={m} value={m}>
                        {t(monthKeys[m - 1])}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('year')}</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    setSelectedEmploymentType('');
                    setShowMonthlyModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                >
                  {t('downloadMonthly')}
                </button>
              </div>

              <div className="flex items-end gap-2">
                <button
                  onClick={() => {
                    setSelectedEmploymentType('');
                    setShowWeeklyModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                >
                  {t('downloadWeekly')}
                </button>
              </div>
            </div>
          </div>

          {/* Employee Monthly Report Download Section */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">📄 {t('downloadIndividualReport')}</h3>
            <p className="text-xs text-gray-600 mb-3">{t('attendanceReportIncludes')}</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('employeeId')}</label>
                <input
                  type="text"
                  placeholder={t('exampleEmployeeId')}
                  value={employeeIdInput}
                  onChange={(e) => setEmployeeIdInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('month')}</label>
                <select
                  value={empDownloadMonth}
                  onChange={(e) => setEmpDownloadMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                    return (
                      <option key={m} value={m}>
                        {t(monthKeys[m - 1])}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('year')}</label>
                <select
                  value={empDownloadYear}
                  onChange={(e) => setEmpDownloadYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={downloadEmployeeMonthly}
                  disabled={empDownloading}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                >
                  {empDownloading ? `⏳ ${t('downloading')}` : `📥 ${t('downloadButton')}`}
                </button>
              </div>
            </div>
          </div>

          {attendance.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('noScheduledShifts')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('employee')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('role')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('assignedShiftTime')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('totalHrsAssigned')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('checkInHeader')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('checkOutHeader')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('totalHrsWorkedHeader')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('breakTimeHeader')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('overtimeHoursHeader')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => {
                    // Calculate total assigned hours
                    const calculateTotalAssignedHours = () => {
                      if (!record.schedule?.start_time || !record.schedule?.end_time) return '-';
                      const [startH, startM] = record.schedule.start_time.split(':').map(Number);
                      const [endH, endM] = record.schedule.end_time.split(':').map(Number);
                      const start = startH + startM / 60;
                      const end = endH + endM / 60;
                      const hours = end > start ? end - start : 24 - start + end;
                      return hours.toFixed(2);
                    };

                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {record.employee?.first_name} {record.employee?.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.schedule?.role?.name || (record.schedule?.role_id ? (roles.find(r => r.id == record.schedule.role_id)?.name || 'N/A') : 'N/A')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.schedule ? `${record.schedule.start_time} - ${record.schedule.end_time}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {calculateTotalAssignedHours()} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.in_time ? record.in_time : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.out_time ? record.out_time : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {record.worked_hours !== null && record.worked_hours !== undefined ? record.worked_hours.toFixed(2) : '-'} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.break_minutes} min
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                          {record.overtime_hours ? record.overtime_hours.toFixed(2) : '-'} hrs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.status === 'onTime' ? 'bg-green-100 text-green-800' :
                            record.status === 'slightlyLate' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'late' ? 'bg-orange-100 text-orange-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {record.status === 'onTime' ? t('onTime') :
                             record.status === 'slightlyLate' ? t('slightlyLate') :
                             record.status === 'late' ? t('late') :
                             record.status ? record.status : t('scheduled')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Monthly Export Modal */}
        <Modal 
          isOpen={showMonthlyModal} 
          onClose={() => setShowMonthlyModal(false)}
          title={t('downloadMonthlyReport')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectEmployeeType')}</label>
              <select
                value={selectedEmploymentType}
                onChange={(e) => setSelectedEmploymentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('allEmployees')}</option>
                <option value="full_time">{t('fullTimeOnly')}</option>
                <option value="part_time">{t('partTimeOnly')}</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowMonthlyModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  downloadMonthlyReport(selectedEmploymentType);
                  setShowMonthlyModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {t('downloadButton')}
              </button>
            </div>
          </div>
        </Modal>

        {/* Weekly Export Modal */}
        <Modal 
          isOpen={showWeeklyModal} 
          onClose={() => setShowWeeklyModal(false)}
          title={t('downloadWeeklyReport')}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectEmployeeType')}</label>
              <select
                value={selectedEmploymentType}
                onChange={(e) => setSelectedEmploymentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('allEmployees')}</option>
                <option value="full_time">{t('fullTimeOnly')}</option>
                <option value="part_time">{t('partTimeOnly')}</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowWeeklyModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  downloadWeeklyReport(selectedEmploymentType);
                  setShowWeeklyModal(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                {t('downloadButton')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

const ManagerMessages = ({ user }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    recipient_id: '',
    subject: '',
    message: '',
    sendToAll: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [messagesRes, employeesRes] = await Promise.all([
        getMessages(),
        listEmployees()
      ]);
      setMessages(messagesRes.data);
      setEmployees(employeesRes.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const recipientId = formData.sendToAll ? null : (formData.recipient_id ? parseInt(formData.recipient_id) : null);
      if (!formData.sendToAll && !recipientId) {
        setError(t('selectEmployeeOrSendAll'));
        return;
      }
      await sendMessage({
        recipient_id: recipientId,
        department_id: formData.sendToAll ? user.manager_department_id : null,
        subject: formData.subject,
        message: formData.message
      });
      setShowModal(false);
      setFormData({
        recipient_id: '',
        subject: '',
        message: '',
        sendToAll: false
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || t('failedSendMessage'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDeleteMessage'))) {
      try {
        await deleteMessage(id);
        loadData();
      } catch (error) {
        alert(t('failedDeleteMessage'));
      }
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.user_id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : `Employee #${employeeId}`;
  };

  const getFilteredMessages = () => {
    if (filter === 'sent') {
      return messages.filter(msg => msg.sender_id === user.id);
    } else if (filter === 'received') {
      return messages.filter(msg => msg.recipient_id === user.id || msg.department_id === user.manager_department_id);
    }
    return messages;
  };

  const filteredMessages = getFilteredMessages();

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <Header title={t('messages')} subtitle={t('communicateWithYourTeam')} />
      <div className="p-6">
        <Card
          title={t('messages')}
          subtitle={`${filteredMessages.length} ${t('of')} ${messages.length} ${t('messages')}`}
          headerAction={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2 inline" />
              {t('newMessage')}
            </Button>
          }
        >
          <div className="flex space-x-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('all')} ({messages.length})
            </button>
            <button
              onClick={() => setFilter('sent')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                filter === 'sent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('sent')} ({messages.filter(m => m.sender_id === user.id).length})
            </button>
            <button
              onClick={() => setFilter('received')}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                filter === 'received'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('received')} ({messages.filter(m => m.recipient_id === user.id || m.department_id === user.manager_department_id).length})
            </button>
          </div>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">{t('noMessagesYet')}</p>
              <p className="text-sm text-gray-400 mt-2">{t('sendYourFirstMessage')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((msg) => {
                const isSent = msg.sender_id === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                      isSent
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            isSent ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'
                          }`}>
                            {isSent ? t('sent') : t('received')}
                          </span>
                          {!msg.is_read && !isSent && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-200 text-yellow-800">
                              {t('unread')}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900">{msg.subject}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {isSent ? (
                            msg.recipient_id ? (
                              <>{t('to')}: {getEmployeeName(msg.recipient_id)}</>
                            ) : (
                              `${t('to')}: ${t('allDepartment')}`
                            )
                          ) : (
                            msg.sender_id ? (
                              <>{t('from')}: {getEmployeeName(msg.sender_id)}</>
                            ) : (
                              `${t('from')}: ${t('system')}`
                            )
                          )}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-xs text-gray-500">
                          {format(new Date(msg.created_at), 'MMM dd, HH:mm')}
                        </span>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title={t('deleteMessage')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-3 pl-2 border-l-2 border-gray-300">
                      {msg.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={t('newMessage')}
          footer={
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit" form="message-form">
                <Send className="w-4 h-4 mr-2 inline" />
                {t('sendMessage')}
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
          <form id="message-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.sendToAll}
                  onChange={(e) => setFormData({ ...formData, sendToAll: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{t('sendToAllDeptEmployees')}</span>
              </label>
            </div>
            {!formData.sendToAll && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('recipient')}</label>
                <select
                  value={formData.recipient_id}
                  onChange={(e) => setFormData({ ...formData, recipient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required={!formData.sendToAll}
                >
                  <option value="">{t('selectEmployee')}</option>
                  {employees.map((S) => (
                    <option value={S.user_id} key={S.id}>{S.first_name} {S.last_name} ({S.email})</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('subject')}</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder={t('messageSubject')}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('message')}</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows="5"
                placeholder={t('typeMessageHere')}
                required
              />
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

// =============== MANAGER COMP-OFF COMPONENT ===============

const ManagerCompOff = ({ user }) => {
  const { t } = useLanguage();
  return (
    <div>
      <Header title={t('compOffManagement')} subtitle={t('manageAndApproveCompOffRequests')} />
      <div className="p-6">
        <CompOffManagement currentUser={user} departmentId={user.manager_department_id} />
      </div>
    </div>
  );
};

// =============== MAIN MANAGER DASHBOARD COMPONENT ===============

const ManagerDashboard = ({ user, onLogout }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<ManagerDashboardHome user={user} />} />
            <Route path="/employees" element={<ManagerEmployees user={user} />} />
            <Route path="/roles" element={<ManagerRoles user={user} />} />
            <Route path="/schedules" element={<ManagerSchedules user={user} />} />
            <Route path="/leaves" element={<ManagerLeaves />} />
            <Route path="/comp-off" element={<ManagerCompOff user={user} />} />
            <Route path="/overtime-approvals" element={<OvertimeApproval />} />
            <Route path="/attendance" element={<ManagerAttendance user={user} />} />
            <Route path="/messages" element={<ManagerMessages user={user} />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
