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
    message: "Passwords does not match",
    path: ["confirmPassword"],
    mode: z.string().min(1, { message: "Mode is required" }),
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
            confirmPassword: '',
            mode: ''
        }
    })

    const onSubmit = async (data) => {
        // // console.log('Signup data:', data)
        try {
            // const response=await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/signup`, data);
            const response = await axios.post('/api/auth/signup', data);
            // console.log('reponse:', response);
            toast.success(response.data.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setSignIn((prev) => !prev)
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
            // console.log('Error during signup:', error);
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
                                    <Input className="focus-within:ring-orange-500" placeholder="Email" {...field} />
                                </FormControl>
                                {form.formState.errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                                )}
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
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <div
                                        className={`flex items-center border rounded-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500`}
                                    >
                                        <input
                                            type={confirmPasswordVisible ? "text" : "password"}
                                            className="flex-1 px-3 py-2 rounded-md outline-none focus:ring-0 focus:border-none"
                                            placeholder="Confirm Password"
                                            {...field}
                                        />
                                        <button
                                            type="button"
                                            className="px-3 py-2 bg-white border-l border-gray-300 flex items-center justify-center focus:outline-none"
                                            onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                                        >
                                            {confirmPasswordVisible ? <FaEye /> : <FaEyeSlash />}
                                        </button>
                                    </div>
                                </FormControl>
                                {form.formState.errors.confirmPassword && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {form.formState.errors.confirmPassword.message}
                                    </p>
                                )}
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='mode'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mode</FormLabel>
                                <FormControl>
                                    <select
                                        {...field}
                                        className="w-full px-3 py-2 border-2 bg-inherit rounded-md focus-within:ring-orange-500"
                                    >
                                        <option value="">Select Mode</option>
                                        <option value="server_mode">Server Mode</option>
                                        {/* <option value="local_mode">Local Mode</option> */}
                                    </select>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full mt-4 cursor-pointer bg-orange-500">Submit</Button>
                    <Button type="button" className="w-full mt-2 cursor-pointer bg-orange-500" onClick={() => form.reset()}>Reset</Button>
                </form>
            </Form>
            <ToastContainer />
        </div>
    )
}

export default Signup