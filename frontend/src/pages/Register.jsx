import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    // User credentials
    email: '',
    password: '',
    password_confirm: '',
    
    // Personal Details
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    mobile_phone: '',
    
    // Identification
    national_id_number: '',
    
    // Address
    ward: '',
    street_village: '',
    house_number: '',
    
    // Taxpayer/Property Details
    taxpayer_type: '',
    property_location: '',
    business_name: '',
    
    // Declaration
    declaration: false
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    // Password confirm
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match'
    }
    
    // Required fields
    const requiredFields = [
      'first_name', 'last_name', 'gender', 'date_of_birth',
      'mobile_phone', 'national_id_number', 'ward', 'street_village',
      'taxpayer_type', 'property_location'
    ]
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required'
      }
    })
    
    // Business name required for Business/Organization
    if (formData.taxpayer_type === 'Business' || formData.taxpayer_type === 'Organization') {
      if (!formData.business_name) {
        newErrors.business_name = 'Business name is required for Business or Organization type'
      }
    }
    
    // Declaration
    if (!formData.declaration) {
      newErrors.declaration = 'You must confirm that the information provided is true and correct'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    
    if (!validate()) {
      return
    }
    
    setLoading(true)

    try {
      await register(formData)
      setSuccess('Registration successful! Redirecting...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (err) {
      const responseErrors = err.response?.data
      if (responseErrors) {
        // Handle API validation errors
        const apiErrors = {}
        Object.keys(responseErrors).forEach(key => {
          apiErrors[key] = Array.isArray(responseErrors[key]) 
            ? responseErrors[key][0] 
            : responseErrors[key]
        })
        setErrors(apiErrors)
      } else {
        setErrors({ general: 'Registration failed. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-4" style={{ backgroundColor: '#f1f1f1' }}>
      <div className="card rounded-0 border-0" style={{ maxWidth: '800px', width: '100%' }}>
        <div className="card-body p-4">
           <div className="text-center ">
            <img src="/logo.png" alt="Logo" style={{ width: '80px', height: '75px' }} />
          </div>
          <h4 className="text-center mb-3 display-6">Registration</h4>
          
          {errors.general && <div className="alert alert-danger">{errors.general}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            {/* Personal Details Section */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Personal Details</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className={`form-control rounded-0 ${errors.first_name ? 'is-invalid' : ''}`}
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                  {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Middle Name</label>
                  <input
                    type="text"
                    name="middle_name"
                    className="form-control rounded-0"
                    value={formData.middle_name}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className={`form-control rounded-0 ${errors.last_name ? 'is-invalid' : ''}`}
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                  {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Gender *</label>
                  <select
                    name="gender"
                    className={`form-select rounded-0 ${errors.gender ? 'is-invalid' : ''}`}
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <option value="" selected disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    className={`form-control rounded-0 ${errors.date_of_birth ? 'is-invalid' : ''}`}
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                  {errors.date_of_birth && <div className="invalid-feedback">{errors.date_of_birth}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    name="mobile_phone"
                    className={`form-control rounded-0 ${errors.mobile_phone ? 'is-invalid' : ''}`}
                    value={formData.mobile_phone}
                    onChange={handleChange}
                    placeholder="+255712345678"
                  />
                  {errors.mobile_phone && <div className="invalid-feedback">{errors.mobile_phone}</div>}
                </div>
              </div>
            </div>

            {/* Identification Section */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Identification</h5>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">National ID Number / NIDA Number *</label>
                  <input
                    type="text"
                    name="national_id_number"
                    className={`form-control rounded-0 ${errors.national_id_number ? 'is-invalid' : ''}`}
                    value={formData.national_id_number}
                    onChange={handleChange}
                  />
                  {errors.national_id_number && <div className="invalid-feedback">{errors.national_id_number}</div>}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Address</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Ward *</label>
                  <input
                    type="text"
                    name="ward"
                    className={`form-control rounded-0 ${errors.ward ? 'is-invalid' : ''}`}
                    value={formData.ward}
                    onChange={handleChange}
                  />
                  {errors.ward && <div className="invalid-feedback">{errors.ward}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Street / Village *</label>
                  <input
                    type="text"
                    name="street_village"
                    className={`form-control rounded-0 ${errors.street_village ? 'is-invalid' : ''}`}
                    value={formData.street_village}
                    onChange={handleChange}
                  />
                  {errors.street_village && <div className="invalid-feedback">{errors.street_village}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">House Number</label>
                  <input
                    type="text"
                    name="house_number"
                    className="form-control rounded-0"
                    value={formData.house_number}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Taxpayer/Property Details Section */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Taxpayer / Property Details</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Taxpayer Type *</label>
                  <select
                    name="taxpayer_type"
                    className={`form-select ${errors.taxpayer_type ? 'is-invalid' : ''}`}
                    value={formData.taxpayer_type}
                    onChange={handleChange}
                  >
                    <option value="">Select Type</option>
                    <option value="Business">Business</option>
                    <option value="Organization">Organization</option>
                  </select>
                  {errors.taxpayer_type && <div className="invalid-feedback">{errors.taxpayer_type}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Business Name</label>
                  <input
                    type="text"
                    name="business_name"
                    className={`form-control rounded-0 ${errors.business_name ? 'is-invalid' : ''}`}
                    value={formData.business_name}
                    onChange={handleChange}
                    disabled={!formData.taxpayer_type || formData.taxpayer_type === 'Individual'}
                  />
                  {errors.business_name && <div className="invalid-feedback">{errors.business_name}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Property Location *</label>
                  <input type="text"
                    name="property_location"
                    className={`form-control rounded-0 ${errors.property_location ? 'is-invalid' : ''}`}
                    value={formData.property_location}
                    onChange={handleChange}
                    rows="2"
                  />
                  {errors.property_location && <div className="invalid-feedback">{errors.property_location}</div>}
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Security</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control rounded-0 ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    name="password"
                    className={`form-control rounded-0 ${errors.password ? 'is-invalid' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    name="password_confirm"
                    className={`form-control rounded-0 ${errors.password_confirm ? 'is-invalid' : ''}`}
                    value={formData.password_confirm}
                    onChange={handleChange}
                  />
                  {errors.password_confirm && <div className="invalid-feedback">{errors.password_confirm}</div>}
                </div>
              </div>
            </div>

            {/* Declaration Section */}
            <div className="mb-4">
              <h5 className="border-bottom pb-2 mb-3">Declaration</h5>
              <div className="form-check">
                <input
                  type="checkbox"
                  name="declaration"
                  className={`form-check-input ${errors.declaration ? 'is-invalid' : ''}`}
                  checked={formData.declaration}
                  onChange={handleChange}
                  id="declarationCheck"
                />
                <label className="form-check-label" htmlFor="declarationCheck">
                  I confirm that the information provided is true and correct.
                </label>
                {errors.declaration && <div className="invalid-feedback">{errors.declaration}</div>}
              </div>
            </div>
<div className='text-center'>
<button type="submit" className="btn btn-primary rounded-0 w-50" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
</div>
            
          </form>
          
          <p className="text-center mt-3 mb-0">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
