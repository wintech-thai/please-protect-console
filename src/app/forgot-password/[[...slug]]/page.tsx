import React from 'react'
import { Navbar } from '@/components/layout/navbar-clean'
import ForgotPasswordForm from '@/modules/auth/view/forgot-password.view'
const page = () => {
  return (
    <div>
        <Navbar />
        <ForgotPasswordForm />
    </div>
  )
}

export default page