import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      heading: 'Product',
      links: [
        { name: 'Signals', href: '#' },
        { name: 'Plays', href: '#' },
        { name: 'Sequences', href: '#' },
        { name: 'AI Agents', href: '#' },
        { name: 'Analytics', href: '#' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { name: 'Customers', href: '#' },
        { name: 'Pricing', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'About', href: '#' },
        { name: 'Security', href: '#' },
      ],
    },
    {
      heading: 'Resources',
      links: [
        { name: 'Use Cases', href: '#' },
        { name: 'Resource Library', href: '#' },
        { name: 'Product Tour', href: '#' },
        { name: 'Documentation', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Explore', href: '#' },
      ],
    },
    {
      heading: 'Free Tools',
      links: [
        { name: 'Email Coach', href: '#' },
        { name: 'AI Pre-Meeting Notes', href: '#' },
        { name: 'AI SEO Ranking', href: '#' },
        { name: 'Comparisons', href: '#' },
        { name: 'Clay', href: '#' },
      ],
    },
  ];

  const legalLinks = [
    { name: 'Terms', href: '#' },
    { name: 'Privacy', href: '#' },
    { name: 'Do Not Sell My Personal Information', href: '#' },
  ];

  return (
    <footer className="bg-white text-black min-h-screen flex flex-col justify-center pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-4 flex flex-col items-center w-full h-full">
        {/* CTA Section */}
        <div className="text-center mb-32">
          <h2 className="text-3xl md:text-4xl  mb-6">Maintain accessibility compliance—not just one-off checks</h2>

          <form className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full max-w-xl mx-auto mb-4">
            <input
              type="email"
              placeholder="What's your work email?"
              className="w-full sm:w-auto flex-1 px-5 py-3 rounded border border-gray-300 bg-transparent text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black text-base"
            />
            <button
              type="submit"
              className="bg-black text-white px-8 py-3 rounded font-medium hover:bg-gray-800 transition-colors text-base"
            >
              Get started
            </button>
          </form>
          <div className="text-sm text-gray-500 mt-2">Set up W3Check in minutes</div>
        </div>

        {/* Link Columns */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-20 mb-24">
          {columns.map((col) => (
            <div key={col.heading}>
              <div className="text-base font-medium mb-7 text-gray-700">{col.heading}</div>
              <ul className="space-y-5">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-gray-600 hover:text-black text-base transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="w-full border-t border-gray-200 pt-8 flex flex-col md:flex-row md:justify-between md:items-center text-base text-gray-500">
          <div className="mb-6 md:mb-0 flex flex-wrap items-center gap-4">
            <span>W3Check © {currentYear}</span>
            {legalLinks.map((link) => (
              <React.Fragment key={link.name}>
                <span className="hidden md:inline">·</span>
                <Link href={link.href} className="hover:text-black transition-colors">{link.name}</Link>
              </React.Fragment>
            ))}
            <span className="hidden md:inline">·</span>
            <span>Powered by Anthropic and Puppetter</span>
          </div>
          <div className="flex items-center gap-6 mt-2 md:mt-0">
            {/* Social icons (placeholders) */}
            <a href="#" aria-label="X" className="hover:text-black"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M17.53 6.47a.75.75 0 0 1 1.06 1.06l-4.72 4.72 4.72 4.72a.75.75 0 1 1-1.06 1.06l-4.72-4.72-4.72 4.72a.75.75 0 1 1-1.06-1.06l4.72-4.72-4.72-4.72A.75.75 0 1 1 7.09 6.47l4.72 4.72 4.72-4.72z"/></svg></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-black"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.37-1.54 2.82-1.54 3.01 0 3.57 1.98 3.57 4.56v4.75z"/></svg></a>
            <a href="#" aria-label="YouTube" className="hover:text-black"><svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.112C19.692 3.5 12 3.5 12 3.5s-7.692 0-9.386.574a2.994 2.994 0 0 0-2.112 2.112C0 7.88 0 12 0 12s0 4.12.502 5.814a2.994 2.994 0 0 0 2.112 2.112C4.308 20.5 12 20.5 12 20.5s7.692 0 9.386-.574a2.994 2.994 0 0 0 2.112-2.112C24 16.12 24 12 24 12s0-4.12-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
