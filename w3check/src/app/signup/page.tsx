'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Navbar from '@/components/landing-page/Navbar';
import { supabase } from '@/lib/supabase';
import { AuthError, PostgrestError } from '@supabase/supabase-js';

interface PasswordRequirement {
  label: string;
  met: boolean;
  check: (password: string) => boolean;
}

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const passwordRequirements: PasswordRequirement[] = [
    {
      label: 'At least 8 characters',
      met: false,
      check: (password) => password.length >= 8,
    },
    {
      label: 'Contains lowercase letter',
      met: false,
      check: (password) => /[a-z]/.test(password),
    },
    {
      label: 'Contains uppercase letter',
      met: false,
      check: (password) => /[A-Z]/.test(password),
    },
    {
      label: 'Contains number',
      met: false,
      check: (password) => /[0-9]/.test(password),
    },
    {
      label: 'Contains special character',
      met: false,
      check: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const [requirements, setRequirements] = useState(passwordRequirements);

  useEffect(() => {
    setRequirements(
      passwordRequirements.map(req => ({
        ...req,
        met: req.check(password),
      }))
    );
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all password requirements are met
    if (!requirements.every(req => req.met)) {
      toast.error('Please meet all password requirements');
      return;
    }

    setIsLoading(true);
    
    try {
      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData?.user) {
        // Create a profile record in the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
            },
          ]);

        if (profileError) {
          throw profileError;
        }

        toast.success('Account created successfully!');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof AuthError || error instanceof PostgrestError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to right, #f7f9fd 0%, #f7f9fd 100%)' }}>
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-gray-600 mt-2">Join W3Check today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-black"
                  placeholder="Create a password"
                />
                <div className="mt-2 space-y-1">
                  {requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <span className={`mr-2 ${requirement.met ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {requirement.met ? '✓' : '×'}
                      </span>
                      <span className={requirement.met ? 'text-gray-600' : 'text-gray-400'}>
                        {requirement.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-emerald-600 hover:text-emerald-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-emerald-600 hover:text-emerald-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/signin" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 