import { useState, useEffect } from 'react'
import api from '../api/axios'

const UnpaidUsers = () => {
  const [unpaidUsers, setUnpaidUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUnpaidUsers()
  }, [])

  const fetchUnpaidUsers = async () => {
    try {
      const unpaidRes = await api.get('/admin/unpaid-users/')
      setUnpaidUsers(unpaidRes.data.results || unpaidRes.data)
    } catch (error) {
      console.error('Error fetching unpaid users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handlePrintBill = (account) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    const logoUrl = `${window.location.origin}/logo.png`
    const printDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    const billRef = `BILL-${String(account.id).padStart(6, '0')}`
    const outstanding = parseFloat(account.outstanding_balance).toLocaleString()
    const totalDue = parseFloat(account.total_tax_due).toLocaleString()
    const paid = parseFloat(account.paid_amount).toLocaleString()
    const dueDate = account.next_payment_due_date
      ? new Date(account.next_payment_due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'N/A'

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tax Bill - ${billRef}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 14px; color: #222; background: #fff; padding: 40px; }
          .bill-wrapper { max-width: 680px; margin: 0 auto; border: 2px solid #1a3c6e; border-radius: 6px; overflow: hidden; }

          /* Header */
          .bill-header { background: #1a3c6e; color: #fff; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
          .bill-header .org-left { display: flex; align-items: center; gap: 14px; }
          .bill-header .org-logo { width: 54px; height: 54px; object-fit: contain; border-radius: 50%; background: #fff; padding: 4px; flex-shrink: 0; }
          .bill-header .org-name { font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .bill-header .org-sub { font-size: 12px; opacity: 0.85; margin-top: 4px; }
          .bill-header .bill-label { text-align: right; }
          .bill-header .bill-label h2 { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
          .bill-header .bill-label .bill-ref { font-size: 12px; opacity: 0.85; margin-top: 4px; }

          /* Meta row */
          .bill-meta { background: #f0f4fa; padding: 14px 32px; display: flex; justify-content: space-between; border-bottom: 1px solid #d0d8e8; }
          .bill-meta .meta-item { font-size: 12px; color: #555; }
          .bill-meta .meta-item strong { display: block; font-size: 13px; color: #222; margin-top: 2px; }

          /* Body */
          .bill-body { padding: 28px 32px; }
          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #1a3c6e; border-bottom: 1px solid #d0d8e8; padding-bottom: 6px; margin-bottom: 14px; }

          /* Taxpayer info */
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-bottom: 28px; }
          .info-item { font-size: 13px; }
          .info-item .label { color: #777; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          .info-item .value { font-weight: 600; margin-top: 2px; }

          /* Financial table */
          .fin-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
          .fin-table th { background: #1a3c6e; color: #fff; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .fin-table td { padding: 10px 14px; border-bottom: 1px solid #e8ecf2; font-size: 13px; }
          .fin-table tr:last-child td { border-bottom: none; }
          .fin-table .amount { text-align: right; font-weight: 600; }
          .fin-table .outstanding-row td { background: #fff5f5; color: #c0392b; font-weight: 700; font-size: 14px; }

          /* Status badge */
          .status-badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; }
          .status-active { background: #d4edda; color: #155724; }
          .status-overdue { background: #f8d7da; color: #721c24; }
          .status-suspended { background: #fff3cd; color: #856404; }

          /* Footer */
          .bill-footer { background: #f0f4fa; padding: 16px 32px; border-top: 1px solid #d0d8e8; display: flex; justify-content: space-between; align-items: center; }
          .bill-footer .note { font-size: 11px; color: #777; max-width: 380px; line-height: 1.5; }
          .bill-footer .stamp { font-size: 11px; color: #aaa; text-align: right; }

          @media print {
            body { padding: 0; }
            .bill-wrapper { border: 2px solid #1a3c6e; }
          }
        </style>
      </head>
      <body>
        <div class="bill-wrapper">

          <!-- Header -->
          <div class="bill-header">
            <div class="org-left">
              <img src="${logoUrl}" alt="Municipal Tax System Logo" class="org-logo" />
              <div>
                <div class="org-name">Municipal Tax System</div>
                <div class="org-sub">Revenue Collection Department</div>
              </div>
            </div>
            <div class="bill-label">
              <h2>TAX BILL</h2>
              <div class="bill-ref">${billRef}</div>
            </div>
          </div>

          <!-- Meta -->
          <div class="bill-meta">
            <div class="meta-item">
              Date Issued
              <strong>${printDate}</strong>
            </div>
            <div class="meta-item">
              Payment Due Date
              <strong>${dueDate}</strong>
            </div>
            <div class="meta-item">
              Account Status
              <strong>
                <span class="status-badge ${
                  account.status === 'Active' ? 'status-active' :
                  account.status === 'Overdue' ? 'status-overdue' : 'status-suspended'
                }">${account.status}</span>
              </strong>
            </div>
          </div>

          <!-- Body -->
          <div class="bill-body">

            <!-- Taxpayer Info -->
            <div class="section-title">Taxpayer Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Email Address</div>
                <div class="value">${account.email}</div>
              </div>
              <div class="info-item">
                <div class="label">Tax Type</div>
                <div class="value">${account.tax_type_name}</div>
              </div>
              <div class="info-item">
                <div class="label">Bill Reference</div>
                <div class="value">${billRef}</div>
              </div>
              <div class="info-item">
                <div class="label">Account ID</div>
                <div class="value">#${account.id}</div>
              </div>
            </div>

            <!-- Financial Breakdown -->
            <div class="section-title">Financial Breakdown</div>
            <table class="fin-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align:right">Amount (TZS)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Tax Assessed</td>
                  <td class="amount">${totalDue}</td>
                </tr>
                <tr>
                  <td>Amount Paid</td>
                  <td class="amount" style="color:#155724;">${paid}</td>
                </tr>
                <tr class="outstanding-row">
                  <td>Outstanding Balance (Amount Due)</td>
                  <td class="amount">${outstanding}</td>
                </tr>
              </tbody>
            </table>

          </div>

          <!-- Footer -->
          <div class="bill-footer">
            <div class="note">
              Please pay the outstanding balance by the due date to avoid penalties.
              For inquiries, contact the Revenue Collection Department.
            </div>
            <div class="stamp">
              Printed: ${printDate}<br/>
              Municipal Tax System
            </div>
          </div>

        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
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
    <div className="container-fluid">
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Unpaid Accounts</h4>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Tax Type</th>
                  <th>Total Due</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {unpaidUsers.length > 0 ? unpaidUsers.map(account => (
                  <tr key={account.id}>
                    <td>{account.email}</td>
                    <td>{account.tax_type_name}</td>
                    <td>TZS {parseFloat(account.total_tax_due).toLocaleString()}</td>
                    <td>TZS {parseFloat(account.paid_amount).toLocaleString()}</td>
                    <td className="text-danger fw-bold">
                      TZS {parseFloat(account.outstanding_balance).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${account.status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                        {account.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handlePrintBill(account)}
                        title="Print Bill"
                      >
                        <i className="fas fa-print me-1"></i>Print Bill
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="text-center">No unpaid accounts</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary Footer */}
          {unpaidUsers.length > 0 && (
            <div className="mt-4 p-3 bg-light rounded">
              <h5>Summary</h5>
              <p className="mb-1">Total Unpaid Accounts: {unpaidUsers.length}</p>
              <p className="mb-0">Total Outstanding: TZS {unpaidUsers.reduce((sum, acc) => sum + parseFloat(acc.outstanding_balance || 0), 0).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UnpaidUsers
