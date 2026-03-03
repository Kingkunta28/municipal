import Swal from 'sweetalert2'

// Default configuration for SweetAlert2
const defaultConfig = {
  confirmButtonColor: '#3085d6',
  cancelButtonColor: '#d33',
  confirmButtonText: 'OK',
  cancelButtonText: 'Cancel',
  buttonsStyling: true,
}

// Success alert
export const showSuccess = (title, text) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title: title || 'Success',
    text: text || '',
  })
}

// Error alert
export const showError = (title, text) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title: title || 'Error',
    text: text || 'Something went wrong!',
  })
}

// Warning alert
export const showWarning = (title, text) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title: title || 'Warning',
    text: text || '',
  })
}

// Info alert
export const showInfo = (title, text) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title: title || 'Info',
    text: text || '',
  })
}

// Confirmation dialog
export const showConfirm = (title, text, confirmButtonText, cancelButtonText) => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'question',
    title: title || 'Confirm',
    text: text || 'Are you sure?',
    showCancelButton: true,
    confirmButtonText: confirmButtonText || 'Yes',
    cancelButtonText: cancelButtonText || 'Cancel',
  })
}

// Toast notification (auto closes with timer progress bar)
export const showToast = (icon, title, duration = 3000) => {
  return Swal.fire({
    position: 'top-end',
    icon: icon || 'success',
    title: title || '',
    showConfirmButton: false,
    timer: duration,
    timerProgressBar: true,
    toast: true,
  })
}

export default Swal
