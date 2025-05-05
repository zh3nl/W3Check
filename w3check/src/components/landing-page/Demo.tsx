import React from 'react';

export default function Demo() {
  return (
    <div className="relative bg-gray-50 rounded-2xl border border-gray-200 w-full h-[32rem] flex flex-col items-center justify-center shadow-lg">
      {/* Placeholder for demo video or image */}
      <div className="absolute left-6 bottom-6 flex items-center gap-3">
        <button className="bg-black/10 rounded-full p-3 flex items-center justify-center" title="Watch demo video">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" className="text-black"><path d="M8 5v14l11-7L8 5Z" fill="currentColor"/></svg>
        </button>
        <span className="text-black text-lg">Watch Demo<br /><span className="text-gray-600">1 min</span></span>
      </div>
      <div className="w-4/5 h-3/4 bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400 text-xl">[Workflow Demo Placeholder]</span>
      </div>
    </div>
  );
}
