import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import TaxSummary from './pages/TaxSummary'
import UserProfile from './pages/UserProfile'
import Payment from './pages/Payment'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import UnpaidUsers from './pages/UnpaidUsers'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="app">
      {user ? (
        <Layout>
          <div className="container">
            <Routes>
              <Route path="/summary" element={
                <ProtectedRoute allowedRoles={['Taxpayer', 'Municipal Officer']}>
                  <TaxSummary />
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['Taxpayer', 'Municipal Officer']}>
                  <UserProfile />
                </ProtectedRoute>
              } />
              
              <Route path="/payment" element={
                <ProtectedRoute allowedRoles={['Taxpayer', 'Municipal Officer']}>
                  <Payment />
                </ProtectedRoute>
              } />
              
<Route path="/admin" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              <Route path="/unpaid" element={
                <ProtectedRoute allowedRoles={['Administrator']}>
                  <UnpaidUsers />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['Taxpayer', 'Municipal Officer']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/" element={<Navigate to={user.role === 'Administrator' ? '/admin' : '/dashboard'} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </div>
  )
}

export default App
