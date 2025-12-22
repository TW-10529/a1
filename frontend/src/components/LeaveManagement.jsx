import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../services/api';

const LeaveManagement = ({ currentUser, departmentId }) => {
  const [leaves, setLeaves] = useState([]);
  const [unavailability, setUnavailability] = useState([]);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showUnavailForm, setShowUnavailForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState('leaves');
  const [loading, setLoading] = useState(false);
  const [leaveStats, setLeaveStats] = useState(null);

  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    leave_type: 'paid',
    reason: ''
  });

  const [unavailForm, setUnavailForm] = useState({
    employee_id: '',
    date: '',
    reason: ''
  });
  const [managerSearchEmpId, setManagerSearchEmpId] = useState('');
  const [managerLeaveStats, setManagerLeaveStats] = useState(null);

  const leaveTypes = [
    { value: 'paid', label: 'Paid Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' }
  ];

  const unavailReasons = [
    'Sick',
    'Personal',
    'Training',
    'Maintenance',
    'Meeting',
    'Appointment',
    'Other'
  ];

  useEffect(() => {
    loadData();
  }, [departmentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load employees for dropdown
      const empRes = await api.get('/employees');
      setEmployees(empRes.data);

      // Load leaves
      const leavesRes = await api.get('/leave-requests');
      setLeaves(leavesRes.data);

      // Load unavailability
      const unavailRes = await api.get('/unavailability');
      setUnavailability(unavailRes.data);

      // Load leave statistics for current user (if employee)
      console.log('Current user:', currentUser, 'Type:', currentUser?.user_type);
      if (currentUser?.user_type === 'employee') {
        try {
          console.log('Fetching leave statistics...');
          const statsRes = await api.get('/leave-statistics');
          console.log('Leave stats response:', statsRes.data);
          setLeaveStats(statsRes.data);
        } catch (error) {
          console.error('Could not load leave statistics:', error);
        }
      } else {
        console.log('User is not an employee, skipping leave statistics');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
    }
  };

  const handleAddLeave = async () => {
    if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await api.post('/leave-requests', leaveForm);
      setLeaveForm({ employee_id: '', start_date: '', end_date: '', leave_type: 'paid', reason: '' });
      setShowLeaveForm(false);
      await loadData();
    } catch (error) {
      console.error('Error creating leave request:', error);
      alert('Failed to create leave request');
    }
  };

  const handleAddUnavailability = async () => {
    if (!unavailForm.employee_id || !unavailForm.date) {
      alert('Please fill all required fields');
      return;
    }

    try {
      await api.post('/unavailability', unavailForm);
      setUnavailForm({ employee_id: '', date: '', reason: '' });
      setShowUnavailForm(false);
      await loadData();
    } catch (error) {
      console.error('Error creating unavailability:', error);
      alert('Failed to mark unavailability');
    }
  };

  const handleDeleteUnavailability = async (id) => {
    if (!window.confirm('Delete this unavailability record?')) return;

    try {
      await api.delete(`/unavailability/${id}`);
      await loadData();
    } catch (error) {
      console.error('Error deleting unavailability:', error);
      alert('Failed to delete record');
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      await api.put(`/leave-requests/${leaveId}/approve`, { review_notes: 'Approved' });
      await loadData();
    } catch (error) {
      console.error('Error approving leave:', error);
      alert('Failed to approve leave');
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      await api.put(`/leave-requests/${leaveId}/reject`, { review_notes: 'Rejected' });
      await loadData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      alert('Failed to reject leave');
    }
  };

  const handleSearchEmployeeLeaves = async (e) => {
    e.preventDefault();
    if (!managerSearchEmpId) {
      alert('Please enter an employee ID');
      return;
    }

    try {
      const statsRes = await api.get(`/leave-statistics/employee/${managerSearchEmpId}`);
      setManagerLeaveStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching leave statistics:', error);
      alert('Employee not found or error loading statistics');
      setManagerLeaveStats(null);
    }
  };

  const handleDownloadLeaveReport = () => {
    if (!managerLeaveStats) {
      alert('Please search for an employee first');
      return;
    }

    // Create CSV data with monthly breakdown
    const csvLines = [
      ['Employee Leave Report'],
      [],
      ['Employee ID', managerLeaveStats.employee_id],
      ['Employee Name', managerLeaveStats.employee_name],
      [],
      ['Leave Summary'],
      ['Total Paid Leave (Annual)', managerLeaveStats.total_paid_leave],
      ['Taken Paid Leave', managerLeaveStats.taken_paid_leave],
      ['Taken Unpaid Leave', managerLeaveStats.taken_unpaid_leave],
      ['Available Paid Leave', managerLeaveStats.available_paid_leave],
      ['Total Leaves Taken', managerLeaveStats.total_leaves_taken],
      [],
      ['Monthly Breakdown'],
      ['Month', 'Paid Leave', 'Unpaid Leave', 'Total']
    ];

    // Add monthly breakdown rows
    if (managerLeaveStats.monthly_breakdown && managerLeaveStats.monthly_breakdown.length > 0) {
      managerLeaveStats.monthly_breakdown.forEach(month => {
        csvLines.push([month.month, month.paid, month.unpaid, month.total]);
      });
    }

    csvLines.push([]);
    csvLines.push(['Generated on', new Date().toLocaleDateString()]);

    const csvContent = csvLines.map(row => row.join(',')).join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-report-${managerLeaveStats.employee_id}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
    };
    const config = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-1 rounded text-sm ${config.bg} ${config.text}`}>{config.label}</span>;
  };

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.id === parseInt(empId));
    return emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Leave Statistics Box - Show only for employees */}
      {currentUser?.user_type === 'employee' && leaveStats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Leave Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-sm text-gray-600 mb-1">Total Annual Paid Leave</p>
              <p className="text-2xl font-bold text-blue-600">{leaveStats.total_paid_leave}</p>
              <p className="text-xs text-gray-500 mt-1">days/year</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
              <p className="text-sm text-gray-600 mb-1">Taken Paid Leave</p>
              <p className="text-2xl font-bold text-orange-600">{leaveStats.taken_paid_leave}</p>
              <p className="text-xs text-gray-500 mt-1">days used</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <p className="text-sm text-gray-600 mb-1">Available Paid Leave</p>
              <p className="text-2xl font-bold text-green-600">{leaveStats.available_paid_leave}</p>
              <p className="text-xs text-gray-500 mt-1">days remaining</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-sm text-gray-600 mb-1">Coverage</p>
              <p className="text-2xl font-bold text-purple-600">
                {leaveStats.total_paid_leave > 0 ? Math.round((leaveStats.taken_paid_leave / leaveStats.total_paid_leave) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">of annual leave</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'leaves'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="inline mr-2 w-4 h-4" />
          Leave Requests
        </button>
        <button
          onClick={() => setActiveTab('unavail')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'unavail'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <AlertCircle className="inline mr-2 w-4 h-4" />
          Unavailability
        </button>
      </div>

      {/* Leave Requests Tab */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          {/* Manager Leave Statistics Search */}
          {currentUser?.user_type === 'manager' && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Employee Leave Statistics</h3>
              <form onSubmit={handleSearchEmployeeLeaves} className="flex gap-2 mb-4">
                <input
                  type="number"
                  placeholder="Enter Employee ID"
                  value={managerSearchEmpId}
                  onChange={(e) => setManagerSearchEmpId(e.target.value)}
                  className="flex-1 border rounded px-3 py-2"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Search
                </button>
              </form>

              {managerLeaveStats && (
                <div className="bg-white p-4 rounded-lg border border-indigo-100">
                  <div className="mb-4">
                    <h4 className="font-semibold text-lg">{managerLeaveStats.employee_name}</h4>
                    <p className="text-sm text-gray-600">ID: {managerLeaveStats.employee_id}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Total Paid Leave</p>
                      <p className="text-lg font-bold text-blue-600">{managerLeaveStats.total_paid_leave}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Taken Paid</p>
                      <p className="text-lg font-bold text-orange-600">{managerLeaveStats.taken_paid_leave}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Taken Unpaid</p>
                      <p className="text-lg font-bold text-red-600">{managerLeaveStats.taken_unpaid_leave}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Available Paid</p>
                      <p className="text-lg font-bold text-green-600">{managerLeaveStats.available_paid_leave}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Total Taken</p>
                      <p className="text-lg font-bold text-purple-600">{managerLeaveStats.total_leaves_taken}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadLeaveReport}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    📥 Download Report (CSV)
                  </button>
                  
                  {/* Monthly Breakdown */}
                  {managerLeaveStats.monthly_breakdown && managerLeaveStats.monthly_breakdown.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h5 className="font-semibold text-gray-800 mb-3">Monthly Breakdown</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 border-b">
                              <th className="px-3 py-2 text-left">Month</th>
                              <th className="px-3 py-2 text-center">Paid Leave</th>
                              <th className="px-3 py-2 text-center">Unpaid Leave</th>
                              <th className="px-3 py-2 text-center">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {managerLeaveStats.monthly_breakdown.map((month, idx) => (
                              <tr key={idx} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium text-gray-700">{month.month}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                                    {month.paid}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold">
                                    {month.unpaid}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center font-bold">{month.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Leave Requests</h3>
            {currentUser?.user_type === 'manager' && (
              <button
                onClick={() => setShowLeaveForm(!showLeaveForm)}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                New Leave Request
              </button>
            )}
          </div>

          {/* Leave Form */}
          {showLeaveForm && currentUser?.user_type === 'manager' && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee</label>
                  <select
                    value={leaveForm.employee_id}
                    onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leave_type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    {leaveTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <textarea
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                    placeholder="Optional reason for leave..."
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddLeave}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Submit Leave Request
                </button>
                <button
                  onClick={() => setShowLeaveForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Leaves List */}
          <div className="space-y-3">
            {leaves.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No leave requests found</p>
            ) : (
              leaves.map(leave => (
                <div key={leave.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{getEmployeeName(leave.employee_id)}</h4>
                      <p className="text-sm text-gray-600">
                        {formatDate(leave.start_date)} to {formatDate(leave.end_date)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Type:</span> {leave.leave_type}
                      </p>
                      {leave.reason && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Reason:</span> {leave.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(leave.status)}
                      {leave.status === 'pending' && currentUser?.user_type === 'manager' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveLeave(leave.id)}
                            className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectLeave(leave.id)}
                            className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Unavailability Tab */}
      {activeTab === 'unavail' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Employee Unavailability</h3>
            {currentUser?.user_type === 'manager' && (
              <button
                onClick={() => setShowUnavailForm(!showUnavailForm)}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
              >
                <Plus className="w-4 h-4" />
                Mark Unavailable
              </button>
            )}
          </div>

          {/* Unavailability Form */}
          {showUnavailForm && currentUser?.user_type === 'manager' && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee</label>
                  <select
                    value={unavailForm.employee_id}
                    onChange={(e) => setUnavailForm({ ...unavailForm, employee_id: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={unavailForm.date}
                    onChange={(e) => setUnavailForm({ ...unavailForm, date: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <select
                    value={unavailForm.reason}
                    onChange={(e) => setUnavailForm({ ...unavailForm, reason: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select reason...</option>
                    {unavailReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddUnavailability}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Mark Unavailable
                </button>
                <button
                  onClick={() => setShowUnavailForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Unavailability List */}
          <div className="space-y-3">
            {unavailability.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No unavailability records found</p>
            ) : (
              unavailability.map(record => (
                <div key={record.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{getEmployeeName(record.employee_id)}</h4>
                      <p className="text-sm text-gray-600">
                        <Calendar className="inline mr-2 w-4 h-4" />
                        {formatDate(record.date)}
                      </p>
                      {record.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Reason:</span> {record.reason}
                        </p>
                      )}
                    </div>
                    {currentUser?.user_type === 'manager' && (
                      <button
                        onClick={() => handleDeleteUnavailability(record.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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

export default LeaveManagement;
