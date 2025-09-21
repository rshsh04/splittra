'use client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function ToasterClient() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="colored"
      limit={3}
    />
  )
}
