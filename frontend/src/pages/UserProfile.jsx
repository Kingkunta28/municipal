import { useState, useEffect } from 'react'
import api from '../api/axios'

const UserProfile = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editProfileData, setEditProfileData] = useState({})
  const [editProfileError, setEditProfileError] = useState('')
  const [editProfileSuccess, setEditProfileSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/')
      setProfile(response.data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = async (e) => {
    e.preventDefault()
    setEditProfileError('')
    setEditProfileSuccess('')

    try {
      await api.patch('/profile/', editProfileData)
      setEditProfileSuccess('Profile updated successfully!')
      fetchProfile()
      setShowEditProfile(false)
    } catch (error) {
      setEditProfileError(error.response?.data?.detail || 'Failed to update profile')
    }
  }

  const startEditProfile = () => {
    if (!profile) return
    
    setEditProfileData({
      first_name: profile.first_name || '',
      middle_name: profile.middle_name || '',
      last_name: profile.last_name || '',
      mobile_phone: profile.mobile_phone || '',
      ward: profile.ward || '',
      street_village: profile.street_village || '',
      house_number: profile.house_number || '',
      property_location: profile.property_location || '',
      business_name: profile.business_name || ''
    })
    setShowEditProfile(true)
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
      <div className="">
    <div className="container-fluid p-3 border border-dash rounded-0 bg-light">
      <h2 className="fw-light">Profile</h2>
      
      {/* User Profile Section */}
        <div className="card-body">
          {showEditProfile ? (
            <form onSubmit={handleEditProfile}>
              {editProfileError && <div className="alert alert-danger">{editProfileError}</div>}
              {editProfileSuccess && <div className="alert alert-success">{editProfileSuccess}</div>}
              
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.first_name}
                    onChange={(e) => setEditProfileData({...editProfileData, first_name: e.target.value})}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Middle Name</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.middle_name}
                    onChange={(e) => setEditProfileData({...editProfileData, middle_name: e.target.value})}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.last_name}
                    onChange={(e) => setEditProfileData({...editProfileData, last_name: e.target.value})}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Mobile Phone</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.mobile_phone}
                    onChange={(e) => setEditProfileData({...editProfileData, mobile_phone: e.target.value})}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Ward</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.ward}
                    onChange={(e) => setEditProfileData({...editProfileData, ward: e.target.value})}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Street/Village</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.street_village}
                    onChange={(e) => setEditProfileData({...editProfileData, street_village: e.target.value})}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">House Number</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.house_number}
                    onChange={(e) => setEditProfileData({...editProfileData, house_number: e.target.value})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Property Location</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.property_location}
                    onChange={(e) => setEditProfileData({...editProfileData, property_location: e.target.value})}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Business Name</label>
                  <input
                    type="text"
                    className="form-control rounded-0"
                    value={editProfileData.business_name}
                    onChange={(e) => setEditProfileData({...editProfileData, business_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-3">
                <button type="submit" className="btn btn-success rounded-0 me-2 "> <i className="fas fa-save me-2 "></i>Save</button>
                <button type="button" className="btn btn-danger rounded-0" onClick={() => setShowEditProfile(false)}>
                  <i className="fas fa-times me-2 "></i>Cancel</button>
              </div>
            </form>
          ) : (
            
            <div className="row ">
              {editProfileError && <div className="alert alert-danger">{editProfileError}</div>}
              {editProfileSuccess && <div className="alert alert-success">{editProfileSuccess}</div>}
               <div className="my-3">
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-secondary rounded-0" onClick={startEditProfile}>
              <i className="fas fa-edit me-2 "></i>Edit Profile
            </button>
          </div>
        </div>
              <div className="col-md-4 mb-3">
                <p className="text-muted mb-1 fw-bold">Full Name</p>
                <p className=" bg-transparent">{profile?.full_name}</p>
              </div>
              <div className="col-md-4 mb-3">
                <p className="text-muted mb-1 fw-bold">Email</p>
                <p className=" bg-transparent">{profile?.email}</p>
              </div>
              <div className="col-md-4 mb-3">
                <p className="text-muted mb-1 fw-bold">NIDA Number</p>
                <p className=" bg-transparent">{profile?.national_id_number}</p>
              </div>
              <div className="col-md-4 mb-3">
                <p className="text-muted mb-1 fw-bold">Address</p>
                <p className=" bg-transparent">{profile?.ward}, {profile?.street_village}</p>
              </div>
              <div className="col-md-4 mb-3">
                <p className="text-muted mb-1 fw-bold">Mobile Phone</p>
                <p className=" bg-transparent">{profile?.mobile_phone}</p>
              </div>
              <div className="col-md-4 mb-3">
                <p className="text-muted mb-1 fw-bold">Taxpayer Type</p>
                <p className=" bg-transparent">{profile?.taxpayer_type}</p>
              </div>
              <div className="col-md-4 mb-3">
                <p className="text-muted mb-1 fw-bold">Business Name</p>
                <p className=" bg-transparent">{profile?.business_name || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
