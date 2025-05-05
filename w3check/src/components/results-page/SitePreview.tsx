import React from 'react';

export default function SitePreview({ url }: { url?: string }) {
  return (
    <div className="w-full h-96 bg-gray-100 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
      {url ? (
        <iframe
          src={url}
          title="Website Preview"
          className="w-full h-96 rounded-lg border-none"
          style={{ pointerEvents: 'none' }}
        />
      ) : (
        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
      )}
    </div>
  );
}
