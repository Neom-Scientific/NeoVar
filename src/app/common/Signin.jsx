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
import { FaEye ,FaEyeSlash } from "react-icons/fa";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

// Schema
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  otp: z.string().length(6, { message: "OTP must be 6 digits" }),
  otp: z.string().regex(/^\d+$/, 'OTP must be a number'),
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
    console.log('email', email)
    if (!email) {
      toast.error('Please enter your email address.', {
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
      // Disable the button
      setIsOtpDisabled(true);

      // Simulate sending OTP
      const response = await axios.post('/api/auth/send-otp', { email });
      console.log("otp_response", response);

      // Sending the notification
      toast.success('OTP sent successfully!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Re-enable the button after 1 minute
      setTimeout(() => {
        setIsOtpDisabled(false);
      }, 60000); // 1 minute = 60000 ms
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while sending OTP', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Re-enable the button in case of an error
      setIsOtpDisabled(false);
    }
  }

  const onSubmit = async (data) => {
    console.log('Form Submitted:', data)
    try {
      // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/signin`, data);
      const response = await axios.post('/api/auth/signin', data);
      console.log("login_data", response);

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
      Cookies.set("access_token", access_token);
      Cookies.set("refreshToken", refreshToken);

      // Set user in redux store
      dispatch(setUser(data));

      //Push to home page
      router.push("/");

      if (response.error) {
        console.log('Error:', response.error);
      }
    }
    catch (error) {
      console.error('Error:', error)
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
                  <Input placeholder="Email" {...field} />
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
                <FormControl >
                  <div className="grid grid-cols-12 border border-gray-200 rounded-md items-center">
                    <div className='col-span-11'> 
                      <Input type={`${passwordVisible ? "text" : "password"}`} className="border-0 rounded-0 focus:outline-none" placeholder="Password" {...field} />
                    </div>
                    <div className='col-span-1 cursor-pointer' onClick={() => setPasswordVisible(!passwordVisible)}>
                      {passwordVisible ? <span className='  '><FaEye /></span> : <span className=' '><FaEyeSlash /></span>}
                    </div>
                  </div>
                </FormControl>
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
                  <Input type="text" placeholder="OTP" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="button"
            className={`w-full mt-4 cursor-pointer ${isOtpDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={(e) => handleSendOtp(e)}
            disabled={isOtpDisabled}
          >
            {isOtpDisabled ? 'Wait 1 minute...' : 'Send OTP'}
          </Button>

          <Button type="submit" className="w-full mt-4 cursor-pointer">Submit</Button>
        </form>
      </Form>
      <ToastContainer />
    </div>
  )
}

export default Signin

// "use client"
// import React, { useEffect } from 'react'
// import { useForm } from 'react-hook-form'
// import { zodResolver } from '@hookform/resolvers/zod'
// import { z } from 'zod'

// import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
// import { Input } from '@/components/ui/input'
// import { Button } from '@/components/ui/button'
// import axios from 'axios'
// import { toast, ToastContainer } from 'react-toastify'
// import { useDispatch, useSelector } from 'react-redux'
// import { setUser } from '@/lib/redux/slices/authSlice'
// import { useRouter } from 'next/navigation'
// import Cookies from 'js-cookie'
// import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

// // Schema
// const formSchema = z.object({
//   email: z.string().email(),
//   password: z.string().min(6),
//   otp: z.string().length(6, { message: "OTP must be 6 digits" }),
//   otp: z.string().regex(/^\d+$/, 'OTP must be a number'),
// })

// const Signin = () => {
//   const user = useSelector((state) => state.auth.user);
//   const router = useRouter();
//   const dispatch = useDispatch();
//   const form = useForm({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       email: '',
//       password: '',
//       otp:'',
//     },
//   })

//   const handleSendOtp = async (e) => {
//     e.preventDefault(); 
//     const email = form.getValues("email");
//     console.log('email', email)
//     if (!email) {
//       toast.error('Please enter your email address.', {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//       });
//       return;
//     }
//     try {
//       // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/send-otp`, { email });
//       const response = await axios.post('/api/auth/send-otp', { email });
//       console.log("otp_response", response);

//       //sending the notification
//       toast.success('OTP sent successfully!', {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//       });

//     } catch (error) {
//       console.error('Error:', error)
//       toast.error(error.response.data.message, {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//       });
//       if (error.response && error.response.status === 409) {
//         toast.error(error.response.data.message, {
//           position: "top-right",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           progress: undefined,
//         });
//       }
//       else {
//         toast.error('An error occurred while sending OTP', {
//           position: "top-right",
//           autoClose: 5000,
//           hideProgressBar: false,
//           closeOnClick: true,
//           pauseOnHover: true,
//           draggable: true,
//           progress: undefined,
//         });
//       }
//     }
//   }

//   const onSubmit = async (data) => {
//     console.log('Form Submitted:', data)
//     try {
//       // const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/signin`, data);
//       const response = await axios.post('/api/auth/signin', data);
//       console.log("login_data", response);

//       // Check if the response contains token and refreshToken
//       const { access_token, refreshToken } = response.data;
//       if (!access_token || !refreshToken) {
//         throw new Error("Invalid response from server");
//       }

//       //sending the notification
//       toast.success('Login successful!', {
//         position: "top-right",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//       });

//       // Set cookies
//       Cookies.set("access_token", access_token);
//       Cookies.set("refreshToken", refreshToken);

//       // Set user in redux store
//       dispatch(setUser(data));

//       //Push to home page
//       router.push("/");

//       if (response.error) {
//         console.log('Error:', response.error);
//       }
//     }
//     catch (error) {
//       console.error('Error:', error)
//     }
//   }
//   useEffect(() => {
//     if (user) {
//       router.push("/");
//     }
//   }, [onSubmit])

//   return (
//     <div className="max-w-md mt-10">
//       <h1 className="text-2xl font-bold mb-6">LOGIN</h1>
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//           <FormField
//             control={form.control}
//             name="email"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Email</FormLabel>
//                 <FormControl>
//                   <Input placeholder="Email" {...field} />
//                 </FormControl>
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="password"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>Password</FormLabel>
//                 <FormControl>
//                   <Input type="password" placeholder="Password" {...field} />
//                 </FormControl>
//               </FormItem>
//             )}
//           />
//           <FormField
//             control={form.control}
//             name="otp"
//             render={({ field }) => (
//               <FormItem>
//                 <FormLabel>OTP</FormLabel>
//                 <FormControl>
//                   <Input type="text" placeholder="OTP" {...field}/>
//                 </FormControl>
//               </FormItem>
//             )}
//           />

//           <Button type ="button" className="w-full mt-4 cursor-pointer" onClick={(e)=>handleSendOtp(e)}>Send Otp</Button>

//           <Button type="submit" className="w-full mt-4 cursor-pointer">Submit</Button>
//         </form>
//       </Form>
//       <ToastContainer />
//     </div>
//   )
// }

// export default Signin