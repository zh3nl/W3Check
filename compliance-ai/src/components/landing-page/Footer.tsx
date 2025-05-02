import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    products: [
      { name: 'Assistant', href: '/assistant' },
      { name: 'Vault', href: '/vault' },
      { name: 'Knowledge', href: '/knowledge' },
      { name: 'Workflows', href: '/workflows' }
    ],
    about: [
      { name: 'Customers', href: '/customers' },
      { name: 'Security', href: '/security' },
      { name: 'Company', href: '/company' },
      { name: 'Blog', href: '/blog' },
      { name: 'Newsroom', href: '/newsroom' },
      { name: 'Careers', href: '/careers' }
    ],
    resources: [
      { name: 'Legal', href: '/legal' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Press Kit', href: '/press-kit' },
      { name: 'Your Privacy Choices', href: '/privacy-choices' }
    ],
    follow: [
      { name: 'LinkedIn', href: 'https://linkedin.com' },
      { name: 'X', href: 'https://x.com' }
    ]
  };

  return (
    <footer className="bg-black text-white pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-8">
        {/* Top Section with Large Text */}
        <div className="mb-24 flex items-center justify-between">
          <h2 className="text-3xl md:text-4xl md:text-5xl font-serif max-w-3xl">
            Unlock the Power of AI for Your Compliance Needs
          </h2>
          <div>
            <button className="bg-white text-black px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Request a Demo
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 md:gap-y-0 mb-24">
          {/* Products Column */}
          <div>
            <h3 className="text-sm font-medium mb-6">Products</h3>
            <ul className="space-y-4">
              {footerLinks.products.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h3 className="text-sm font-medium mb-6">About</h3>
            <ul className="space-y-4">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-medium mb-6">Resources</h3>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow Column */}
          <div>
            <h3 className="text-sm font-medium mb-6">Follow</h3>
            <ul className="space-y-4">
              {footerLinks.follow.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm" target="_blank" rel="noopener noreferrer">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-12 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
            <div className="text-2xl font-serif">H</div>
            <div className="text-sm text-gray-400">
              © {currentYear} W3Check Corp.
              <span className="block md:inline md:ml-2">All rights reserved.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
