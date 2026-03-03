import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const SideNav = ({ closeSideNav }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path ? 'active' : ''

  const isAdmin = user?.role === 'Administrator'

  const handleLogout = () => {
    logout()
  }

  const handleNavClick = () => {
    if (closeSideNav) {
      closeSideNav()
    }
  }

  return (
    <div className="d-flex flex-column bg-white border-end " style={{ width: '250px', minHeight: '100%', maxHeight: '100%' }}>
      {/* Header */}
      <div className="my-2 text-center">
       <i className="fas fa-user me-2 fs-2"></i><br/>
        <small className="text-muted">{user?.full_name || user?.email}</small>
        <br/>
        <span className="badge bg-secondary rounded-0">{user?.role}</span>
      </div><hr className="my-0" />
      
      {/* Menu */}
      <div className="  ">
        {isAdmin ? (
          <>
          <Link 
            to="/admin" 
            className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/admin') ? 'bg-secondary text-white' : 'text-dark'}`}
            onClick={handleNavClick}
          >
            <i className="fas fa-chart-line me-3"></i>
            Dashboard
          </Link>
           <Link 
            to="/users" 
            className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/users') ? 'bg-secondary text-white' : 'text-dark'}`}
            onClick={handleNavClick}
          >
            <i className="fas fa-users me-3"></i>
            User Management
          </Link>
          
           <Link 
            to="/unpaid" 
            className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/unpaid') ? 'bg-secondary text-white' : 'text-dark'}`}
             onClick={() => setActiveTab('unpaid')}
          >
            <i className="fas fa-money-bill me-3"></i>
            Payments
          </Link>
          
          </>

          
          
          
        ) : (
          <>
            <Link 
              to="/dashboard" 
              className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/dashboard') ? 'bg-secondary text-white' : 'text-dark'}`}
              onClick={handleNavClick}
            >
              <i className="fas fa-chart-bar me-3"></i>
              Dashboard
            </Link>
            <Link 
              to="/profile" 
              className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/profile') ? 'bg-secondary text-white' : 'text-dark'}`}
              onClick={handleNavClick}
            >
              <i className="fas fa-user me-3"></i>
              Profile
            </Link>
            <Link 
              to="/payment" 
              className={`d-flex align-items-center px-3 py-2 text-decoration-none ${isActive('/payment') ? 'bg-secondary text-white' : 'text-dark'}`}
              onClick={handleNavClick}
            >
              <i className="fas fa-credit-card me-3"></i>
              Payments
            </Link>
          </>
        )}
      </div>
      
    </div>
  )
}

export default SideNav
