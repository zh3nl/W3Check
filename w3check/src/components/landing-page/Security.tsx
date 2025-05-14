import React from 'react';

export default function Security() {
  return (
    <section className="w-full py-20 px-4 bg-[#fafbfc]">
      {/* <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        {/* Left: Text */}
        {/* <div className="flex-1">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Multilayered security</h2>
          <p className="text-lg text-gray-500 mb-4 max-w-xl">
            At W3Check, your file security and privacy are our top priority. Trust our security measures to not only protect your information but also empower your team with valuable insights.
          </p>
        </div> */}
        {/* Right: Shield Image */}
        {/* <div className="flex-1 flex justify-center items-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 flex items-center justify-center"> */}
            {/* Placeholder SVG for shield */}
            {/* <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
              <rect width="180" height="180" rx="32" fill="#F3F4F6" />
              <g>
                <path d="M90 30L140 50V90C140 120 110 140 90 150C70 140 40 120 40 90V50L90 30Z" fill="#2563EB"/>
                <path d="M90 30L140 50V90C140 120 110 140 90 150V30Z" fill="#1E40AF"/>
                <circle cx="90" cy="90" r="32" fill="#fff"/>
                <rect x="78" y="80" width="24" height="32" rx="6" fill="#2563EB"/>
                <rect x="86" y="96" width="8" height="16" rx="4" fill="#fff"/>
                <circle cx="90" cy="92" r="4" fill="#fff"/>
              </g>
            </svg>
          </div>
        </div>
      </div> */}
      {/* Features Row */}
      <div className="max-w-7xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="mb-4">
            <span className="inline-block bg-blue-50 p-2 rounded-full">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#6366F1"/><path d="M8 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
          <div className="font-bold text-lg mb-2 text-gray-900">Gold Standard Encryption</div>
          <div className="text-gray-500 text-sm">Our technology uses AES-256 encryption for data at rest and SSL/ TLS 1.2 for data in transit, with regular key rotation to minimize risk.</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="mb-4">
            <span className="inline-block bg-blue-50 p-2 rounded-full">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#6366F1"/><path d="M12 8v4l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
          <div className="font-bold text-lg mb-2 text-gray-900">Identity Protection</div>
          <div className="text-gray-500 text-sm">Each repository features a hashed ID to ensure your identity and data are protected from breaches and unauthorized access.</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="mb-4">
            <span className="inline-block bg-blue-50 p-2 rounded-full">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#6366F1"/><path d="M12 8v4l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
          <div className="font-bold text-lg mb-2 text-gray-900">Access Control</div>
          <div className="text-gray-500 text-sm">MFA is mandatory for all access to our systems, adding an additional layer of security beyond just passwords.</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
          <div className="mb-4">
            <span className="inline-block bg-blue-50 p-2 rounded-full">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" fill="#6366F1"/><path d="M12 8v4l3 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
          <div className="font-bold text-lg mb-2 text-gray-900">Real Time Monitoring</div>
          <div className="text-gray-500 text-sm">We use EDR solutions to provide real-time monitoring and automated responses to endpoint threats, enabling swift containment and remediation.</div>
        </div>
      </div>
    </section>
  );
}
