import React from 'react';
import { Player } from './types';
import { StatsChart } from './StatsChart';
import { User, Zap, Coins, Trash2 } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  compact?: boolean;
  onSell?: () => void;
  sellValue?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, compact = false, onSell, sellValue }) => {
  const rarityColor = {
    'Sıradan': 'border-slate-600 shadow-slate-900',
    'Nadir': 'border-cyan-500 shadow-cyan-500/20',
    'Efsanevi': 'border-amber-400 shadow-amber-400/30',
    'Glitch': 'border-rose-500 shadow-rose-500/40 animate-pulse',
  };

  const bgGradient = {
    'Sıradan': 'bg-gradient-to-b from-slate-800 to-slate-900',
    'Nadir': 'bg-gradient-to-b from-cyan-900/30 to-slate-900',
    'Efsanevi': 'bg-gradient-to-b from-amber-900/30 to-slate-900',
    'Glitch': 'bg-gradient-to-b from-rose-900/30 to-slate-900',
  };

  return (
    <div className={`relative group overflow-hidden rounded-xl border ${rarityColor[player.rarity]} ${bgGradient[player.rarity]} backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full`}>
      
      {/* Header */}
      <div className="p-4 flex justify-between items-start border-b border-white/5">
        <div>
            <h3 className="font-display text-lg font-bold tracking-wider text-white truncate w-48">{player.name}</h3>
            <p className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1">
               <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: player.avatarColor }}></span>
               {player.position} | {player.origin}
            </p>
        </div>
        <div className="flex flex-col items-end">
            <span className="font-display text-2xl font-black italic text-white/90">
                {Math.round((player.stats.pace + player.stats.shooting + player.stats.passing + player.stats.dribbling + player.stats.defense + player.stats.physical) / 6)}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${player.rarity === 'Glitch' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {player.rarity}
            </span>
        </div>
      </div>

      {/* Body */}
      {!compact && (
        <div className="flex-1 flex flex-col">
            <div className="p-2">
                <StatsChart stats={player.stats} color={player.avatarColor} />
            </div>
            
            <div className="px-4 pb-4 flex-1 flex flex-col justify-end">
                <p className="text-xs text-slate-400 italic leading-relaxed border-l-2 border-white/10 pl-2 mb-3">
                    "{player.backstory}"
                </p>
                <div className="flex justify-between text-slate-300 text-xs font-mono">
                    <div className="flex items-center gap-1"><Zap size={12} /> Yaş: {player.age}</div>
                    <div className="flex items-center gap-1"><User size={12} /> NO: {player.id.slice(-4)}</div>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center">
                   <span className="text-xs text-slate-500">Haftalık Maaş</span>
                   <div className="flex items-center gap-1 text-emerald-400 font-bold font-mono text-sm">
                      <Coins size={12} /> {player.salary} VK
                   </div>
                </div>
            </div>
        </div>
      )}
      
      {compact && (
         <div className="p-4 pt-0 flex-1">
             <div className="grid grid-cols-3 gap-2 mt-2 mb-2">
                <div className="text-center bg-white/5 rounded p-1">
                    <div className="text-[10px] text-slate-500">HIZ</div>
                    <div className="text-sm font-bold">{player.stats.pace}</div>
                </div>
                <div className="text-center bg-white/5 rounded p-1">
                    <div className="text-[10px] text-slate-500">ŞUT</div>
                    <div className="text-sm font-bold">{player.stats.shooting}</div>
                </div>
                <div className="text-center bg-white/5 rounded p-1">
                    <div className="text-[10px] text-slate-500">FİZ</div>
                    <div className="text-sm font-bold">{player.stats.physical}</div>
                </div>
             </div>
             <div className="flex items-center justify-between bg-black/20 px-2 py-1 rounded">
                 <span className="text-[10px] text-slate-400">Maaş</span>
                 <span className="text-xs font-mono text-emerald-400">{player.salary} VK</span>
             </div>
         </div>
      )}

      {/* Sell Action Footer */}
      {onSell && sellValue !== undefined && (
        <div className="p-2 bg-slate-900/80 border-t border-white/5 mt-auto">
            <button 
                onClick={onSell}
                className="w-full py-2 bg-rose-900/30 hover:bg-rose-800/50 border border-rose-900/50 hover:border-rose-500/50 text-rose-400 hover:text-rose-200 rounded flex items-center justify-center gap-2 transition-all text-xs font-bold uppercase tracking-wider"
            >
                <Trash2 size={14} /> Feshet (+{sellValue} VK)
            </button>
        </div>
      )}
    </div>
  );
};