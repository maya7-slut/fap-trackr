import React from 'react';
import { X } from 'lucide-react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar, Cell } from 'recharts';
import { Star } from '../../types';

interface StatsViewProps {
  stars: Star[];
  onClose: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ stars, onClose }) => (
  <div className="min-h-screen pb-24 px-5 pt-8 overflow-y-auto">
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-3xl font-serif text-white">Metrics</h2>
      <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-stone-400"><X size={20}/></button>
    </div>
    <div className="glass-panel p-6 rounded-3xl border border-white/10 h-[50vh]">
       <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stars.map(s => ({name:s.name, xp:s.xp})).sort((a,b)=>b.xp-a.xp).slice(0,10)} layout="vertical">
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" width={100} stroke="#78716c" fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor:'#000', border:'none', borderRadius:'12px'}} />
            <Bar dataKey="xp" fill="#e11d48" radius={[0,4,4,0]} barSize={16}>
              {stars.map((_, i) => <Cell key={i} fill={i<3 ? '#e11d48' : '#881337'} />)}
            </Bar>
          </BarChart>
       </ResponsiveContainer>
    </div>
  </div>
);