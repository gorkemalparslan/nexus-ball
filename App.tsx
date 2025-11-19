import React, { useState } from 'react';
import { LayoutDashboard, Telescope, Users, PlayCircle, Zap, Trophy, AlertTriangle, Terminal, BookOpen, CheckCircle2, Coins, Wallet, Timer } from 'lucide-react';
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
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      const salary = calculateSalary(profile.stats, profile.rarity);
      
      const newPlayer: Player = {
        ...profile,
        id: crypto.randomUUID(),
        avatarColor: profile.position === Position.FORWARD ? COLORS.accent : profile.position === Position.DEFENDER ? COLORS.primary : COLORS.secondary,
        salary: salary
      };
      setScoutedPlayer(newPlayer);
    } catch (e) {
      setScoutError("Gözlemci ağı hatası. Güvenli hat ele geçirildi veya bağlantı koptu.");
      setCredits(prev => prev + SCOUT_COST); 
      console.error("Scouting Failed:", e);
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
        new Promise(resolve => setTimeout(resolve, 2000))
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

    } catch (e) {
      console.error("Match Simulation Failed:", e);
      setScoutError("Maç simülasyon bağlantısı kesildi. Lütfen tekrar deneyin.");
    } finally {
      setIsSimulating(false);
    }
  };

  // --- VIEWS ---

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      
      {/* Welcome Panel */}
      <div className="lg:col-span-2 p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
            <Trophy size={120} className="text-cyan-400" />
        </div>
        <h2 className="text-3xl font-display font-bold text-white mb-2">Tekrar hoşgeldin, Menajer.</h2>
        <p className="text-slate-400 max-w-md">
            Nexus Yeraltı Ligi devrede. Sonraki ödeme döngüsü yaklaşıyor.
            Finansal dengeni koru ve galibiyet serisi yakala.
        </p>
        <div className="mt-6 flex gap-4">
            <button 
                onClick={() => setCurrentView(GameView.MATCH)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-bold text-white shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform flex items-center gap-2"
            >
                <PlayCircle size={20} /> Maçı Başlat
            </button>
            <button 
                onClick={() => setCurrentView(GameView.SCOUTING)}
                className="px-6 py-3 bg-slate-800 border border-slate-600 rounded-lg font-bold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                <Telescope size={20} /> Gözlemci Ağı
            </button>
        </div>
      </div>

      {/* Finance Panel */}
      <div className="p-6 rounded-2xl glass-panel flex flex-col">
         <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
            <Wallet className="text-emerald-400" size={20} />
            <span className="font-display font-bold text-slate-200">Operasyon Bütçesi</span>
         </div>
         
         <div className="text-center mb-4">
            <div className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                {credits} <span className="text-lg text-slate-500">VK</span>
            </div>
            <div className="text-xs text-slate-500">Toplam Varlıklar</div>
         </div>

         <div className="space-y-3 bg-black/20 p-3 rounded-lg">
             <div className="flex justify-between text-sm">
                 <span className="text-slate-400">Dönemlik Gider:</span>
                 <span className="text-rose-400 font-mono font-bold">-{getTotalWeeklyWage()} VK</span>
             </div>
             <div className="flex justify-between text-sm items-center">
                 <span className="text-slate-400">Ödeme Günü:</span>
                 <div className="flex items-center gap-1">
                    <span className="text-cyan-400 font-mono font-bold">{PAYDAY_INTERVAL - (matchesPlayed % PAYDAY_INTERVAL)}</span>
                    <span className="text-[10px] text-slate-500">MAÇ SONRA</span>
                 </div>
             </div>
             {/* Progress Bar for Payday */}
             <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div 
                    className="h-full bg-cyan-500 transition-all duration-500" 
                    style={{ width: `${((matchesPlayed % PAYDAY_INTERVAL) / PAYDAY_INTERVAL) * 100}%` }}
                ></div>
             </div>
         </div>
      </div>

      <div className="lg:col-span-3 mt-4">
        <h3 className="text-xl font-display text-white mb-4 flex items-center gap-2"><Users className="text-cyan-400" /> Öne Çıkan Oyuncular</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {squad.slice(0, 3).map(player => (
                <PlayerCard key={player.id} player={player} />
            ))}
        </div>
      </div>
    </div>
  );

  const renderScouting = () => (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-display font-bold text-white mb-2 neon-text">Küresel Gözlemci Ağı</h2>
            <p className="text-slate-400">Kayıtsız yetenekleri bulmak için karanlık ağa (dark web) bağlan. Ağ Erişim Ücreti: <span className="text-emerald-400 font-bold">{SCOUT_COST} VK</span>.</p>
        </div>

        {!scoutedPlayer && !isScouting && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[Position.FORWARD, Position.MIDFIELDER, Position.DEFENDER, Position.GOALKEEPER].map((pos) => (
                    <button 
                        key={pos}
                        onClick={() => handleScout(pos)}
                        disabled={credits < SCOUT_COST}
                        className="p-6 glass-panel rounded-xl hover:bg-white/5 transition-all border border-slate-700 hover:border-cyan-500 group flex flex-col items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Telescope className="text-cyan-400" />
                        </div>
                        <span className="font-display font-bold text-slate-200">{pos}</span>
                        <span className="text-xs text-slate-500">Sektörü Tara ({SCOUT_COST} VK)</span>
                    </button>
                ))}
            </div>
        )}

        {scoutError && (
            <div className="p-4 bg-rose-900/20 border border-rose-500/50 text-rose-400 rounded-lg flex items-center gap-2 mb-4 animate-in shake">
                <AlertTriangle size={18} /> {scoutError}
            </div>
        )}

        {isScouting && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
                </div>
                <p className="font-mono text-cyan-400 animate-pulse">BİYOMETRİK VERİ ÇÖZÜMLENİYOR...</p>
            </div>
        )}

        {scoutedPlayer && (
            <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                <div className="w-full max-w-sm">
                    <PlayerCard player={scoutedPlayer} />
                </div>
                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <div className="glass-panel p-6 rounded-xl max-w-xs w-full">
                        <h3 className="text-xl font-display text-white mb-2">Transfer Teklifi</h3>
                        <p className="text-sm text-slate-300 mb-4">
                            Hedef oyuncu {scoutedPlayer.origin} bölgesinde tespit edildi. İstatistiklerine göre piyasa değeri hesaplandı.
                        </p>
                        
                        <div className="bg-black/40 p-3 rounded border border-white/10 mb-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">İmza Bedeli</span>
                                <span className="text-lg font-bold text-emerald-400 font-mono">{calculatePlayerValue(scoutedPlayer)} VK</span>
                            </div>
                            <div className="flex justify-between items-center border-t border-white/10 pt-2">
                                <span className="text-slate-400 text-sm">Maaş Talebi</span>
                                <span className="text-md font-bold text-rose-400 font-mono">-{scoutedPlayer.salary} VK/Dönem</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleSignPlayer}
                            disabled={credits < calculatePlayerValue(scoutedPlayer)}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {credits >= calculatePlayerValue(scoutedPlayer) ? (
                                <><CheckCircle2 size={18} /> Sözleşme İmzala</>
                            ) : (
                                <>Yetersiz Bakiye</>
                            )}
                        </button>
                        <button 
                            onClick={() => setScoutedPlayer(null)}
                            className="w-full py-3 mt-2 bg-transparent border border-slate-600 text-slate-400 hover:text-white rounded transition-colors"
                        >
                            Pas Geç
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  const renderSquad = () => (
    <div className="animate-in fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-3xl font-display font-bold text-white">Aktif Kadro</h2>
                <p className="text-slate-400 text-sm">Toplam Operasyon Gideri: <span className="text-rose-400 font-mono font-bold">-{getTotalWeeklyWage()} VK</span></p>
            </div>
            <div className="flex flex-col items-end">
                {paydayMessage && (
                    <div className="text-emerald-400 text-sm font-bold mb-1 animate-pulse">{paydayMessage}</div>
                )}
                <span className="text-slate-400 font-mono bg-slate-800 px-3 py-1 rounded-full border border-slate-700">{squad.length} Operatif</span>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="max-w-5xl mx-auto animate-in fade-in">
        {!matchResult && !isSimulating && (
            <div className="glass-panel p-8 rounded-2xl text-center max-w-2xl mx-auto">
                <h2 className="text-3xl font-display font-bold text-white mb-6">Taktiksel Brifing</h2>

                {scoutError && (
                    <div className="p-4 bg-rose-900/20 border border-rose-500/50 text-rose-400 rounded-lg flex items-center justify-center gap-2 mb-6 animate-in shake">
                        <AlertTriangle size={18} /> {scoutError}
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {Object.values(Tactic).map((t) => (
                        <button
                            key={t}
                            onClick={() => setSelectedTactic(t)}
                            className={`p-4 border rounded-xl text-left transition-all ${selectedTactic === t ? 'border-cyan-500 bg-cyan-900/20 text-white' : 'border-slate-700 text-slate-400 hover:bg-white/5'}`}
                        >
                            <div className="font-bold font-display">{t}</div>
                            <div className="text-xs opacity-70 mt-1">
                                {t === Tactic.ALL_OUT_ATTACK ? 'Yüksek Risk, Yüksek Ödül' : 
                                 t === Tactic.PARK_THE_BUS ? 'Maksimum Savunma' :
                                 t === Tactic.COUNTER_ATTACK ? 'Boş Alanları Kullan' : 'Tempoyu Kontrol Et'}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6 text-sm text-slate-400">
                    <div className="flex justify-between mb-1">
                        <span>Tahmini Kazanç (G):</span>
                        <span className="text-emerald-400">+400 VK</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Sonraki Maaş Ödemesi:</span>
                        <span className="text-cyan-400">{PAYDAY_INTERVAL - (matchesPlayed % PAYDAY_INTERVAL)} maç sonra</span>
                    </div>
                </div>

                <button 
                    onClick={handleSimulateMatch}
                    className="w-full py-4 bg-gradient-to-r from-rose-600 to-orange-600 rounded-lg font-bold text-white text-lg shadow-lg shadow-rose-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                    <Zap fill="currentColor" /> MAÇI SİMÜLE ET
                </button>
            </div>
        )}

        {isSimulating && (
            <div className="h-[60vh] flex flex-col items-center justify-center font-mono text-cyan-400">
                <div className="w-64 h-1 bg-slate-800 rounded overflow-hidden mb-4">
                    <div className="h-full bg-cyan-400 animate-[loading_2s_ease-in-out_infinite] w-full origin-left"></div>
                </div>
                <div className="text-xl">MAÇ SONUCU HESAPLANIYOR...</div>
                <div className="text-sm text-slate-500 mt-2">Fizik motoru çalışıyor... Taktiksel vektörler analiz ediliyor...</div>
            </div>
        )}

        {matchResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Scoreboard */}
                <div className="lg:col-span-3 glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                    <div className="text-center w-1/3">
                        <div className="text-cyan-400 font-display font-bold text-xl mb-1">NEXUS FC</div>
                        <div className="text-slate-500 text-sm">{selectedTactic}</div>
                    </div>
                    <div className="text-center w-1/3">
                         <div className="text-6xl font-black font-display text-white tracking-tighter">
                            {matchResult.homeScore} - {matchResult.awayScore}
                         </div>
                         <div className="mt-2 px-3 py-1 rounded-full bg-white/10 inline-block text-xs text-slate-300">
                            {matchResult.winner === 'home' ? 'GALİBİYET' : matchResult.winner === 'away' ? 'MAĞLUBİYET' : 'BERABERLİK'}
                         </div>
                    </div>
                    <div className="text-center w-1/3">
                        <div className="text-rose-400 font-display font-bold text-xl mb-1">{matchResult.opponentName.toUpperCase()}</div>
                        <div className="text-slate-500 text-sm">CPU TAKTİĞİ</div>
                    </div>
                </div>

                {/* Payday Notification */}
                {paydayMessage && (
                    <div className="lg:col-span-3 p-4 bg-rose-900/20 border border-rose-500/50 rounded-lg flex items-center justify-center gap-3 text-rose-200 animate-in slide-in-from-top-2">
                         <Wallet className="text-rose-400" />
                         <span className="font-bold font-mono">{paydayMessage}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="glass-panel p-6 rounded-2xl h-fit">
                    <h3 className="text-slate-400 uppercase tracking-widest text-sm mb-4 border-b border-slate-700 pb-2">Maç İstatistikleri</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1 text-slate-300">
                                <span>Topa Sahip Olma</span>
                                <span>{matchResult.possession}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-cyan-500" style={{ width: `${matchResult.possession}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1 text-slate-300">
                                <span>Yoğunluk</span>
                                <span>Yüksek</span>
                            </div>
                            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: `85%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 text-xs text-slate-500 italic">
                        "{matchResult.summary}"
                    </div>
                </div>

                {/* Feed */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl relative">
                    <div className="absolute top-4 right-4 text-slate-600">
                        <Terminal size={20} />
                    </div>
                    <h3 className="text-slate-400 uppercase tracking-widest text-sm mb-4 border-b border-slate-700 pb-2">Canlı Veri Akışı</h3>
                    <div className="space-y-4 font-mono text-sm h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {matchResult.events.map((event, idx) => (
                            <div key={idx} className="flex gap-4 items-start animate-in slide-in-from-left-2" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="text-cyan-500 font-bold min-w-[3rem]">{event.minute}'</div>
                                <div className={`flex-1 ${event.type === 'goal' ? 'text-yellow-400 font-bold' : event.type === 'card' ? 'text-rose-400' : 'text-slate-300'}`}>
                                    {event.type === 'goal' && '⚽ '} 
                                    {event.type === 'card' && '🟨 '}
                                    {event.description}
                                </div>
                            </div>
                        ))}
                    </div>
                     <button 
                        onClick={() => setMatchResult(null)}
                        className="mt-6 w-full py-2 border border-slate-600 rounded hover:bg-white/5 text-slate-300 transition-colors"
                    >
                        Taktik Ekranına Dön
                    </button>
                </div>
            </div>
        )}
    </div>
  );

  const renderTutorial = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
        <div className="text-center mb-10">
            <h2 className="text-4xl font-display font-bold text-white mb-2 neon-text">Operasyon Rehberi</h2>
            <p className="text-slate-400">Nexus Ligi'nde hayatta kalma ve yükselme protokolleri.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Scouting */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Telescope size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white">1. Yetenek Avı</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Küresel gözlemci ağını kullanarak yeni oyuncular keşfet. Arama işlemi sabit <span className="text-emerald-400 font-bold">{SCOUT_COST} VK</span> hizmet bedeli gerektirir.
                </p>
                <p className="text-slate-400 text-xs mt-2 bg-black/20 p-2 rounded">
                    <span className="text-rose-400 font-bold">DİKKAT:</span> Oyuncuyu takıma katmak için, oyuncunun yetenek seviyesine göre belirlenen bir <span className="text-white">İmza Bedeli</span> ödemen gerekir. 90+ reytingli oyuncular servet değerindedir.
                </p>
            </div>

            {/* Card 2: Economy */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Coins size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white">2. Finans ve Maaşlar</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                    Kulübünü finanse etmek için maç yapman gerekir. Maç sonuçlarına göre Veri Kredisi (VK) kazanırsın.
                </p>
                <div className="mt-3 p-2 bg-rose-900/20 border border-rose-500/20 rounded">
                   <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-1">
                      <Wallet size={14} /> Operasyon Giderleri
                   </div>
                   <p className="text-xs text-slate-400">
                      Her <span className="text-white font-bold">{PAYDAY_INTERVAL} maçta bir</span> oyuncuların maaşları bakiyenden düşülür. İflas etmemek için kadro maaş dengesini koru!
                   </p>
                </div>
            </div>

            {/* Card 3: Matches */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-rose-500/20 text-rose-400">
                        <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white">3. Maç Motoru</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                    Maçlar yapay zeka tarafından simüle edilir. Sonucu etkileyen faktörler:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
                    <li>Kadro Gücü (Ortalama İstatistikler)</li>
                    <li>Yıldız Oyuncunun Formu</li>
                    <li><span className="text-white font-bold">Taktiksel Seçim</span> (Rakip taktiğine göre avantaj/dezavantaj)</li>
                </ul>
            </div>

            {/* Card 4: Tactics */}
            <div className="glass-panel p-6 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                        <LayoutDashboard size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-white">4. Taktikler</h3>
                </div>
                 <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white/5 rounded border-l-2 border-rose-500">
                        <div className="font-bold text-white">Tam Saha Baskı</div>
                        <div className="text-slate-500">Saldırıyı artırır, defansı zayıflatır.</div>
                    </div>
                    <div className="p-2 bg-white/5 rounded border-l-2 border-cyan-500">
                        <div className="font-bold text-white">Otobüsü Çek</div>
                        <div className="text-slate-500">Savunmayı maksimize eder.</div>
                    </div>
                    <div className="p-2 bg-white/5 rounded border-l-2 border-emerald-500">
                        <div className="font-bold text-white">Topa Sahip Olma</div>
                        <div className="text-slate-500">Oyunu kontrol eder.</div>
                    </div>
                    <div className="p-2 bg-white/5 rounded border-l-2 border-amber-500">
                        <div className="font-bold text-white">Kontratak</div>
                        <div className="text-slate-500">Boşlukları cezalandırır.</div>
                    </div>
                 </div>
            </div>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={() => setCurrentView(GameView.DASHBOARD)}
                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors border border-slate-600"
            >
                Anlaşıldı, Menajer.
            </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20 bg-[#05050a] text-slate-200">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-40 bg-[#05050a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded flex items-center justify-center font-bold text-black">N</div>
                <span className="font-display font-bold text-xl tracking-wider text-white">NEXUS<span className="text-cyan-400">BALL</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8">
                {[
                    { id: GameView.DASHBOARD, icon: LayoutDashboard, label: 'Ana Üs' },
                    { id: GameView.SQUAD, icon: Users, label: 'Kadro' },
                    { id: GameView.SCOUTING, icon: Telescope, label: 'Gözlemci' },
                    { id: GameView.MATCH, icon: PlayCircle, label: 'Simülasyon' },
                    { id: GameView.TUTORIAL, icon: BookOpen, label: 'Rehber' },
                ].map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`flex items-center gap-2 text-sm font-bold transition-colors ${currentView === item.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <item.icon size={16} />
                        {item.label.toUpperCase()}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-mono text-xs font-bold text-emerald-500">{credits} VK</span>
            </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="fixed bottom-0 w-full z-40 bg-[#0f172a] border-t border-white/5 md:hidden">
         <div className="grid grid-cols-5 h-16">
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
                    className={`flex flex-col items-center justify-center gap-1 ${currentView === item.id ? 'text-cyan-400' : 'text-slate-600'}`}
                >
                    <item.icon size={20} />
                </button>
            ))}
         </div>
      </div>

      {/* Main Content */}
      <main className="pt-24 px-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
         {currentView === GameView.DASHBOARD && renderDashboard()}
         {currentView === GameView.SCOUTING && renderScouting()}
         {currentView === GameView.SQUAD && renderSquad()}
         {currentView === GameView.MATCH && renderMatch()}
         {currentView === GameView.TUTORIAL && renderTutorial()}
      </main>
      
      <style>{`
        @keyframes loading {
            0% { transform: scaleX(0); }
            50% { transform: scaleX(1); }
            100% { transform: scaleX(0); transform-origin: right; }
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #334155; 
            border-radius: 2px;
        }
      `}</style>
    </div>
  );
}