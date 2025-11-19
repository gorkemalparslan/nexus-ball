import React from 'react';
import { Player } from './types';
import { StatsChart } from './StatsChart';
import { User, Zap, Coins, Trash2, Activity } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  compact?: boolean;
  onSell?: () => void;
  sellValue?: number;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, compact = false, onSell, sellValue }) => {
  // Determine visual styles based on rarity
  const rarityConfig = {
    'Sıradan': { border: 'border-slate-700', shadow: 'shadow-none', bg: 'from-slate-800/50', text: 'text-slate-400' },
    'Nadir': { border: 'border-cyan-500/50', shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]', bg: 'from-cyan-900/30', text: 'text-cyan-400' },
    'Efsanevi': { border: 'border-amber-500/50', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]', bg: 'from-amber-900/30', text: 'text-amber-400' },
    'Glitch': { border: 'border-rose-500/50', shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.25)]', bg: 'from-rose-900/30', text: 'text-rose-400' },
  };

  const style = rarityConfig[player.rarity];

  return (
    <div className={`relative group overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-b ${style.bg} to-slate-900/90 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${style.shadow} flex flex-col h-full`}>
      
      {/* Glitch Effect Overlay for Glitch rarity */}
      {player.rarity === 'Glitch' && (
        <div className="absolute inset-0 bg-rose-500/5 mix-blend-overlay pointer-events-none animate-pulse"></div>
      )}

      {/* Header */}
      <div className="p-5 flex justify-between items-start border-b border-white/5 relative z-10">
        <div>
            <h3 className="font-display text-lg font-bold tracking-wide text-white truncate w-40 drop-shadow-md">{player.name}</h3>
            <div className="flex items-center gap-2 mt-1">
                <div className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold uppercase tracking-wider text-white/70">
                    {player.position}
                </div>
                <span className="text-[10px] text-slate-400 uppercase">{player.origin}</span>
            </div>
        </div>
        <div className="flex flex-col items-end">
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-1">
                 <span className="font-display text-xl font-black italic text-white">
                    {Math.round((player.stats.pace + player.stats.shooting + player.stats.passing + player.stats.dribbling + player.stats.defense + player.stats.physical) / 6)}
                </span>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${style.text}`}>
                {player.rarity}
            </span>
        </div>
      </div>

      {/* Body */}
      {!compact && (
        <div className="flex-1 flex flex-col relative z-10">
            <div className="p-2">
                <StatsChart stats={player.stats} color={player.avatarColor} />
            </div>
            
            <div className="px-5 pb-5 flex-1 flex flex-col justify-end">
                <p className="text-xs text-slate-400 italic leading-relaxed pl-3 border-l-2 border-white/10 mb-4 line-clamp-2">
                    "{player.backstory}"
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-black/20 rounded p-2 flex items-center gap-2 border border-white/5">
                        <Zap size={12} className="text-cyan-400" />
                        <span className="text-xs text-slate-300 font-mono">Yaş: {player.age}</span>
                    </div>
                    <div className="bg-black/20 rounded p-2 flex items-center gap-2 border border-white/5">
                        <User size={12} className="text-purple-400" />
                        <span className="text-xs text-slate-300 font-mono">#{player.id.slice(-4)}</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                   <span className="text-xs text-slate-500 font-medium">Haftalık Maliyet</span>
                   <div className="flex items-center gap-1.5 text-rose-400 font-bold font-mono text-sm bg-rose-500/10 px-2 py-1 rounded">
                      <Activity size={12} /> {player.salary} VK
                   </div>
                </div>
            </div>
        </div>
      )}
      
      {compact && (
         <div className="p-5 pt-0 flex-1 flex flex-col relative z-10">
             <div className="grid grid-cols-3 gap-2 mt-4 mb-4">
                <div className="text-center bg-white/5 rounded-lg p-2 border border-white/5">
                    <div className="text-[9px] text-slate-500 font-bold tracking-wider mb-1">HIZ</div>
                    <div className="text-sm font-bold text-white">{player.stats.pace}</div>
                </div>
                <div className="text-center bg-white/5 rounded-lg p-2 border border-white/5">
                    <div className="text-[9px] text-slate-500 font-bold tracking-wider mb-1">ŞUT</div>
                    <div className="text-sm font-bold text-white">{player.stats.shooting}</div>
                </div>
                <div className="text-center bg-white/5 rounded-lg p-2 border border-white/5">
                    <div className="text-[9px] text-slate-500 font-bold tracking-wider mb-1">FİZ</div>
                    <div className="text-sm font-bold text-white">{player.stats.physical}</div>
                </div>
             </div>
             
             <div className="mt-auto flex items-center justify-between bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                 <span className="text-[10px] text-slate-400 uppercase tracking-wider">Maaş</span>
                 <span className="text-xs font-mono font-bold text-rose-400">-{player.salary} VK</span>
             </div>
         </div>
      )}

      {/* Sell Action Footer */}
      {onSell && sellValue !== undefined && (
        <div className="p-3 bg-black/40 border-t border-white/5 mt-auto relative z-20">
            <button 
                onClick={onSell}
                className="w-full py-2.5 bg-slate-800 hover:bg-rose-900/80 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-white rounded-lg flex items-center justify-center gap-2 transition-all text-xs font-bold uppercase tracking-wider group"
            >
                <Trash2 size={14} className="group-hover:text-rose-400 transition-colors" /> 
                Feshet <span className="text-emerald-400 ml-1 group-hover:text-white">(+{sellValue} VK)</span>
            </button>
        </div>
      )}
    </div>
  );
};