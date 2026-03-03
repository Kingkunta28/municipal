import { useState, useEffect } from 'react'
import api from '../api/axios'

const Payment = () => {
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  // Step 1: Generate control number
  const [generatedControlNumber, setGeneratedControlNumber] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Step 2: Pay with control number
  const [controlNumberInput, setControlNumberInput] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        api.get('/payments/'),
        api.get('/dashboard/summary/')
      ])
      setPayments(paymentsRes.data.results || paymentsRes.data)
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Error fetching payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateControlNumber = async () => {
    setGenerating(true)
    setPaymentError('')
    setPaymentSuccess('')
    try {
      const res = await api.post('/payments/generate_control_number/')
      setGeneratedControlNumber(res.data.control_number)
      setControlNumberInput(res.data.control_number)
      setCopied(false)
    } catch (error) {
      setPaymentError(error.response?.data?.error || 'Failed to generate control number.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedControlNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    setPaymentError('')
    setPaymentSuccess('')

    const amount = parseFloat(amountInput)
    const outstanding = summary ? parseFloat(summary.outstanding_balance) : 0

    if (!controlNumberInput.trim()) {
      setPaymentError('Please enter a control number.')
      return
    }

    if (!amountInput || isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid amount.')
      return
    }

    if (outstanding > 0 && amount < outstanding) {
      setPaymentError(
        `Amount must be at least TZS ${outstanding.toLocaleString()} (your outstanding balance).`
      )
      return
    }

    setSubmitting(true)
    try {
      await api.post('/payments/pay_with_control_number/', {
        control_number: controlNumberInput.trim(),
        amount: amountInput
      })
      setPaymentSuccess('Payment submitted! Awaiting admin verification. Your account will be updated once approved.')
      setGeneratedControlNumber('')
      setControlNumberInput('')
      setAmountInput('')
      fetchData()
      localStorage.setItem('paymentSubmitted', Date.now().toString())
    } catch (error) {
      setPaymentError(
        error.response?.data?.error || 'Payment failed. Please check your control number and try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':  return 'bg-success'
      case 'Approved':   return 'bg-info'
      case 'Pending':    return 'bg-warning text-dark'
      case 'Rejected':   return 'bg-danger'
      case 'Processing': return 'bg-primary'
      case 'Failed':     return 'bg-danger'
      case 'Cancelled':  return 'bg-secondary'
      default:           return 'bg-secondary'
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

  const outstanding = summary ? parseFloat(summary.outstanding_balance) : 0

  return (
    <div className="container-fluid p-3 bg-light">
      <h2 className="fw-light mb-4">Payments</h2>

      {/* Summary Cards */}
      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm text-center p-3">
              <div className="text-muted small mb-1">Total Tax Due</div>
              <div className="fw-bold fs-5">
                TZS {parseFloat(summary.total_tax_due).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm text-center p-3">
              <div className="text-muted small mb-1">Amount Paid</div>
              <div className="fw-bold fs-5 text-success">
                TZS {parseFloat(summary.paid_amount).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm text-center p-3">
              <div className="text-muted small mb-1">Outstanding Balance</div>
              <div className={`fw-bold fs-5 ${outstanding > 0 ? 'text-danger' : 'text-success'}`}>
                TZS {outstanding.toLocaleString()}
              </div>
            </div>
          </div>

          {summary.next_payment_due_date && (
            <div className="col-12">
              <div className="alert alert-info mb-0 py-2">
                <i className="fas fa-calendar-alt me-2"></i>
                Next Payment Due:{' '}
                <strong>
                  {new Date(summary.next_payment_due_date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Make a Payment</h5>
        </div>
        <div className="card-body">

          {paymentError && (
            <div className="alert alert-danger d-flex align-items-center ">
              <i className="fas fa-exclamation-circle"></i>
              <span>{paymentError}</span>
            </div>
          )}
          {paymentSuccess && (
            <div className="alert alert-success d-flex align-items-center gap-2">
              <i className="fas fa-check-circle"></i>
              <span>{paymentSuccess}</span>
            </div>
          )}

          {/* Step 1 */}
          <div className="mb-4">
            {/* <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary rounded-circle" style={{ width: 26, height: 26, lineHeight: '18px', fontSize: 13 }}>1</span>
              <h6 className="fw-semibold mb-0">Generate Control Number</h6>
            </div> */}
            {/* <p className="text-muted small ms-4 mb-3">
              Click the button to generate a unique control number for your payment session.
            </p> */}

            <button
              className="btn btn-primary ms-4"
              onClick={handleGenerateControlNumber}
              disabled={generating}
            >
              {generating ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Generating...</>
              ) : (
                <>Generate Control Number</>
              )}
            </button>

            {/* {generatedControlNumber && (
              <div className="mt-3 ms-4 p-3 bg-light border rounded d-flex align-items-center gap-3" style={{ maxWidth: 480 }}>
                <div className="flex-grow-1">
                  <div className="text-muted small">Your Control Number</div>
                  <div className="fw-bold fs-5 font-monospace text-primary letter-spacing-1">
                    {generatedControlNumber}
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={handleCopy}
                  title="Copy control number"
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} me-1`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )} */}
          </div>


          {/* Step 2 */}
          <div>
            {/* <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary rounded-circle" style={{ width: 26, height: 26, lineHeight: '18px', fontSize: 13 }}>2</span>
              <h6 className="fw-semibold mb-0">Enter Control Number &amp; Amount</h6>
            </div> */}
            <p className="text-muted small ms-4 mb-3">
              {/* Paste the control number you copied and enter the amount to pay. */}
              {outstanding > 0 && (
                <> Minimum amount required:{' '}
                  <strong className="text-danger">TZS {outstanding.toLocaleString()}</strong>
                </>
              )}
            </p>

            <form onSubmit={handlePaymentSubmit} className="ms-4">
              <div className="row g-3" style={{ maxWidth: 600 }}>
                <div className="col-md-6">
                  <label className="form-label fw-medium">Control Number</label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    placeholder="e.g. TXNABC1234DE"
                    value={controlNumberInput}
                    onChange={(e) => setControlNumberInput(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-medium">
                    Amount (TZS)
                    {outstanding > 0 && (
                      <span className="text-danger ms-1 small fw-normal">
                        min: {outstanding.toLocaleString()}
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    min="1"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-success mt-3"
                disabled={submitting}
              >
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</>
                ) : (
                  <><i className="fas fa-paper-plane me-2"></i>Submit Payment</>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Payment History */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0">Payment History</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Control Number</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? payments.map((payment, index) => (
                  <tr key={payment.id}>
                    <td>{index + 1}</td>
                    <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                    <td>TZS {parseFloat(payment.amount).toLocaleString()}</td>
                    <td>{payment.payment_method}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="font-monospace small">
                      {payment.control_number || payment.provider_reference || '-'}
                    </td>
                    <td>
                      {payment.status === 'Rejected' && payment.rejection_reason && (
                        <span className="text-danger small">Reason: {payment.rejection_reason}</span>
                      )}
                      {payment.status === 'Pending' && (
                        <span className="text-muted small">Awaiting admin approval</span>
                      )}
                      {payment.status === 'Processing' && (
                        <span className="text-primary small">Submitted — awaiting admin verification</span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">No payment history</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
