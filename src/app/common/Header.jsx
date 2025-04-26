"use client"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import logo from "../../../public/logo.png"
import Image from "next/image"
import React, { useEffect } from "react"
import { MdAccountCircle } from "react-icons/md"
import { TbLogout } from "react-icons/tb"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useDispatch, useSelector } from "react-redux"
import { logout } from "@/lib/redux/slices/authSlice"
import { useRouter } from "next/navigation"

const Header = () => {
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)
    const router = useRouter()

    const handleLogout = () => {
        console.log('user', user)
        dispatch(logout())
    }

    useEffect(() => {
        if (!user) {
            router.push('/auth')
        }
    }, [user])

    return (
        <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6 relative">
            {/* Logo for Responsive View */}
            <div className="absolute top-2 right-2 flex items-center lg:hidden py-3">
                <Image src={logo} height={20} width={20} alt="NeoVar" />
                <span className="ms-2 text-lg text-transparent bg-clip-text inline-block bg-gradient-to-r from-orange-600 to-blue-400">NeoVar</span>
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                        <MenuIcon className="h-6 w-6" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <Link href="#" className="mr-6 hidden lg:flex justify-center items-center" prefetch={false}>
                        <Image src={logo} height={30} width={30} alt="NeoVar" />
                        <span className="ms-3 text-2xl text-transparent bg-clip-text inline-block bg-gradient-to-r from-orange-600 to-blue-400">NeoVar</span>
                    </Link>
                    <div className="grid gap-2 py-6 p-2">
                        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">My Account</h2>
                        <ul className="max-w-md space-y-1 text-gray-500 list-none list-inside dark:text-gray-400">
                            <li>
                                <div className="flex items-center cursor-pointer" onClick={handleLogout}>
                                    Logout <TbLogout className="text-red-800 ms-2 font-bold text-xl" />
                                </div>
                            </li>
                        </ul>
                    </div>
                </SheetContent>
            </Sheet>

            <Link href="/" className="mr-6 hidden lg:flex items-center" prefetch={false}>
                <Image src={logo} height={30} width={30} alt="NeoVar" />
                <span className="ms-3 text-2xl text-transparent bg-clip-text inline-block bg-gradient-to-r from-orange-600 to-blue-400">NeoVar</span>
            </Link>

            <div className="ml-auto hidden lg:flex w-full items-center justify-end">
                <Link
                    href="#"
                    className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-xl font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
                >
                    <DropdownMenu className="bg-white">
                        <DropdownMenuTrigger>
                            <MdAccountCircle className="text-3xl cursor-pointer text-orange-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-30 border border-black rounded-md">
                            <DropdownMenuLabel className="bg-white">My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer bg-white" onClick={handleLogout}>
                                Logout <TbLogout className="text-red-800 font-bold" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </Link>
            </div>
        </header>
    )
}

function MenuIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
    )
}

export default Header