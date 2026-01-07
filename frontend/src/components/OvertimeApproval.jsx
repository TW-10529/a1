import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Check, X } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import Header from './layout/Header';

const OvertimeApproval = () => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [message, setMessage] = useState(null);
  const [filterStatus, setFilterStatus] = useState('PENDING');

  useEffect(() => {
    loadPendingRequests();
  }, [filterStatus]);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/overtime-requests?status=${filterStatus}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading overtime requests:', error);
      setMessage({
        type: 'error',
        text: t('failedToLoadOvertimeRequests')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      await api.put(`/overtime-requests/${requestId}/approve`, {
        approval_notes: approvalNotes
      });
      setMessage({
        type: 'success',
        text: t('overtimeRequestApproved')
      });
      setSelectedRequest(null);
      setApprovalNotes('');
      loadPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || t('failedToApproveRequest')
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setProcessingId(requestId);
      await api.put(`/overtime-requests/${requestId}/reject`, {
        approval_notes: approvalNotes
      });
      setMessage({
        type: 'success',
        text: t('overtimeRequestRejected')
      });
      setSelectedRequest(null);
      setApprovalNotes('');
      loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || t('failedToRejectRequest')
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getEmployeeName = (request) => {
    // This would need to be included in the response or fetched separately
    return `${t('employeeId')}: ${request.employee_id}`;
  };

  const isStatusPending = (status) => {
    return (status || '').toLowerCase() === 'pending';
  };

  return (
    <>
      <Header title={t('overtimeApprovals')} subtitle={t('reviewApproveOvertimeRequests')} />
      <div className="p-6">
        <div className="space-y-6">
          {/* Status Filter */}
          <div className="flex gap-2">
        {[{ key: 'PENDING', label: 'pending' }, { key: 'APPROVED', label: 'approved' }, { key: 'REJECTED', label: 'rejected' }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === key
                ? key === 'PENDING'
                  ? 'bg-yellow-600 text-white'
                  : key === 'APPROVED'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto text-sm font-medium hover:opacity-75"
          >
            {t('dismissAlert')}
          </button>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold">{t('allCaughtUp')}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t('noPendingOvertimeRequests')}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white border-l-4 border-yellow-400 rounded-lg p-6 shadow-sm"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-gray-900">
                      {getEmployeeName(request)}
                    </h3>
                    <span className="ml-auto flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isStatusPending(request.status) ? 'bg-yellow-100 text-yellow-800' :
                        (request.status || '').toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t((request.status || '').toLowerCase())}
                      </span>
                      <span className="text-sm font-medium text-gray-500">
                        {new Date(request.request_date).toLocaleDateString()}
                      </span>
                    </span>
                  </div>

                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      <strong>{t('date')}:</strong> {new Date(request.request_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      <strong>{t('time')}:</strong> <span className="text-lg font-bold text-blue-600">{request.from_time || 'N/A'} - {request.to_time || 'N/A'}</span>
                    </p>
                    <p className="text-sm text-gray-700 font-medium mb-2">
                      <strong>{t('overtimeHours')}:</strong> <span className="text-lg font-bold text-blue-600">{request.request_hours?.toFixed(1) || 'N/A'} {t('hours')}</span>
                    </p>
                    <p className="text-sm text-gray-600"><strong>{t('reason')}:</strong> {request.reason}</p>
                  </div>

                  {selectedRequest?.id === request.id && isStatusPending(request.status) ? (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('overtimeApprovalNotes')}
                        </label>
                        <textarea
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          placeholder={t('addNotesAboutDecision')}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          {processingId === request.id ? t('processing') : t('approveOvertime')}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={processingId === request.id}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          {processingId === request.id ? t('processing') : t('rejectOvertime')}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRequest(null);
                            setApprovalNotes('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                        >
                          {t('cancel')}
                        </button>
                      </div>
                    </div>
                  ) : selectedRequest?.id === request.id ? (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-700 font-medium mb-2">
                          {t('managerNotes')}:
                        </p>
                        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                          {request.manager_notes || t('noNotesProvided')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRequest(null);
                          setApprovalNotes('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        {t('close')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      {isStatusPending(request.status) ? t('reviewRequest') : t('viewDetails')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </div>
      </div>
    </>
  );
};

export default OvertimeApproval;
