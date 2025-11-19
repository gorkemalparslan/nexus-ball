
export enum Position {
  FORWARD = 'Forvet',
  MIDFIELDER = 'Orta Saha',
  DEFENDER = 'Defans',
  GOALKEEPER = 'Kaleci'
}

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
}

export interface Player {
  id: string;
  name: string;
  origin: string;
  age: number;
  position: Position;
  stats: PlayerStats;
  backstory: string;
  rarity: 'Sıradan' | 'Nadir' | 'Efsanevi' | 'Glitch';
  avatarColor: string;
  salary: number; // Weekly wage cost
}

export interface MatchEvent {
  minute: number;
  description: string;
  type: 'goal' | 'chance' | 'card' | 'injury' | 'tactical';
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  opponentName: string;
  summary: string;
  events: MatchEvent[];
  possession: number;
  winner: 'home' | 'away' | 'draw';
}

export enum GameView {
  DASHBOARD = 'DASHBOARD',
  SCOUTING = 'SCOUTING',
  SQUAD = 'SQUAD',
  MATCH = 'MATCH',
  TUTORIAL = 'TUTORIAL'
}

export enum Tactic {
  ALL_OUT_ATTACK = 'Tam Saha Baskı',
  POSSESSION_GAME = 'Topa Sahip Olma',
  PARK_THE_BUS = 'Otobüsü Çek',
  COUNTER_ATTACK = 'Kontratak'
}
