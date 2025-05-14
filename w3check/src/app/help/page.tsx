'use client';

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white py-16 px-4">
      <form className="w-full max-w-lg mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-10">Contact Us</h1>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Your name</label>
          <input
            type="text"
            placeholder="Ex.: John Doe"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Your email</label>
          <input
            type="email"
            placeholder="Ex.: info@mail.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Subject</label>
          <select className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" title="Select a subject">
            <option>Just wanted to say &quot;Hi&quot;</option>
            <option>Support Request</option>
            <option>Feedback</option>
            <option>Other</option>
          </select>
        </div>
        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-2">Write your question here:</label>
          <textarea
            rows={5}
            placeholder="Type your question..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <button
          type="button"
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-lg text-lg transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
