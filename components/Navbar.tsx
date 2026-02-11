'use client';

import Link from 'next/link';
import { Search, Bell, Menu, X, User } from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="navbar-gradient text-white sticky top-0 z-50 shadow-lg backdrop-blur-md bg-opacity-90">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:scale-105 transition-transform">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                            <Search className="w-5 h-5 text-blue-600" />
                        </div>
                        Lost&Found
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className={`text-sm font-medium hover:text-blue-200 transition-colors ${isActive('/') ? 'text-white' : 'text-blue-100'}`}>Home</Link>
                        <Link href="/report/lost" className={`text-sm font-medium hover:text-blue-200 transition-colors ${isActive('/report/lost') ? 'text-white' : 'text-blue-100'}`}>Report Lost</Link>
                        <Link href="/report/found" className={`text-sm font-medium hover:text-blue-200 transition-colors ${isActive('/report/found') ? 'text-white' : 'text-blue-100'}`}>Report Found</Link>
                        <Link href="/matching" className={`text-sm font-medium hover:text-blue-200 transition-colors ${isActive('/matching') ? 'text-white' : 'text-blue-100'}`}>Matching</Link>
                        <Link href="/search" className={`text-sm font-medium hover:text-blue-200 transition-colors ${isActive('/search') ? 'text-white' : 'text-blue-100'}`}>Search</Link>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        {session && <NotificationDropdown />}

                        {session ? (
                            <div className="relative group">
                                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-all">
                                    <User className="w-4 h-4" />
                                    <span className="text-sm font-medium">{session.user?.name || 'Profile'}</span>
                                </Link>
                                <div className="absolute right-0 top-full pt-2 w-48 hidden group-hover:block animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-white rounded-xl shadow-xl py-2 text-gray-800">
                                        <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50 text-sm">My Profile</Link>
                                        {session.user.isAdmin && (
                                            <Link href="/admin" className="block px-4 py-2 hover:bg-gray-50 text-sm">Dashboard</Link>
                                        )}
                                        <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm">Sign Out</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login" className="px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-full transition-colors">Login</Link>
                                <Link href="/register" className="px-4 py-2 bg-white text-blue-600 rounded-full text-sm font-bold hover:bg-blue-50 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Register</Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        {session && <NotificationDropdown />}
                        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 animate-in slide-in-from-top-2">
                        <div className="flex flex-col gap-2">
                            <Link href="/" className="px-4 py-2 hover:bg-white/10 rounded-lg" onClick={() => setIsOpen(false)}>Home</Link>
                            <Link href="/report/lost" className="px-4 py-2 hover:bg-white/10 rounded-lg" onClick={() => setIsOpen(false)}>Report Lost</Link>
                            <Link href="/report/found" className="px-4 py-2 hover:bg-white/10 rounded-lg" onClick={() => setIsOpen(false)}>Report Found</Link>
                            <Link href="/matching" className="px-4 py-2 hover:bg-white/10 rounded-lg" onClick={() => setIsOpen(false)}>Matching</Link>
                            <Link href="/search" className="px-4 py-2 hover:bg-white/10 rounded-lg" onClick={() => setIsOpen(false)}>Search</Link>
                            <hr className="border-white/20 my-2" />
                            {session ? (
                                <>
                                    <Link href="/profile" className="px-4 py-2 hover:bg-white/10 rounded-lg flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                        <User className="w-4 h-4" /> My Profile
                                    </Link>
                                    {session.user.isAdmin && (
                                        <Link href="/admin" className="px-4 py-2 hover:bg-white/10 rounded-lg flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                            Dashboard
                                        </Link>
                                    )}
                                    <button onClick={() => { signOut(); setIsOpen(false); }} className="px-4 py-2 hover:bg-white/10 rounded-lg text-left w-full text-red-200">Sign Out</button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="px-4 py-2 hover:bg-white/10 rounded-lg" onClick={() => setIsOpen(false)}>Login</Link>
                                    <Link href="/register" className="px-4 py-2 hover:bg-white/10 rounded-lg" onClick={() => setIsOpen(false)}>Register</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
