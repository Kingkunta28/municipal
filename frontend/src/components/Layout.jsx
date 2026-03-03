import { useState } from 'react'
import SideNav from './SideNav'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false)

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen)
  }

  const closeSideNav = () => {
    setIsSideNavOpen(false)
  }

  return (
    <div className="d-flex flex-column vh-100">
      {/* Navbar at the top */}
      <Navbar toggleSideNav={toggleSideNav} isSideNavOpen={isSideNavOpen} />
      
      {/* Main content area with SideNav */}
      <div className="d-flex flex-grow-1">
        {/* SideNav - Desktop - visible on large screens */}
        <div className="d-none d-lg-block" style={{ width: '250px', minWidth: '250px' }}>
          <SideNav />
        </div>
        
        {/* Mobile SideNav - Offcanvas sidebar */}
        <div 
          className={`offcanvas offcanvas-start ${isSideNavOpen ? 'show' : ''}`} 
          tabIndex="-1" 
          id="sideNavOffcanvas"
          style={{ visibility: isSideNavOpen ? 'visible' : 'hidden', width: '250px', boxShadow: 'none', overflow: 'hidden' }}
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Menu</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={closeSideNav}
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body p-0">
            <SideNav closeSideNav={closeSideNav} />
          </div>
        </div>
        
        {/* Backdrop for mobile sidebar */}
        {isSideNavOpen && (
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 z-3 d-lg-none"
            onClick={closeSideNav}
          ></div>
        )}
        
        {/* Main content */}
        <main className="flex-grow-1 p-3 p-lg-4 overflow-auto bg-light">
          <div className="container-fluid">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
