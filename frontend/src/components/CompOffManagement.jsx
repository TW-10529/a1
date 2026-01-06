import React, { useState, useEffect } from 'react';
import { Calendar, Plus, CheckCircle, Clock, AlertCircle, TrendingDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import api, {
  listCompOffRequests,
  getCompOffTracking,
  getMonthlyCompOffBreakdown,
  createCompOffRequest,
  approveCompOff,
  rejectCompOff,
  exportCompOffReport
} from '../services/api';

const CompOffManagement = ({ currentUser, departmentId }) => {
  const { t } = useLanguage();
  const [compOffRequests, setCompOffRequests] = useState([]);
  const [compOffTracking, setCompOffTracking] = useState(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [showCompOffForm, setShowCompOffForm] = useState(false);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState([]);

  const [compOffForm, setCompOffForm] = useState({
    employee_id: '',
    comp_off_date: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Load comp-off requests
      const requestsRes = await listCompOffRequests();
      setCompOffRequests(requestsRes.data);

      // Load comp-off tracking if employee
      if (currentUser?.user_type === 'employee') {
        try {
          const trackingRes = await getCompOffTracking();
          setCompOffTracking(trackingRes.data);

          // Load monthly breakdown
          const breakdownRes = await getMonthlyCompOffBreakdown();
          setMonthlyBreakdown(breakdownRes.data.monthly_breakdown || []);
        } catch (err) {
          console.error('Error loading comp-off tracking:', err);
        }
      }

      // Load employees if manager
      if (currentUser?.user_type === 'manager') {
        try {
          const employeesRes = await api.get('/employees');
          setEmployees(employeesRes.data);
        } catch (err) {
          console.error('Error loading employees:', err);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load comp-off data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompOff = async () => {
    if (!compOffForm.comp_off_date) {
      setError(t('pleaseSelectDateForCompOff'));
      return;
    }

    // Validate employee_id for managers
    if (currentUser?.user_type === 'manager' && !compOffForm.employee_id) {
      setError(t('pleaseSelectAnEmployee'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const requestData = {
        comp_off_date: compOffForm.comp_off_date,
        reason: compOffForm.reason
      };

      // Only include employee_id for managers
      if (currentUser?.user_type === 'manager') {
        requestData.employee_id = parseInt(compOffForm.employee_id);
      }

      await createCompOffRequest(requestData);

      setCompOffForm({ employee_id: '', comp_off_date: '', reason: '' });
      setShowCompOffForm(false);
      await loadData();
    } catch (err) {
      let errorMsg = 'Failed to create comp-off request';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        // Handle string or object error detail
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (typeof detail === 'object') {
          errorMsg = detail.msg || JSON.stringify(detail);
        }
      }
      setError(errorMsg);
      console.error('Error creating comp-off:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCompOff = async (compOffId) => {
    setLoading(true);
    setError('');
    try {
      await approveCompOff(compOffId, 'Approved');
      await loadData();
    } catch (err) {
      let errorMsg = 'Failed to approve comp-off';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (typeof detail === 'object') {
          errorMsg = detail.msg || JSON.stringify(detail);
        }
      }
      setError(errorMsg);
      console.error('Error approving comp-off:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCompOff = async (compOffId) => {
    const notes = prompt('Enter rejection reason:');
    if (notes === null) return;

    setLoading(true);
    setError('');
    try {
      await rejectCompOff(compOffId, notes);
      await loadData();
    } catch (err) {
      let errorMsg = 'Failed to reject comp-off';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (typeof detail === 'object') {
          errorMsg = detail.msg || JSON.stringify(detail);
        }
      }
      setError(errorMsg);
      console.error('Error rejecting comp-off:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setLoading(true);
    try {
      const response = await exportCompOffReport();
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comp_off_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
    } catch (err) {
      let errorMsg = 'Failed to download report';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === 'string') {
          errorMsg = detail;
        } else if (typeof detail === 'object') {
          errorMsg = detail.msg || JSON.stringify(detail);
        }
      }
      setError(errorMsg);
      console.error('Error downloading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', labelKey: 'pending', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', labelKey: 'approved', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', labelKey: 'rejected', icon: AlertCircle }
    };
    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {t(config.labelKey)}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isToday = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date.toDateString() === today.toDateString();
  };

  const isFuture = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date > today;
  };

  return (
    <div className="space-y-6">
      {/* Comp-Off Balance Card - For Employees */}
      {currentUser?.user_type === 'employee' && compOffTracking && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            {t('compOffBalance')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">{t('earnedDays')}</p>
              <p className="text-3xl font-bold text-blue-600">{compOffTracking.earned_days}</p>
              <p className="text-xs text-gray-500 mt-1">{t('fromNonShiftDaysWorked')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
              <p className="text-sm text-gray-600 mb-1">{t('usedDays')}</p>
              <p className="text-3xl font-bold text-orange-600">{compOffTracking.used_days}</p>
              <p className="text-xs text-gray-500 mt-1">{t('alreadyTaken')}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">{t('availableDays')}</p>
              <p className="text-3xl font-bold text-green-600">{Math.max(0, compOffTracking.available_days)}</p>
              <p className="text-xs text-gray-500 mt-1">{t('readyToUse')}</p>
            </div>
          </div>
        </div>
      )}

      {/* How to Use Comp-Off */}
      {currentUser?.user_type === 'employee' && compOffTracking && compOffTracking.available_days > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-semibold mb-2">💡 {t('howToUseCompOffDays')}</p>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>{t('compOffStep1')}</li>
            <li>{t('compOffStep2')}</li>
            <li>{t('compOffStep3')}</li>
            <li>{t('compOffStep4')}</li>
            <li>{t('compOffStep5')}</li>
            <li>{t('compOffStep6')}</li>
          </ol>
          <p className="text-xs text-blue-700 mt-3 font-semibold">⚠️ {t('compOffImportantWarning')}</p>
        </div>
      )}

      {/* Info Box - What is this page for */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-900 font-semibold mb-2">ℹ️ {t('aboutCompOffRequests')}</p>
        <p className="text-sm text-yellow-800 mb-2">
          {t('compOffInfoDescription')}
        </p>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li><strong>{t('toEarnCompOff')}:</strong> {t('toEarnCompOffDetail')}</li>
          <li><strong>{t('toUseCompOff')}:</strong> {t('toUseCompOffDetail')}</li>
        </ul>
      </div>

      {/* Monthly Breakdown */}
      {currentUser?.user_type === 'employee' && monthlyBreakdown && monthlyBreakdown.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-indigo-600" />
              {t('monthlyCompOffBreakdown')}
            </h3>
            <button
              onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
              className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded hover:bg-indigo-200 transition"
            >
              {showMonthlyBreakdown ? t('hide') : t('show')} {t('details')}
            </button>
          </div>

          {showMonthlyBreakdown && (
            <div className="space-y-4">
              {monthlyBreakdown.map((month) => (
                <div key={month.month} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <span className="text-xs bg-white px-2 py-1 rounded border border-gray-300">
                      Expires: {new Date(month.expiry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className="bg-white p-2 rounded border border-gray-300">
                      <p className="text-xs text-gray-600">{t('earned')}</p>
                      <p className="text-lg font-bold text-blue-600">{month.earned}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-300">
                      <p className="text-xs text-gray-600">{t('used')}</p>
                      <p className="text-lg font-bold text-orange-600">{month.used}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-300">
                      <p className="text-xs text-gray-600">{t('available')}</p>
                      <p className="text-lg font-bold text-green-600">{month.available}</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-gray-300">
                      <p className="text-xs text-gray-600">{t('expired')}</p>
                      <p className="text-lg font-bold text-red-600">{month.expired}</p>
                    </div>
                  </div>
                  
                  {month.details && month.details.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-semibold text-gray-700">Transaction History:</p>
                      {month.details.slice(0, 3).map((detail, idx) => (
                        <p key={idx} className="text-gray-600">
                          • {new Date(detail.date).toLocaleDateString()} - {detail.type.toUpperCase()}: {detail.notes}
                        </p>
                      ))}
                      {month.details.length > 3 && (
                        <p className="text-gray-500 italic">+ {month.details.length - 3} more transactions</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">{t('error')}</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Add Comp-Off Form - For Employees */}
      {currentUser?.user_type === 'employee' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{t('requestToEarnCompOff')}</h3>
            {!showCompOffForm && (
              <button
                onClick={() => setShowCompOffForm(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                {t('newCompOffRequest')}
              </button>
            )}
          </div>

          {showCompOffForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dateYouWorked')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={compOffForm.comp_off_date}
                  onChange={(e) => setCompOffForm({ ...compOffForm, comp_off_date: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('selectDateWorkedNonShiftDay')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reason')}
                </label>
                <textarea
                  value={compOffForm.reason}
                  onChange={(e) => setCompOffForm({ ...compOffForm, reason: e.target.value })}
                  placeholder="e.g., Worked on project deadline, attended emergency meeting, etc."
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddCompOff}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? t('submitting') + '...' : t('requestToEarnCompOff')}
                </button>
                <button
                  onClick={() => setShowCompOffForm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Comp-Off Form - For Managers */}
      {currentUser?.user_type === 'manager' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{t('requestToEarnCompOff')}</h3>
            {!showCompOffForm && (
              <button
                onClick={() => setShowCompOffForm(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                {t('newCompOffRequest')}
              </button>
            )}
          </div>

          {showCompOffForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('employee')} <span className="text-red-500">*</span>
                </label>
                <select
                  value={compOffForm.employee_id}
                  onChange={(e) => setCompOffForm({ ...compOffForm, employee_id: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">{t('selectEmployee')}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dateYouWorked')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={compOffForm.comp_off_date}
                  onChange={(e) => setCompOffForm({ ...compOffForm, comp_off_date: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('selectDateWorkedNonShiftDay')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('reason')}
                </label>
                <textarea
                  value={compOffForm.reason}
                  onChange={(e) => setCompOffForm({ ...compOffForm, reason: e.target.value })}
                  placeholder="e.g., Worked on project deadline, attended emergency meeting, etc."
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddCompOff}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? t('submitting') + '...' : t('requestToEarnCompOff')}
                </button>
                <button
                  onClick={() => setShowCompOffForm(false)}
                  className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comp-Off Requests List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            {currentUser?.user_type === 'employee' ? t('yourCompOffEarningRequests') : t('compOffEarningRequests')}
          </h3>
          {currentUser?.user_type === 'employee' && (
            <button
              onClick={handleDownloadReport}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              📥 {t('downloadReport')}
            </button>
          )}
        </div>

        {loading && !compOffRequests.length ? (
          <div className="p-6 text-center text-gray-500">
            <p>{t('loadingCompOffRequests')}</p>
          </div>
        ) : compOffRequests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>
              {currentUser?.user_type === 'employee'
                ? t('noCompOffRequestsYet')
                : t('noCompOffRequestsToReview')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">{t('date')}</th>
                  {currentUser?.user_type !== 'employee' && (
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">{t('employee')}</th>
                  )}
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">{t('reason')}</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">{t('status')}</th>
                  {currentUser?.user_type === 'manager' && (
                    <th className="px-6 py-3 text-center font-semibold text-gray-700">{t('actions')}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {compOffRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-800">{formatDate(request.comp_off_date)}</p>
                        {isToday(request.comp_off_date) && (
                          <p className="text-xs text-indigo-600 font-semibold">Today</p>
                        )}
                        {isFuture(request.comp_off_date) && (
                          <p className="text-xs text-gray-500">Future</p>
                        )}
                      </div>
                    </td>
                    {currentUser?.user_type !== 'employee' && (
                      <td className="px-6 py-4 text-gray-700">
                        {request.employee
                          ? `${request.employee.first_name} ${request.employee.last_name} (${request.employee.employee_id})`
                          : `Employee #${request.employee_id}`}
                      </td>
                    )}
                    <td className="px-6 py-4 text-gray-700">{request.reason || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    {currentUser?.user_type === 'manager' && request.status === 'pending' && (
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => handleApproveCompOff(request.id)}
                          disabled={loading}
                          className="inline-block bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {t('approve')}
                        </button>
                        <button
                          onClick={() => handleRejectCompOff(request.id)}
                          disabled={loading}
                          className="inline-block bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition disabled:opacity-50"
                        >
                          {t('reject')}
                        </button>
                      </td>
                    )}
                    {currentUser?.user_type === 'manager' && request.status !== 'pending' && (
                      <td className="px-6 py-4 text-center text-gray-500">
                        {request.review_notes && (
                          <span title={request.review_notes} className="text-xs">
                            {request.review_notes.substring(0, 20)}...
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompOffManagement;
