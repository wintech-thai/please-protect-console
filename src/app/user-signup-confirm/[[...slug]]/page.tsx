import React from 'react'
import { Navbar } from '@/components/layout/navbar-clean'
import UserSignupConfirmView from '@/modules/auth/view/user-signup-confirm.view'

const page = () => {
  return (
    <div>
        <Navbar />
        <UserSignupConfirmView />
    </div>
  )
}

export default page