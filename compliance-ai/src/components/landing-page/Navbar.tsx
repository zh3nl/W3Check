import React, { useState } from 'react';
import Link from 'next/link';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Pricing', href: '#', hasDropdown: true },
    { name: 'Solutions', href: '#', hasDropdown: true },
    // { name: 'Customers', href: '#', hasDropdown: false },
    // { name: 'Resources', href: '#', hasDropdown: true },
    // { name: 'Company', href: '#', hasDropdown: true },
  ];

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-emerald-500">W3Check</span>
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
            <Link
              href="/signin"
              className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium border border-transparent"
            >
              Sign In
            </Link>
            <Link
              href="/demo"
              className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2  text-sm font-medium"
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
              className="bg-teal-600 text-white hover:bg-teal-700 block px-3 py-2 text-base font-medium"
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
