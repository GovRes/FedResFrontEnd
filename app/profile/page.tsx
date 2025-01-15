'use client'
import { useAuthenticator } from "@aws-amplify/ui-react";
import Login from "../login/page";
import Profile from "../components/profile/Profile";

export default function ProfilePage() {
    const { authStatus } = useAuthenticator(context => [context.authStatus]);
    return(
    <div className="content">
      {authStatus === 'configuring' && 'Loading...'}
      {authStatus !== 'authenticated' ? <Login /> : <Profile />}
    </div>
  )
}