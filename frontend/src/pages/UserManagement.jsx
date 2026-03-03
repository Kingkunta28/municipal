import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { showConfirm, showSuccess, showError } from '../utils/swal'

const UserManagement = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersRes = await api.get('/admin/users/')
      setUsers(usersRes.data.results || usersRes.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    try {
      const response = await api.get(`/admin/users/?search=${searchTerm}`)
      setUsers(response.data.results || response.data)
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const handleToggleStatus = async (user) => {
    const isActive = user.account_status === 'Active'
    const newStatus = isActive ? 'Inactive' : 'Active'
    const actionLabel = isActive ? 'Deactivate' : 'Activate'

    const result = await showConfirm(
      `${actionLabel} User`,
      `Are you sure you want to ${actionLabel.toLowerCase()} "${user.email}"?`,
      `Yes, ${actionLabel}`,
      'Cancel'
    )
    if (!result.isConfirmed) return

    setTogglingId(user.id)
    try {
      await api.patch(`/admin/users/${user.id}/status/`, { account_status: newStatus })
      showSuccess(
        `User ${actionLabel}d`,
        `${user.email} has been ${actionLabel.toLowerCase()}d successfully.`
      )
      fetchUsers()
    } catch (error) {
      showError(`${actionLabel} Failed`, error.response?.data?.error || `Failed to ${actionLabel.toLowerCase()} user.`)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteUser = async (user) => {
    const result = await showConfirm(
      'Delete User',
      `Are you sure you want to delete "${user.email}"? This action cannot be undone.`,
      'Yes, Delete',
      'Cancel'
    )
    if (!result.isConfirmed) return

    setDeletingId(user.id)
    try {
      await api.delete(`/admin/users/${user.id}/delete/`)
      showSuccess('User Deleted', `${user.email} has been deleted successfully.`)
      fetchUsers()
    } catch (error) {
      showError('Delete Failed', error.response?.data?.error || 'Failed to delete user.')
    } finally {
      setDeletingId(null)
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
      <h2 className="mb-3 fw-light">User Management</h2>
      
      <div className=" border-0 ">
        <div className="card-body bg-transparent">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-3">
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control rounded-0"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ maxWidth: '300px' }}
              />
              <button type="submit" className="btn btn-primary rounded-0">Search</button>
            </div>
          </form>
          
          <div className="table-responsive tbl-transparent">
            <table className="table table-bordered table-hover">
              <thead>
                <tr className='text-center'>
                  <th>#</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account Status</th>
                  <th>Last Login</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td className='text-center'>
                      <span className={`badge rounded-0 ${user.account_status === 'Active' ? 'bg-success' : 'bg-danger'}`}>
                        {user.account_status}
                      </span>
                    </td>
                    <td>{user.last_login_time ? new Date(user.last_login_time).toLocaleString() : 'Never'}</td>
                    <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                    <td>
                      {currentUser?.id !== user.id ? (
                        <div className="d-flex gap-1 flex-wrap">
                          <button
                            className={`btn btn-sm rounded-0 ${user.account_status === 'Active' ? 'btn-warning' : 'btn-success'}`}
                            onClick={() => handleToggleStatus(user)}
                            disabled={togglingId === user.id}
                            title={user.account_status === 'Active' ? 'Deactivate user' : 'Activate user'}
                          >
                            {togglingId === user.id ? (
                              <><span className="spinner-border spinner-border-sm me-1"></span>Updating...</>
                            ) : user.account_status === 'Active' ? (
                              <><i className="fas fa-ban me-1"></i>Deactivate</>
                            ) : (
                              <><i className="fas fa-check-circle me-1 "></i>Activate</>
                            )}
                          </button>
                          <button
                            className="btn btn-danger btn-sm rounded-0"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deletingId === user.id}
                            title="Delete user"
                          >
                            {deletingId === user.id ? (
                              <><span className="spinner-border spinner-border-sm me-1"></span>Deleting...</>
                            ) : (
                              <><i className="fas fa-trash me-1"></i>Delete</>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted small"></span>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="text-center">No users found</td>
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

export default UserManagement
