"use client"
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { toast, ToastContainer } from 'react-toastify'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from '@/lib/redux/slices/authSlice'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Schema
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  otp: z
    .string()
    .regex(/^\d+$/, 'OTP must be a number')
    .length(6, { message: "OTP must be 6 digits" }),
})

const Signin = () => {
  const user = useSelector((state) => state.auth.user);
  const router = useRouter();
  const dispatch = useDispatch();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isOtpDisabled, setIsOtpDisabled] = useState(false); // State to manage button disabled status
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      otp: '',
    },
  })

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const email = form.getValues("email");
    const password = form.getValues("password");

    if (!email) {
      toast.error('Please enter your email address.', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    if (!password) {
      toast.error('Please enter your password.', {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    setTimeout(() => {
      setIsOtpDisabled(false); // Re-enable the button after 1 minute
    }, 60000); // 1 minute in milliseconds
    setIsOtpDisabled(true); // Disable the button immediately after sending OTP
    try {
      // Send OTP request

      const response = await axios.post('/api/auth/send-otp', { email, password });
      // console.log('response', response);

      if (response.data[0].status === 200) {
        toast.success('OTP sent successfully!', {
          position: "top-right",
          autoClose: 5000,
        });
        setIsOtpDisabled(true); // Disable the button after sending OTP
      }
      else if (response.data[0].status === 401) {
        toast.error(response.data[0].message, {
          position: "top-right",
          autoClose: 5000,
        });
        setIsOtpDisabled(false); // Re-enable the button if OTP sending fails
      }

    } catch (error) {
      console.error('Error:', error);
      setIsOtpDisabled(false); // Re-enable the button in case of error
      // Handle unexpected errors
      toast.error('An error occurred while sending OTP', {
        position: "top-right",
        autoClose: 5000,
      });
      return; // Ensure the error does not propagate further
    }
  };

  const onSubmit = async (data) => {
    // console.log('Form Submitted:', data)
    const otp = form.getValues("otp");
    if (!otp) {
      toast.error('Please enter your OTP.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
    try {
      // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/signin`, data);
      const response = await axios.post('/api/auth/signin', data);
      // console.log("login_data", response);

      // Check if the response contains token and refreshToken
      const { access_token, refreshToken } = response.data;
      if (!access_token || !refreshToken) {
        throw new Error("Invalid response from server");
      }

      //sending the notification
      toast.success('Login successful!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Set cookies
      Cookies.set("access_token", access_token , { expires: 7 }); // Store access token in cookies for 7 days
      Cookies.set("refreshToken", refreshToken , { expires: 7 }); // Store access token in cookies for 7 days

      // Set user in redux store
      dispatch(setUser(data));

      //Push to home page
      router.push("/");

      if (response.error) {
        // console.log('Error:', response.error);
      }
    }
    catch (error) {
      console.error('Error:', error)
      setIsOtpDisabled(false); // Re-enable the button in case of error
      if (error.response && error.response.status === 401) {
        toast.error(error.response.data.error, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }
  }
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [onSubmit])

  return (
    <div className="max-w-md mt-10">
      <h1 className="text-2xl font-bold mb-6">LOGIN</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input className="focus-within:ring-orange-500" placeholder="Email" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div
                    className={`flex items-center border rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500`}
                  >
                    <input
                      type={passwordVisible ? "text" : "password"}
                      className="flex-1 px-3 py-2 rounded-md outline-none focus:ring-0 focus:border-none"
                      placeholder="Password"
                      {...field}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-white border-l border-gray-300 flex items-center justify-center focus:outline-none"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                    >
                      {passwordVisible ? <FaEye /> : <FaEyeSlash />}
                    </button>
                  </div>
                </FormControl>
                {form.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </FormItem>
            )}
          />


          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OTP</FormLabel>
                <FormControl>
                  <Input className="focus-within:ring-orange-500" type="text" placeholder="OTP" {...field} />
                </FormControl>
                {form.formState.errors.otp && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.otp.message}</p>
                )}
              </FormItem>
            )}
          />

          <Button
            type="button"
            className={`w-full mt-4 cursor-pointer ${isOtpDisabled ? 'opacity-50 cursor-not-allowed' : ''} bg-orange-500`}
            // style={{ backgroundColor: isOtpDisabled ? 'gray' : 'oklch(70.5% 0.213 47.604)' }}
            onClick={(e) => handleSendOtp(e)}
            disabled={isOtpDisabled}
          >
            {isOtpDisabled ? 'Wait 1 minute...' : 'Send OTP'}
          </Button>

          <Button type="submit" className="w-full mt-4 cursor-pointer bg-orange-500">Submit</Button>
        </form>
      </Form>
      <ToastContainer />
    </div>
  )
}

export default Signin