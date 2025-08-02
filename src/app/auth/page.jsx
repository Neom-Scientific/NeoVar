"use client"
import { useState } from 'react'
import SideImage from "../auth/NEOM.png"
import Image from 'next/image'
import Signin from "../common/Signin"
import Signup from "../common/Signup"

const page = () => {
  const [SignIn, setSignIn] = useState(true)
  const handleSignIn = () => {
    setSignIn(!SignIn)
  }
  return (
    <div className="grid h-screen grid-cols-1 md:grid-cols-12">
      {/* Left Section (Hidden on Mobile) */}
      <div className="hidden md:block md:col-span-8">
        <Image
          src={SideImage}
          className="w-full h-full"
          alt="side image"
        />
      </div>

      {/* Right Section */}
      <div className="col-span-1 md:col-span-4 bg-white p-5 md:p-10 flex flex-col justify-center items-center relative">
        {/* Image at Top-Left or Top-Right for Mobile View */}
        <div className="absolute top-2 left-2 md:hidden">
          <Image
            src={SideImage}
            alt="side image"
            width={100} // Adjust size for mobile
            height={100}
            className="object-contain"
          />
        </div>

        {/* Sign In / Sign Up Form */}
        <div className="w-full max-w-sm">
          {SignIn ? <Signin /> : <Signup setSignIn={setSignIn} />}
        </div>

        {/* Toggle Between Sign In and Sign Up */}
        <div className="flex justify-center mt-5">
          {SignIn ? (
            <p className="text-sm text-center">
              Don't have an account?{" "}
              <span
                className="text-blue-500 cursor-pointer"
                onClick={handleSignIn}
              >
                Register
              </span>
            </p>
          ) : (
            <p className="text-sm text-center">
              Already have an account?{" "}
              <span
                className="text-blue-500 cursor-pointer"
                onClick={handleSignIn}
              >
                LogIn
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default page