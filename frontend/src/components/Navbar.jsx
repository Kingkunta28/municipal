import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = ({ toggleSideNav, isSideNavOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'Administrator'

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-white  border-bottom">
      <div className="container-fluid px-3">
        {/* Mobile toggle button */}
        <button
          className="text-secondary  navbar-toggler me-2"
          type="button"
          onClick={toggleSideNav}
          aria-label="Toggle navigation"
          data-bs-toggle="offcanvas"
          data-bs-target="#sideNavOffcanvas"
        >
          {isSideNavOpen ? (
            <i className="fas fa-times"></i>
          ) : (
            <i className="fas fa-bars"></i>
          )}
        </button>



        {/* Desktop navigation - visible on large screens */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-brand d-flex align-items-center">
            <span className="fw-light text-secondary ">
              <img src="/logo.png" alt="Logo" style={{ width: '30px', height: '30px' }} />
              <span className='ms-2'>West B Municipal Tax System</span></span>
          </div>
          <ul className="navbar-nav  ms-auto align-items-center">
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="text-secondary fas fa-user-circle fs-2"></i>
                {/* <span className="ms-1 text-secondary">{user?.full_name || user?.email}</span> */}
              </a>
              <ul className="dropdown-menu dropdown-menu-end rounded-0 p-0">
                <li>
                  <span className="dropdown-item-text text-center">
                    <small className="text-muted">{user?.role}</small>
                  </span>
                </li>
                <li><span className="dropdown-divider" /></li>
                <li>
                  <button onClick={handleLogout} className="dropdown-item text-danger">
                    <i className="fas fa-sign-out-alt me-2"></i> Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        {/* Mobile navigation - visible on small screens */}
        <div className="d-lg-none">
          <div className="d-flex align-items-center">
            <span className="text-secondary  me-2 d-none d-sm-inline">
              <i className="text-secondary fas fa-user-circle me-2 fs-2"></i>
              {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}
            </span>
            <button onClick={handleLogout} className="btn rounded-0 btn-outline-secondary btn-sm">
              <i className="fs-5 fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
