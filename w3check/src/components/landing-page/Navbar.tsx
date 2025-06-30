import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import type { User } from '@supabase/supabase-js';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const navItems = [
    { name: 'Pricing', href: '#', hasDropdown: true },
    { name: 'Solutions', href: '#', hasDropdown: true },
    // { name: 'Customers', href: '#', hasDropdown: false },
    // { name: 'Resources', href: '#', hasDropdown: true },
    // { name: 'Company', href: '#', hasDropdown: true },
  ];

  useEffect(() => {
    // Get current user on component mount
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          setUser(null);
          setFirstName('');
        } else if (user) {
          setUser(user);
          // Get first name from user metadata
          const userFirstName = user.user_metadata?.first_name || user.user_metadata?.firstName || '';
          setFirstName(userFirstName);
        } else {
          setUser(null);
          setFirstName('');
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        setUser(null);
        setFirstName('');
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const userFirstName = session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || '';
        setFirstName(userFirstName);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setFirstName('');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Error signing out');
      } else {
        setShowUserMenu(false);
        toast.success('Signed out successfully');
        router.push('/');
      }
    } catch (error) {
      console.error('Error in handleSignOut:', error);
      toast.error('Error signing out');
    }
  };

  const handleDashboard = () => {
    setShowUserMenu(false);
    router.push('/dashboard');
  };

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-emerald-600">W3Check</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium flex items-center"
                >
                  {item.name}
                  {item.hasDropdown && (
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7"></path>
                    </svg>
                  )}
                </Link>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="text-gray-600 px-4 py-2 text-sm font-medium">
                Loading...
              </div>
            ) : user ? (
              // User is signed in - show greeting and user menu
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Hi, {firstName || 'User'}
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {/* User dropdown menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={handleDashboard}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // User is not signed in - show sign in/sign up button
              <Link
                href="/signin"
                className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium border border-transparent"
              >
                Sign In/Sign Up
              </Link>
            )}
            <Link
              href="/demo"
              className="bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2  text-sm font-medium"
            >
              Request Demo
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium"
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/signin"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="bg-teal-600 text-white hover:bg-emerald-700 block px-3 py-2 text-base font-medium"
            >
              Request Demo
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
