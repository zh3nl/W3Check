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

export default function IssuesGraph() {
  const [tab, setTab] = useState('issues');
  const [view, setView] = useState('occurrences');
  const [period, setPeriod] = useState('6m');

  // SVG chart dimensions
  const width = 900;
  const height = 350;
  const padding = 60;

  // Find min/max for scaling
  const maxY = Math.max(...mockData.map(d => Math.max(d.a, d.aa, d.aria, d.pages)));
  const minY = 0;

  // Y axis scaling
  const yScale = (val: number) => height - padding - ((val - minY) / (maxY - minY)) * (height - 2 * padding);
  // X axis scaling
  const xScale = (i: number) => padding + i * ((width - 2 * padding) / (mockData.length - 1));

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">
      <h2 className="text-xl font-semibold mb-4">Progress over time</h2>
      {/* Tabs and filters */}
      <div className="flex items-center border-b mb-6">
        <button
          className={`px-6 py-2 border-b-2 flex items-center gap-2 text-base font-medium ${tab === 'issues' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('issues')}
        >
          <span className="text-lg">❗</span> History of issues
        </button>
        <button
          className={`px-6 py-2 border-b-2 flex items-center gap-2 text-base font-medium ${tab === 'potential' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('potential')}
        >
          <span className="text-lg">⚠️</span> History of potential issues
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
      {/* Chart */}
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="block">
          {/* Y axis grid lines and labels */}
          {[0.25,0.5,0.75,1].map((p, i) => (
            <g key={i}>
              <line x1={padding} x2={width-padding} y1={yScale(maxY*p)} y2={yScale(maxY*p)} stroke="#E5E7EB" strokeDasharray="4 4" />
              <text x={padding-10} y={yScale(maxY*p)+5} textAnchor="end" fontSize="13" fill="#6B7280">{Math.round(maxY*p).toLocaleString()}</text>
              <text x={width-padding+10} y={yScale(maxY*p)+5} textAnchor="start" fontSize="13" fill="#6B7280">{Math.round((maxY*p)/20).toLocaleString()}</text>
            </g>
          ))}
          {/* X axis labels */}
          {mockData.map((d, i) => (
            <text key={d.date} x={xScale(i)} y={height-padding+20} textAnchor="middle" fontSize="13" fill="#6B7280">{d.date}</text>
          ))}
          {/* Lines */}
          <polyline fill="none" stroke={colors.a} strokeWidth="3" points={mockData.map((d,i)=>`${xScale(i)},${yScale(d.a)}`).join(' ')} />
          <polyline fill="none" stroke={colors.aa} strokeWidth="3" points={mockData.map((d,i)=>`${xScale(i)},${yScale(d.aa)}`).join(' ')} />
          <polyline fill="none" stroke={colors.aria} strokeWidth="3" strokeDasharray="6 4" points={mockData.map((d,i)=>`${xScale(i)},${yScale(d.aria)}`).join(' ')} />
          <polyline fill="none" stroke={colors.pages} strokeWidth="2" strokeDasharray="2 4" points={mockData.map((d,i)=>`${xScale(i)},${yScale(d.pages)}`).join(' ')} />
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2"><span className="w-4 h-1.5 rounded bg-[#C026D3] inline-block"></span> Level A</div>
        <div className="flex items-center gap-2"><span className="w-4 h-1.5 rounded bg-[#6366F1] inline-block"></span> Level AA</div>
        <div className="flex items-center gap-2"><span className="w-4 h-1.5 rounded bg-[#2563EB] inline-block border border-[#2563EB] border-dashed"></span> WAI-ARIA authoring practices</div>
        <div className="flex items-center gap-2"><span className="w-4 h-1.5 rounded bg-[#6B7280] inline-block border border-[#6B7280] border-dashed"></span> Number of pages</div>
      </div>
    </div>
  );
}
