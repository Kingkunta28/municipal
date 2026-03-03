import { useState, useEffect } from 'react'
import api from '../api/axios'
import { showSuccess, showError, showWarning } from '../utils/swal'

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null)
  const [pendingPayments, setPendingPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [processingId, setProcessingId] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingPayment, setRejectingPayment] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [metricsRes, allPaymentsRes] = await Promise.all([
        api.get('/admin/metrics/'),
        api.get('/payments/')
      ])
      setMetrics(metricsRes.data)
      // Filter for pending and approved payments
      const filteredPayments = allPaymentsRes.data.filter(
        p => p.status === 'Pending' || p.status === 'Processing' || p.status === 'Approved'
      )
      setPendingPayments(filteredPayments)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (paymentId) => {
    setProcessingId(paymentId)
    try {
      await api.post(`/payments/${paymentId}/approve/`, {})
      await fetchData()
      showSuccess('Payment Approved', 'The payment has been approved successfully.')
    } catch (error) {
      console.error('Error approving payment:', error)
      showError('Approval Failed', error.response?.data?.error || 'Failed to approve payment')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectClick = (payment) => {
    setRejectingPayment(payment)
    setShowRejectModal(true)
  }

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      showWarning('Validation Error', 'Please provide a rejection reason')
      return
    }
    setProcessingId(rejectingPayment.id)
    try {
      await api.post(`/payments/${rejectingPayment.id}/reject/`, {
        rejection_reason: rejectReason
      })
      setShowRejectModal(false)
      setRejectingPayment(null)
      setRejectReason('')
      await fetchData()
      showSuccess('Payment Rejected', 'The payment has been rejected.')
    } catch (error) {
      console.error('Error rejecting payment:', error)
      showError('Rejection Failed', error.response?.data?.error || 'Failed to reject payment')
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkPaid = async (paymentId) => {
    setProcessingId(paymentId)
    try {
      await api.post(`/payments/${paymentId}/mark_paid/`, {})
      await fetchData()
      showSuccess('Payment Completed', 'The payment has been marked as paid.')
    } catch (error) {
      console.error('Error marking payment as paid:', error)
      showError('Action Failed', error.response?.data?.error || 'Failed to complete payment')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid p-3">
      <h2 className="mb-4">Admin Dashboard</h2>

      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`bg-transparent nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`bg-transparent nav-link ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Pending Payments
            {pendingPayments.length > 0 && (
              <span className="badge bg-danger ms-2 ">{pendingPayments.length}</span>
            )}
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Registered Taxpayers</h6>
                <h4 className="mb-0">{metrics.total_registered_taxpayers}</h4>
              </div>
            </div>
          </div>
          
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Tax Assessed</h6>
                <h4 className="mb-0">TZS {parseFloat(metrics.total_tax_assessed).toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Revenue Collected</h6>
                <h4 className="mb-0 text-success">TZS {parseFloat(metrics.total_revenue_collected).toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Outstanding Tax Amount</h6>
                <h4 className="mb-0 text-danger">TZS {parseFloat(metrics.outstanding_tax_amount).toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Overdue Accounts</h6>
                <h4 className="mb-0 text-danger">{metrics.overdue_accounts}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <h6 className="text-muted mb-2">Pending Payments</h6>
                <h4 className="mb-0 text-warning">{metrics.pending_payments || 0}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="mb-3">Payment Requests</h5>
            {pendingPayments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      {/* <th>ID</th> */}
                      <th>User</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map(payment => (
                      <tr key={payment.id}>
                        {/* <td>#{payment.id}</td> */}
                        <td>{payment.user_email}</td>
                        <td>TZS {parseFloat(payment.amount).toLocaleString()}</td>
                        <td>{payment.payment_method}</td>
                        <td>{payment.provider_reference || '-'}</td>
                        <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${
                            payment.status === 'Pending'    ? 'bg-warning text-dark' :
                            payment.status === 'Processing' ? 'bg-primary' :
                            payment.status === 'Approved'   ? 'bg-info' : 'bg-secondary'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          {(payment.status === 'Pending' || payment.status === 'Processing') && (
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-success"
                                onClick={() => handleApprove(payment.id)}
                                disabled={processingId === payment.id}
                              >
                                {processingId === payment.id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleRejectClick(payment)}
                                disabled={processingId === payment.id}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {payment.status === 'Approved' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleMarkPaid(payment.id)}
                              disabled={processingId === payment.id}
                            >
                              {processingId === payment.id ? 'Processing...' : 'Mark as Paid'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted text-center py-4">No pending payments</p>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reject Payment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectingPayment(null)
                    setRejectReason('')
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to reject this payment?</p>
                <div className="mb-3">
                  <label className="form-label">Rejection Reason</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectingPayment(null)
                    setRejectReason('')
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRejectConfirm}
                  disabled={processingId === rejectingPayment?.id}
                >
                  {processingId === rejectingPayment?.id ? 'Processing...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default AdminDashboard