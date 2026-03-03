import { useState, useEffect } from 'react'
import api from '../api/axios'

const Dashboard = () => {
  const [user, setUser] = useState(null)
  const [summary, setSummary] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()

    // Check for initial payment trigger
    const initialTrigger = localStorage.getItem('paymentSubmitted')
    if (initialTrigger) {
      localStorage.removeItem('paymentSubmitted')
      fetchDashboardData()
    }

    // Listen for storage events (cross-tab communication)
    const checkPaymentTrigger = setInterval(() => {
      const trigger = localStorage.getItem('paymentSubmitted')
      if (trigger) {
        localStorage.removeItem('paymentSubmitted')
        fetchDashboardData()
      }
    }, 1000)

    // Cleanup
    return () => {
      clearInterval(checkPaymentTrigger)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile
      const userResponse = await api.get('/auth/me/')
      setUser(userResponse.data)
      
      // Fetch tax summary
      const summaryResponse = await api.get('/dashboard/summary/')
      setSummary(summaryResponse.data)
      
      // Fetch recent payments
      const paymentsResponse = await api.get('/payments/')
      setPayments(paymentsResponse.data.slice(0, 5)) // Get only 5 most recent
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'bg-warning',
      'Approved': 'bg-info',
      'Processing': 'bg-primary',
      'Completed': 'bg-success',
      'Failed': 'bg-danger',
      'Rejected': 'bg-danger',
      'Cancelled': 'bg-secondary'
    }
    return statusColors[status] || 'bg-secondary'
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

  if (error) {
    return (
      <div className="container-fluid p-3">
        <div className="alert alert-danger" role="alert">
          {error}
          <button className="btn btn-outline-danger ms-2" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid p-3">
      <h2 className="mb-4">Dashboard</h2>
      
      {/* User Profile Section */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="bg-primary rounded-circle p-3 me-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 16 16">
                    <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                    <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1">{user?.profile?.full_name || user?.email}</h4>
                  <p className="text-muted mb-0">
                    {user?.profile?.taxpayer_type && `${user.profile.taxpayer_type} - `}
                    {user?.profile?.business_name || 'Individual Taxpayer'}
                  </p>
                  <small className="text-muted">
                    {user?.profile?.property_location || 'No property location'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Tax Due</h6>
              <h4 className="mb-0">
                {summary?.total_tax_due ? `TZS ${parseFloat(summary.total_tax_due).toLocaleString()}` : 'TZS 0'}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Paid Amount</h6>
              <h4 className="mb-0 text-success">
                {summary?.paid_amount ? `TZS ${parseFloat(summary.paid_amount).toLocaleString()}` : 'TZS 0'}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Outstanding Balance</h6>
              <h4 className="mb-0 text-danger">
                {summary?.outstanding_balance ? `TZS ${parseFloat(summary.outstanding_balance).toLocaleString()}` : 'TZS 0'}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Next Payment Due</h6>
              <h5 className="mb-0">
                {summary?.next_payment_due_date ? new Date(summary.next_payment_due_date).toLocaleDateString() : 'N/A'}
              </h5>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted mb-2">Account Status</h6>
              <h5 className="mb-0" style={{ color: summary?.status === 'Active' ? '#22c55e' : '#ef4444' }}>
                {summary?.status || 'Active'}
              </h5>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Account Details & Recent Payments */}
      <div className="row g-3">
        {/* Tax Account Details */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h5 className="mb-0">Tax Account Details</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <small className="text-muted d-block">Tax Type</small>
                <strong>Property Tax</strong>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">National ID</small>
                <strong>{user?.profile?.national_id_number || 'N/A'}</strong>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Mobile Phone</small>
                <strong>{user?.profile?.mobile_phone || 'N/A'}</strong>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Ward</small>
                <strong>{user?.profile?.ward || 'N/A'}</strong>
              </div>
              <div className="mb-3">
                <small className="text-muted d-block">Street/Village</small>
                <strong>{user?.profile?.street_village || 'N/A'}</strong>
              </div>
              <div className="mb-0">
                <small className="text-muted d-block">House Number</small>
                <strong>{user?.profile?.house_number || 'N/A'}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Recent Payments</h5>
              <a href="/payment" className="btn btn-sm btn-outline-primary">View All</a>
            </div>
            <div className="card-body p-0">
              {payments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Reference</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                          <td>
                            <small className="text-muted">
                              {payment.control_number || payment.provider_reference || `#${payment.id}`}
                            </small>
                          </td>
                          <td>TZS {parseFloat(payment.amount).toLocaleString()}</td>
                          <td>{payment.payment_method}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">No payments yet</p>
                  <a href="/payment" className="btn btn-primary btn-sm mt-2">Make a Payment</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
