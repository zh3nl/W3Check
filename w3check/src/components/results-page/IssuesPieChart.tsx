import React, { useState } from 'react';

// Mock data for the graph
const mockData = [
  { date: '11/24/2024', a: 100000, aa: 120000, aria: 200000, pages: 50000 },
  { date: '12/9/2024', a: 110000, aa: 130000, aria: 210000, pages: 50000 },
  { date: '12/25/2024', a: 120000, aa: 140000, aria: 220000, pages: 50000 },
  { date: '1/10/2025', a: 130000, aa: 150000, aria: 230000, pages: 50000 },
  { date: '1/25/2025', a: 130000, aa: 150000, aria: 230000, pages: 50000 },
  { date: '2/10/2025', a: 90000, aa: 110000, aria: 180000, pages: 30000 },
  { date: '2/26/2025', a: 90000, aa: 110000, aria: 180000, pages: 30000 },
  { date: '3/13/2025', a: 90000, aa: 110000, aria: 180000, pages: 30000 },
  { date: '3/29/2025', a: 90000, aa: 110000, aria: 180000, pages: 30000 },
  { date: '4/14/2025', a: 90000, aa: 110000, aria: 180000, pages: 30000 },
];

const colors = {
  a: '#C026D3', // magenta
  aa: '#6366F1', // blue
  aria: '#2563EB', // dark blue
  pages: '#6B7280', // gray
};

function getPieSegments(data: { a: number; aa: number; aria: number; pages: number }) {
  const total = data.a + data.aa + data.aria + data.pages;
  const segments = [
    { key: 'a', value: data.a, color: colors.a },
    { key: 'aa', value: data.aa, color: colors.aa },
    { key: 'aria', value: data.aria, color: colors.aria },
    { key: 'pages', value: data.pages, color: colors.pages },
  ];
  let startAngle = 0;
  return segments.map(seg => {
    const angle = (seg.value / total) * 360;
    const endAngle = startAngle + angle;
    const largeArc = angle > 180 ? 1 : 0;
    // Pie chart center and radius
    const r = 80, cx = 100, cy = 100;
    const x1 = cx + r * Math.cos((Math.PI * startAngle) / 180);
    const y1 = cy + r * Math.sin((Math.PI * startAngle) / 180);
    const x2 = cx + r * Math.cos((Math.PI * endAngle) / 180);
    const y2 = cy + r * Math.sin((Math.PI * endAngle) / 180);
    const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;
    const result = { ...seg, d };
    startAngle = endAngle;
    return result;
  });
}

export default function IssuesPieChart() {
  const [tab, setTab] = useState('issues');
  const [view, setView] = useState('occurrences');
  const [period, setPeriod] = useState('6m');

  // Use the latest data point for the pie chart
  const latest = mockData[mockData.length - 1];
  const pieSegments = getPieSegments(latest);

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8 text-gray-800">
      <h2 className="text-xl font-semibold mb-4">Distribution of Issues</h2>
      {/* Tabs and filters */}
      <div className="flex items-center border-b mb-6">
        <button
          className={`px-6 py-2 border-b-2 flex items-center gap-2 text-base font-medium ${tab === 'issues' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('issues')}
        >
          <span className="text-lg"></span> History of issues
        </button>
        <button
          className={`px-6 py-2 border-b-2 flex items-center gap-2 text-base font-medium ${tab === 'potential' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('potential')}
        >
          <span className="text-lg"></span> History of potential issues
        </button>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <button className={`px-4 py-1 rounded-full border ${view === 'issues' ? 'bg-gray-100 border-blue-600 text-blue-700' : 'bg-white border-gray-300 text-gray-500'}`} onClick={() => setView('issues')}>Issues</button>
        <button className={`px-4 py-1 rounded-full border ${view === 'occurrences' ? 'bg-gray-100 border-blue-600 text-blue-700' : 'bg-white border-gray-300 text-gray-500'}`} onClick={() => setView('occurrences')}>Occurrences</button>
        <select className="ml-4 px-2 py-1 border rounded text-gray-700" value={period} onChange={e => setPeriod(e.target.value)} title="Select time period">
          <option value="6m">Last 6 months</option>
          <option value="12m">Last 12 months</option>
        </select>
        <button className="ml-auto px-4 py-1 rounded border border-gray-300 bg-white text-gray-700 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"><path d="M8 17l4 4 4-4m-4-5v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Export to CSV
        </button>
      </div>
      {/* Pie Chart */}
      <div className="flex flex-col items-center">
        <svg width={200} height={200} viewBox="0 0 200 200">
          {pieSegments.map(seg => (
            <path key={seg.key} d={seg.d} fill={seg.color} />
          ))}
        </svg>
        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#C026D3] inline-block"></span> Level A</div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#6366F1] inline-block"></span> Level AA</div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#2563EB] inline-block border border-[#2563EB] border-dashed"></span> WAI-ARIA authoring practices</div>
          <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-[#6B7280] inline-block border border-[#6B7280] border-dashed"></span> Number of pages</div>
        </div>
      </div>
    </div>
  );
}
