import React, { useState } from 'react';
import { LayoutDashboard, Telescope, Users, PlayCircle, Zap, Trophy, AlertTriangle, Terminal, BookOpen, CheckCircle2, Coins, Wallet, Timer, TrendingUp, Activity, Shield, XCircle } from 'lucide-react';
import { Player, GameView, Position, MatchResult, Tactic } from './types';
import { INITIAL_SQUAD, COLORS } from './constants';
import { generatePlayerProfile, simulateMatch } from './geminiService';
import { PlayerCard } from './PlayerCard';

const SCOUT_COST = 50;
const PAYDAY_INTERVAL = 3; // Salary paid every 3 matches

export default function App() {
  const [currentView, setCurrentView] = useState<GameView>(GameView.DASHBOARD);
  const [squad, setSquad] = useState<Player[]>(INITIAL_SQUAD);
  const [credits, setCredits] = useState<number>(1500); 
  const [matchesPlayed, setMatchesPlayed] = useState<number>(0);
  
  // Scouting State
  const [isScouting, setIsScouting] = useState(false);
  const [scoutedPlayer, setScoutedPlayer] = useState<Player | null>(null);
  const [scoutError, setScoutError] = useState<string | null>(null);

  // Match State
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedTactic, setSelectedTactic] = useState<Tactic>(Tactic.ALL_OUT_ATTACK);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [paydayMessage, setPaydayMessage] = useState<string | null>(null);

  // --- ECONOMY LOGIC ---

  const calculatePlayerValue = (player: Player) => {
    const avg = (player.stats.pace + player.stats.shooting + player.stats.passing + player.stats.dribbling + player.stats.defense + player.stats.physical) / 6;
    return Math.round((Math.pow(avg, 3) / 400) / 10) * 10;
  };

  const calculateSalary = (stats: any, rarity: string) => {
    const avg = (stats.pace + stats.shooting + stats.passing + stats.dribbling + stats.defense + stats.physical) / 6;
    
    let multiplier = 1;
    if (rarity === 'Nadir') multiplier = 1.3;
    if (rarity === 'Efsanevi') multiplier = 1.8;
    if (rarity === 'Glitch') multiplier = 2.5;

    // Base salary curve
    const baseSalary = (Math.pow(avg, 2) / 100) * 1.5;
    return Math.round(baseSalary * multiplier);
  };

  const getTotalWeeklyWage = () => {
    return squad.reduce((acc, player) => acc + player.salary, 0);
  };

  // --- HANDLERS ---

  const handleScout = async (position?: Position) => {
    if (credits < SCOUT_COST) {
        setScoutError(`Yetersiz Veri Kredisi. Gözlemci ağı için ${SCOUT_COST} VK gerekli.`);
        return;
    }
    
    setIsScouting(true);
    setScoutedPlayer(null);
    setScoutError(null);
    setCredits(prev => prev - SCOUT_COST);
    
    try {
      // Artificial delay to prevent flickering (minimum 2 seconds)
      const [profile] = await Promise.all([
        generatePlayerProfile(position),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);

      const salary = calculateSalary(profile.stats, profile.rarity);
      
      const newPlayer: Player = {
        ...profile,
        id: crypto.randomUUID(),
        avatarColor: profile.position === Position.FORWARD ? COLORS.accent : profile.position === Position.DEFENDER ? COLORS.primary : COLORS.secondary,
        salary: salary
      };
      setScoutedPlayer(newPlayer);
    } catch (e: any) {
      setScoutError(`Gözlemci ağı hatası: ${e.message || 'Bağlantı koptu.'}`);
      setCredits(prev => prev + SCOUT_COST); // Refund
    } finally {
      setIsScouting(false);
    }
  };

  const handleSignPlayer = () => {
    if (!scoutedPlayer) return;

    const cost = calculatePlayerValue(scoutedPlayer);
    
    if (credits < cost) {
      setScoutError(`Yetersiz bakiye! Bu oyuncuyu imzalamak için ${cost} VK gerekiyor.`);
      return;
    }

    setCredits(prev => prev - cost);
    setSquad(prev => [scoutedPlayer, ...prev]);
    setScoutedPlayer(null);
    setCurrentView(GameView.SQUAD);
  };

  const handleSellPlayer = (player: Player) => {
    const value = calculatePlayerValue(player);
    const sellValue = Math.floor(value * 0.7);

    if (window.confirm(`${player.name} için sözleşme feshini onaylıyor musun? Kulüp kasasına ${sellValue} VK geri iade edilecek.`)) {
        setSquad(prev => prev.filter(p => p.id !== player.id));
        setCredits(prev => prev + sellValue);
        setPaydayMessage(`Sözleşme feshedildi. Kasa girişi: +${sellValue} VK`);
        // Auto clear message after 3 seconds
        setTimeout(() => setPaydayMessage(null), 3000);
    }
  };

  const handleSimulateMatch = async () => {
    setIsSimulating(true);
    setMatchResult(null);
    setPaydayMessage(null);
    setScoutError(null); // Clear previous errors
    
    try {
      // Artificial delay for match simulation (minimum 2 seconds)
      const [result] = await Promise.all([
        simulateMatch(squad, selectedTactic),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);

      setMatchResult(result);
      
      let earnings = 0;
      if (result.winner === 'home') earnings = 400;
      else if (result.winner === 'draw') earnings = 150;
      else earnings = 75;
      
      setCredits(prev => prev + earnings);
      setMatchesPlayed(prev => prev + 1);

      // Payday Logic
      const nextMatchCount = matchesPlayed + 1;
      if (nextMatchCount % PAYDAY_INTERVAL === 0) {
        const totalWages = getTotalWeeklyWage();
        setCredits(prev => prev - totalWages);
        setPaydayMessage(`OPERASYON GİDERLERİ: Kadro maaşları ödendi (-${totalWages} VK).`);
      }

    } catch (e: any) {
      console.error("Match Simulation Failed:", e);
      setScoutError(`Simülasyon hatası: ${e.message || 'Bağlantı kesildi.'}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // --- COMPONENTS ---

  const NavButton = ({ id, icon: Icon, label }: { id: GameView, icon: any, label: string }) => (
    <button 
        onClick={() => setCurrentView(id)}
        className={`relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 overflow-hidden group ${currentView === id ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
    >
        {currentView === id && (
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30"></div>
        )}
        <Icon size={18} className={`relative z-10 transition-transform group-hover:scale-110 ${currentView === id ? 'text-cyan-400' : ''}`} />
        <span className="relative z-10 font-display text-sm font-bold tracking-wide hidden md:block">{label}</span>
    </button>
  );

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-700">
      
      {/* Welcome Panel - Hero */}
      <div className="md:col-span-8 p-8 rounded-3xl glass-panel relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
            <Trophy size={180} className="text-cyan-400" />
        </div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl"></div>
        
        <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-3 tracking-tight relative z-10">
            Nexus Ligi <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Aktif</span>
        </h2>
        <p className="text-slate-400 max-w-lg text-lg relative z-10 mb-8 font-light leading-relaxed">
            Kulübün operasyonel durumu stabil. Bir sonraki fikstür için taktiksel veriler hazır.
        </p>
        
        <div className="flex flex-wrap gap-4 relative z-10">
            <button 
                onClick={() => setCurrentView(GameView.MATCH)}
                className="px-8 py-4 bg-white text-black rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105 transition-all flex items-center gap-3"
            >
                <PlayCircle size={22} />
                MAÇ BAŞLAT
            </button>
            <button 
                onClick={() => setCurrentView(GameView.SCOUTING)}
                className="px-8 py-4 glass-button rounded-xl font-bold text-white hover:bg-white/10 flex items-center gap-3"
            >
                <Telescope size={22} />
                GÖZLEMCİ AĞI
            </button>
        </div>
      </div>

      {/* Finance Panel - Compact */}
      <div className="md:col-span-4 p-6 rounded-3xl glass-panel flex flex-col justify-between relative overflow-hidden">
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
         
         <div>
             <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <Wallet size={20} />
                </div>
                <span className="font-display font-bold text-slate-200 uppercase tracking-wider text-sm">Bütçe Durumu</span>
             </div>
             
             <div className="text-5xl font-display font-bold text-white mb-1 tracking-tighter">
                {credits}
             </div>
             <div className="text-emerald-500 text-sm font-bold font-mono flex items-center gap-1 mb-6">
                <TrendingUp size={14} />
                AKTİF BAKİYE (VK)
             </div>
         </div>

         <div className="space-y-4">
             <div className="p-3 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                 <div className="flex justify-between text-sm mb-1">
                     <span className="text-slate-400">Haftalık Maaşlar</span>
                     <span className="text-rose-400 font-mono font-bold">-{getTotalWeeklyWage()} VK</span>
                 </div>
                 <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
                     <div className="h-full bg-rose-500 w-1/3"></div>
                 </div>
             </div>
             
             <div className="flex justify-between items-center text-sm text-slate-400">
                 <span>Ödeme Günü</span>
                 <span className="text-cyan-400 font-mono font-bold flex items-center gap-2">
                    <Timer size={14} />
                    {PAYDAY_INTERVAL - (matchesPlayed % PAYDAY_INTERVAL)} MAÇ
                 </span>
             </div>
         </div>
      </div>

      {/* Featured Players */}
      <div className="md:col-span-12 mt-4">
        <div className="flex justify-between items-end mb-6">
            <h3 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                <div className="w-1 h-8 bg-cyan-500 rounded-full"></div>
                Öne Çıkan Operatifler
            </h3>
            <button onClick={() => setCurrentView(GameView.SQUAD)} className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">Tümünü Gör &rarr;</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {squad.slice(0, 3).map(player => (
                <PlayerCard key={player.id} player={player} />
            ))}
        </div>
      </div>
    </div>
  );

  const renderScouting = () => (
    <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
        <div className="text-center mb-12 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/20 blur-3xl -z-10"></div>
            <h2 className="text-5xl font-display font-bold text-white mb-4 neon-text">Küresel Tarama</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
                Yasaklı veritabanlarına erişim sağla. Yetenekli oyuncuları bul ve kadrona kat. 
                <span className="block mt-2 text-sm bg-slate-900/50 inline-block px-3 py-1 rounded-full border border-slate-700">
                    Tarama Maliyeti: <span className="text-emerald-400 font-bold">{SCOUT_COST} VK</span>
                </span>
            </p>
        </div>

        {!scoutedPlayer && !isScouting && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[Position.FORWARD, Position.MIDFIELDER, Position.DEFENDER, Position.GOALKEEPER].map((pos) => (
                    <button 
                        key={pos}
                        onClick={() => handleScout(pos)}
                        disabled={credits < SCOUT_COST}
                        className="group relative p-1 rounded-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:-translate-y-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative h-full glass-panel rounded-xl p-8 flex flex-col items-center gap-4 hover:bg-slate-800/50 transition-colors">
                            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:border-cyan-500 transition-all shadow-lg shadow-black/50">
                                <Telescope className="text-slate-400 group-hover:text-cyan-400" size={24} />
                            </div>
                            <span className="font-display font-bold text-lg text-white">{pos}</span>
                            <span className="text-xs text-slate-500 font-mono group-hover:text-cyan-400">BAĞLANTI KUR &rarr;</span>
                        </div>
                    </button>
                ))}
            </div>
        )}

        {scoutError && (
            <div className="max-w-md mx-auto p-4 bg-rose-500/10 border border-rose-500/30 backdrop-blur-md text-rose-200 rounded-xl flex items-center gap-3 mb-8 animate-in shake shadow-lg shadow-rose-900/20">
                <AlertTriangle size={20} className="text-rose-500" />
                <span className="font-medium">{scoutError}</span>
                <button onClick={() => setScoutError(null)} className="ml-auto hover:bg-rose-500/20 p-1 rounded"><XCircle size={16}/></button>
            </div>
        )}

        {isScouting && (
            <div className="flex flex-col items-center justify-center h-80 gap-8">
                <div className="relative w-32 h-32">
                    <div className="absolute inset-0 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-r-2 border-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
                    <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-cyan-400 animate-pulse">
                        TARANIYOR
                    </div>
                </div>
                <div className="font-mono text-cyan-400 text-sm tracking-widest animate-pulse text-center">
                    VERİ AKIŞI SAĞLANIYOR...<br/>
                    <span className="text-slate-600 text-xs">Biyometrik veriler çözümleniyor</span>
                </div>
            </div>
        )}

        {scoutedPlayer && (
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center animate-in zoom-in-95 duration-500">
                <div className="w-full max-w-md perspective-1000">
                    <div className="transform transition-transform hover:rotate-y-2">
                        <PlayerCard player={scoutedPlayer} />
                    </div>
                </div>
                
                <div className="flex flex-col gap-4 w-full md:w-80">
                    <div className="glass-panel p-6 rounded-2xl w-full border-t border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
                        
                        <h3 className="text-xl font-display text-white mb-4 flex items-center gap-2">
                            <CheckCircle2 className="text-emerald-500" size={20} /> 
                            Teklif Hazır
                        </h3>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg border border-white/5">
                                <span className="text-slate-400 text-sm">Piyasa Değeri</span>
                                <span className="text-xl font-bold text-white font-mono">{calculatePlayerValue(scoutedPlayer)} VK</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-black/30 rounded-lg border border-white/5">
                                <span className="text-slate-400 text-sm">Maaş Talebi</span>
                                <span className="text-sm font-bold text-rose-400 font-mono">-{scoutedPlayer.salary} VK/3 Maç</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleSignPlayer}
                            disabled={credits < calculatePlayerValue(scoutedPlayer)}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 group"
                        >
                            {credits >= calculatePlayerValue(scoutedPlayer) ? (
                                <>İMZALA <span className="group-hover:translate-x-1 transition-transform">&rarr;</span></>
                            ) : (
                                <>BAKİYE YETERSİZ</>
                            )}
                        </button>
                        
                        <button 
                            onClick={() => setScoutedPlayer(null)}
                            className="w-full py-3 mt-3 text-slate-500 hover:text-white transition-colors text-sm font-medium"
                        >
                            İptal Et ve Geri Dön
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderSquad = () => (
    <div className="animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
                <h2 className="text-4xl font-display font-bold text-white mb-2">Aktif Kadro</h2>
                <p className="text-slate-400">
                    Toplam Maaş Yükü: <span className="text-rose-400 font-mono font-bold">-{getTotalWeeklyWage()} VK</span> / Dönem
                </p>
            </div>
            <div className="flex flex-col items-end gap-2">
                {paydayMessage && (
                    <div className="text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                        {paydayMessage}
                    </div>
                )}
                <span className="font-mono text-sm bg-slate-800 text-slate-300 px-4 py-2 rounded-xl border border-slate-700">
                    {squad.length} / 25 Operatif
                </span>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {squad.map((player) => (
                <PlayerCard 
                    key={player.id} 
                    player={player} 
                    compact 
                    onSell={() => handleSellPlayer(player)}
                    sellValue={Math.floor(calculatePlayerValue(player) * 0.7)}
                />
            ))}
        </div>
    </div>
  );

  const renderMatch = () => (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
        {!matchResult && !isSimulating && (
            <div className="glass-panel p-8 md:p-12 rounded-3xl text-center max-w-3xl mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 to-slate-900/80 -z-10"></div>
                
                <h2 className="text-4xl font-display font-bold text-white mb-8 neon-text">Maç Simülasyonu</h2>

                {scoutError && (
                    <div className="p-4 bg-rose-900/30 border border-rose-500/50 text-rose-200 rounded-xl flex items-center justify-center gap-2 mb-8 animate-in shake">
                        <AlertTriangle size={20} /> {scoutError}
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {Object.values(Tactic).map((t) => (
                        <button
                            key={t}
                            onClick={() => setSelectedTactic(t)}
                            className={`relative p-6 rounded-2xl text-left transition-all group overflow-hidden border ${selectedTactic === t ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'}`}
                        >
                            {selectedTactic === t && <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>}
                            <div className={`font-display font-bold text-lg mb-1 ${selectedTactic === t ? 'text-white' : 'text-slate-300'}`}>{t}</div>
                            <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                {t === Tactic.ALL_OUT_ATTACK ? 'Risk: Yüksek • Ödül: Yüksek' : 
                                 t === Tactic.PARK_THE_BUS ? 'Risk: Düşük • Savunma Odaklı' :
                                 t === Tactic.COUNTER_ATTACK ? 'Hızlı Hücum • Alan Kullanımı' : 'Denge • Top Kontrolü'}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex justify-center mb-8">
                     <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-6 text-sm border-slate-700">
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            <span className="text-slate-400">Galibiyet:</span>
                            <span className="text-white font-bold">+400 VK</span>
                         </div>
                         <div className="w-px h-4 bg-slate-700"></div>
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            <span className="text-slate-400">Beraberlik:</span>
                            <span className="text-white font-bold">+150 VK</span>
                         </div>
                     </div>
                </div>

                <button 
                    onClick={handleSimulateMatch}
                    className="w-full py-5 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 rounded-2xl font-display font-bold text-white text-xl shadow-[0_0_40px_rgba(225,29,72,0.4)] hover:shadow-[0_0_60px_rgba(225,29,72,0.6)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                >
                    <Zap fill="currentColor" className="animate-pulse" />
                    BAĞLANTIYI BAŞLAT
                </button>
            </div>
        )}

        {isSimulating && (
            <div className="h-[60vh] flex flex-col items-center justify-center font-mono relative">
                <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full scale-50 animate-pulse"></div>
                <div className="w-24 h-24 mb-8 relative">
                     <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                     <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-2xl text-white font-bold mb-2 tracking-widest">SİMÜLASYON AKTİF</div>
                <div className="flex flex-col items-center gap-1 text-sm text-cyan-400/80">
                    <span>> Rakip analizi yapılıyor...</span>
                    <span className="animate-[fade-in_1s_ease-in-out_0.5s_forwards] opacity-0">> Taktiksel vektörler hesaplanıyor...</span>
                    <span className="animate-[fade-in_1s_ease-in-out_1s_forwards] opacity-0">> Sonuç optimize ediliyor...</span>
                </div>
            </div>
        )}

        {matchResult && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-8 duration-700">
                
                {/* Scoreboard */}
                <div className="lg:col-span-12 glass-panel p-8 rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="text-center md:text-left md:flex-1">
                            <div className="text-cyan-400 font-display font-bold text-2xl mb-1 tracking-wide">NEXUS FC</div>
                            <div className="text-slate-500 text-sm font-mono bg-slate-900/50 inline-block px-2 py-1 rounded">{selectedTactic}</div>
                        </div>
                        
                        <div className="text-center flex-1">
                             <div className="text-7xl md:text-8xl font-black font-display text-white tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                {matchResult.homeScore} - {matchResult.awayScore}
                             </div>
                             <div className={`mt-4 px-4 py-1.5 rounded-full border inline-block text-xs font-bold tracking-widest uppercase ${
                                matchResult.winner === 'home' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 
                                matchResult.winner === 'away' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 
                                'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                             }`}>
                                {matchResult.winner === 'home' ? 'GALİBİYET' : matchResult.winner === 'away' ? 'MAĞLUBİYET' : 'BERABERLİK'}
                             </div>
                        </div>
                        
                        <div className="text-center md:text-right md:flex-1">
                            <div className="text-rose-400 font-display font-bold text-2xl mb-1 tracking-wide">{matchResult.opponentName.toUpperCase()}</div>
                            <div className="text-slate-500 text-sm font-mono bg-slate-900/50 inline-block px-2 py-1 rounded">CPU</div>
                        </div>
                    </div>
                </div>

                {/* Payday Notification */}
                {paydayMessage && (
                    <div className="lg:col-span-12 p-4 bg-rose-900/20 border border-rose-500/30 rounded-2xl flex items-center justify-center gap-3 text-rose-200 shadow-lg shadow-rose-900/10">
                         <Wallet className="text-rose-500" />
                         <span className="font-bold font-mono">{paydayMessage}</span>
                    </div>
                )}

                {/* Match Stats */}
                <div className="lg:col-span-4 glass-panel p-6 rounded-3xl">
                    <h3 className="text-white font-display font-bold mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-cyan-400" />
                        Maç Verileri
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2 text-slate-300">
                                <span>Topa Sahip Olma</span>
                                <span className="font-mono">{matchResult.possession}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${matchResult.possession}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2 text-slate-300">
                                <span>Baskı Seviyesi</span>
                                <span className="font-mono">Yüksek</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" style={{ width: `75%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                        <p className="text-sm text-slate-400 italic leading-relaxed">
                            "{matchResult.summary}"
                        </p>
                    </div>
                </div>

                {/* Live Feed */}
                <div className="lg:col-span-8 glass-panel p-6 rounded-3xl relative">
                    <div className="absolute top-6 right-6 text-slate-600">
                        <Terminal size={24} />
                    </div>
                    <h3 className="text-white font-display font-bold mb-6 flex items-center gap-2">
                        <Terminal size={20} className="text-purple-400" />
                        Terminal Akışı
                    </h3>
                    <div className="space-y-3 font-mono text-sm h-[300px] overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-4 rounded-xl border border-white/5">
                        {matchResult.events.map((event, idx) => (
                            <div key={idx} className="flex gap-4 items-start p-3 rounded-lg hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-cyan-500">
                                <div className="text-cyan-500 font-bold min-w-[2.5rem] text-right opacity-70">{event.minute}'</div>
                                <div className={`flex-1 ${event.type === 'goal' ? 'text-yellow-400 font-bold' : event.type === 'card' ? 'text-rose-400' : 'text-slate-300'}`}>
                                    {event.type === 'goal' && '⚽ GOAL - '} 
                                    {event.type === 'card' && '🟨 KART - '}
                                    {event.description}
                                </div>
                            </div>
                        ))}
                    </div>
                     <button 
                        onClick={() => setMatchResult(null)}
                        className="mt-6 w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-bold transition-all"
                    >
                        Brifing Odasına Dön
                    </button>
                </div>
            </div>
        )}
    </div>
  );

  const renderTutorial = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500 pb-12">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold text-white mb-2 neon-text">Operasyon Rehberi</h2>
            <p className="text-slate-400">Nexus Ligi'nde hayatta kalma ve yükselme protokolleri.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-8 rounded-2xl border-t-4 border-cyan-500">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
                        <Telescope size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white">1. Yetenek Avı</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Gözlemci ağını kullanarak oyuncu ara ({SCOUT_COST} VK). Bulunan oyuncuyu kadrona katmak için <span className="text-white font-bold">İmza Bedeli</span> ödemelisin.
                </p>
                <div className="bg-black/30 p-3 rounded-lg text-xs text-slate-500 border border-white/5">
                    Yüksek reytingli oyuncular (Glitch/Efsanevi) daha yüksek imza bedeli ve maaş talep eder.
                </div>
            </div>

            <div className="glass-panel p-8 rounded-2xl border-t-4 border-emerald-500">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Coins size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white">2. Finans</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                    Maç kazanarak VK topla. Ancak dikkatli ol:
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>Her {PAYDAY_INTERVAL} maçta bir oyuncu maaşları ödenir.</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Oyuncu satarak %70 geri ödeme alabilirsin.</li>
                </ul>
            </div>

            <div className="glass-panel p-8 rounded-2xl border-t-4 border-rose-500">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white">3. Maç Sistemi</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">
                    Maç sonucu; kadro gücün, seçtiğin taktik ve şans faktörüyle belirlenir. Rakibin taktiğine karşı doğru stratejiyi seçmek kazanma şansını artırır.
                </p>
            </div>

            <div className="glass-panel p-8 rounded-2xl border-t-4 border-purple-500">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white">4. Taktikler</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white/5 p-2 rounded text-slate-300 border border-white/5">Baskı > Pas Oyunu</div>
                    <div className="bg-white/5 p-2 rounded text-slate-300 border border-white/5">Pas > Otobüs</div>
                    <div className="bg-white/5 p-2 rounded text-slate-300 border border-white/5">Otobüs > Kontra</div>
                    <div className="bg-white/5 p-2 rounded text-slate-300 border border-white/5">Kontra > Baskı</div>
                </div>
            </div>
        </div>

        <div className="mt-12 text-center">
            <button 
                onClick={() => setCurrentView(GameView.DASHBOARD)}
                className="px-10 py-4 bg-white text-black hover:bg-cyan-50 font-bold rounded-xl transition-all shadow-xl shadow-cyan-500/10 hover:scale-105"
            >
                Menajer Paneline Dön
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-24 text-slate-200 selection:bg-cyan-500/30">
      {/* Modern Floating Nav */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 hidden md:block">
        <nav className="glass-panel rounded-2xl px-2 py-2 flex items-center justify-between shadow-2xl shadow-black/50 backdrop-blur-2xl border-white/10">
            <div className="flex items-center gap-3 px-4 border-r border-white/10 pr-6">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center font-display font-black text-black text-lg shadow-[0_0_15px_rgba(6,182,212,0.5)]">N</div>
            </div>
            
            <div className="flex items-center gap-1">
                <NavButton id={GameView.DASHBOARD} icon={LayoutDashboard} label="ÜS" />
                <NavButton id={GameView.SQUAD} icon={Users} label="KADRO" />
                <NavButton id={GameView.SCOUTING} icon={Telescope} label="ARA" />
                <NavButton id={GameView.MATCH} icon={PlayCircle} label="MAÇ" />
                <NavButton id={GameView.TUTORIAL} icon={BookOpen} label="REHBER" />
            </div>

            <div className="pl-6 border-l border-white/10 px-4">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-bold tracking-widest">BAKİYE</span>
                    <span className="text-emerald-400 font-mono font-bold">{credits} VK</span>
                </div>
            </div>
        </nav>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-40 glass-panel border-b border-white/5 px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-black">N</div>
               <span className="font-display font-bold">NEXUS</span>
          </div>
          <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-mono text-emerald-400">
              {credits} VK
          </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-6 left-4 right-4 z-50 md:hidden">
         <nav className="glass-panel rounded-2xl p-2 flex justify-around shadow-2xl shadow-black/80">
            {[
                { id: GameView.DASHBOARD, icon: LayoutDashboard },
                { id: GameView.SQUAD, icon: Users },
                { id: GameView.SCOUTING, icon: Telescope },
                { id: GameView.MATCH, icon: PlayCircle },
                { id: GameView.TUTORIAL, icon: BookOpen },
            ].map(item => (
                <button 
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`p-3 rounded-xl transition-all ${currentView === item.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400'}`}
                >
                    <item.icon size={24} />
                </button>
            ))}
         </nav>
      </div>

      {/* Main Content */}
      <main className="pt-24 px-4 max-w-6xl mx-auto min-h-[calc(100vh)]">
         {currentView === GameView.DASHBOARD && renderDashboard()}
         {currentView === GameView.SCOUTING && renderScouting()}
         {currentView === GameView.SQUAD && renderSquad()}
         {currentView === GameView.MATCH && renderMatch()}
         {currentView === GameView.TUTORIAL && renderTutorial()}
      </main>
    </div>
  );
}