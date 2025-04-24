"use client"
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { set, z } from 'zod'

import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { toast, ToastContainer } from 'react-toastify'
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Schema with confirm password validation
const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

const Signup = ({ setSignIn }) => {
    const user = useSelector((state) => state.auth.user);
    const dispatch = useDispatch();
    const [passwordVisible, setPasswordVisible] = React.useState(false)
    const [confirmPasswordVisible, setConfirmPasswordVisible] = React.useState(false)
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: ''
        }
    })

    const onSubmit = async (data) => {
        // console.log('Signup data:', data)
        try {
            // const response=await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/signup`, data);
            const response = await axios.post('/api/auth/signup', data);
            console.log('reponse:', response);
            toast.success(response.data.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setSignIn((prev)=>!prev)
            if (response.status === 409) {
                toast.error(response.data.error, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
        }
        catch (error) {
            if (error.response && error.response.status === 409) {
                toast.error(error.response.data.message, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            } else {
                toast.error('An error occurred during signups', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
            }
            console.log('Error during signup:', error);
        }
    }

    return (
        <div className="max-w-md mt-10">
            <h1 className="text-2xl font-bold mb-6">REGISTER</h1>
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
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl >
                                    <div className="grid grid-cols-12 border border-gray-200 rounded-md items-center">
                                        <div className='col-span-11'>
                                            <Input type={`${confirmPasswordVisible ? "text" : "password"}`} className="border-0 rounded-0 focus:outline-none" placeholder="Password" {...field} />
                                        </div>
                                        <div className='col-span-1 cursor-pointer' onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                                            {confirmPasswordVisible ? <span className='  '><FaEye /></span> : <span className=' '><FaEyeSlash /></span>}
                                        </div>
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full mt-4 cursor-pointer">Submit</Button>
                    <Button type="button" className="w-full mt-2 cursor-pointer" onClick={() => form.reset()}>Reset</Button>
                </form>
            </Form>
            <ToastContainer />
        </div>
    )
}

export default Signup