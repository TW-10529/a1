import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Send } from 'lucide-react';
import api from '../services/api';

const OvertimeRequest = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    request_date: new Date().toISOString().split('T')[0],
    from_time: '09:00',
    to_time: '10:00',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Load requests on component mount
  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/overtime-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading overtime requests:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load overtime requests'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Calculate hours from time range
      const [fromHour, fromMin] = formData.from_time.split(':').map(Number);
      const [toHour, toMin] = formData.to_time.split(':').map(Number);
      const fromMins = fromHour * 60 + fromMin;
      const toMins = toHour * 60 + toMin;
      let diffMins = toMins - fromMins;
      
      // Handle overnight shifts
      if (diffMins < 0) {
        diffMins += 24 * 60;
      }
      
      const requestHours = diffMins / 60;
      
      if (requestHours <= 0) {
        setMessage({
          type: 'error',
          text: 'End time must be after start time'
        });
        setSubmitting(false);
        return;
      }
      
      await api.post('/overtime-requests', {
        request_date: formData.request_date,
        from_time: formData.from_time,
        to_time: formData.to_time,
        request_hours: requestHours,
        reason: formData.reason
      });
      setMessage({
        type: 'success',
        text: 'Overtime request submitted successfully'
      });
      setFormData({ 
        request_date: new Date().toISOString().split('T')[0],
        from_time: '09:00',
        to_time: '10:00',
        reason: '' 
      });
      setShowForm(false);
      loadRequests();
    } catch (error) {
      console.error('Error submitting request:', error);
      let errorMsg = 'Failed to submit request';
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map(e => typeof e === 'string' ? e : e.msg || JSON.stringify(e)).join(', ');
      }
      setMessage({
        type: 'error',
        text: errorMsg
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Overtime Requests</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showForm
              ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
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
            Dismiss
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Overtime Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Date *
              </label>
              <input
                type="date"
                value={formData.request_date}
                onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Date for which you need overtime
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Time *
              </label>
              <input
                type="time"
                value={formData.from_time}
                onChange={(e) => setFormData({ ...formData, from_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Overtime start time
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Time *
              </label>
              <input
                type="time"
                value={formData.to_time}
                onChange={(e) => setFormData({ ...formData, to_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Overtime end time
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>Duration:</strong> {(() => {
                  const [fromHour, fromMin] = formData.from_time.split(':').map(Number);
                  const [toHour, toMin] = formData.to_time.split(':').map(Number);
                  const fromMins = fromHour * 60 + fromMin;
                  const toMins = toHour * 60 + toMin;
                  let diffMins = toMins - fromMins;
                  if (diffMins < 0) diffMins += 24 * 60;
                  const hours = Math.floor(diffMins / 60);
                  const mins = diffMins % 60;
                  return `${hours}h ${mins}m`;
                })()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain why you need overtime..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Your Requests</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No overtime requests yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Submit your first overtime request using the button above
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`border-l-4 rounded-lg p-4 flex justify-between items-start ${getStatusColor(
                  request.status
                )}`}
              >
                <div className="flex gap-3 flex-1">
                  {getStatusIcon(request.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {request.request_hours.toFixed(1)} hours
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-200 text-green-800'
                            : request.status === 'rejected'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{request.reason}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Requested: {new Date(request.request_date).toLocaleDateString()}
                    </p>
                    {request.manager_notes && (
                      <div className="mt-2 p-2 bg-white/50 rounded text-sm text-gray-700">
                        <p className="font-medium text-gray-800">Manager Notes:</p>
                        <p>{request.manager_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OvertimeRequest;
