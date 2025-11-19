import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PlayerStats } from './types';
import { COLORS } from './constants';

interface StatsChartProps {
  stats: PlayerStats;
  color?: string;
}

export const StatsChart: React.FC<StatsChartProps> = ({ stats, color = COLORS.primary }) => {
  const data = [
    { subject: 'HIZ', A: stats.pace, fullMark: 100 },
    { subject: 'ŞUT', A: stats.shooting, fullMark: 100 },
    { subject: 'PAS', A: stats.passing, fullMark: 100 },
    { subject: 'SÜR', A: stats.dribbling, fullMark: 100 },
    { subject: 'DEF', A: stats.defense, fullMark: 100 },
    { subject: 'FİZ', A: stats.physical, fullMark: 100 },
  ];

  return (
    <div className="w-full h-48 opacity-90 hover:opacity-100 transition-opacity duration-300">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Orbitron' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="İstatistikler"
            dataKey="A"
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};