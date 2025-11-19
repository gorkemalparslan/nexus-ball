
import { Player, Position } from "./types";

export const INITIAL_SQUAD: Player[] = [
  {
    id: 'init-1',
    name: 'Kaelen "Hayalet" Vane',
    origin: 'Yeraltı Sektör 7',
    age: 22,
    position: Position.FORWARD,
    stats: { pace: 88, shooting: 75, passing: 60, dribbling: 82, defense: 30, physical: 55 },
    backstory: 'Gecekondu mahallesinde güvenlik dronlarından kaçarken çalım atmayı öğrendi.',
    rarity: 'Sıradan',
    avatarColor: '#ef4444',
    salary: 45
  },
  {
    id: 'init-2',
    name: 'Jaxxon Çelik',
    origin: 'Neo-Reykjavik',
    age: 28,
    position: Position.DEFENDER,
    stats: { pace: 60, shooting: 40, passing: 65, dribbling: 50, defense: 85, physical: 90 },
    backstory: 'Eski çevik kuvvet polisi, şimdi ise geçilmez bir savunma duvarı.',
    rarity: 'Nadir',
    avatarColor: '#3b82f6',
    salary: 70
  },
  {
    id: 'init-3',
    name: 'Cipher 09',
    origin: 'Dijital Boşluk',
    age: 19,
    position: Position.MIDFIELDER,
    stats: { pace: 70, shooting: 65, passing: 88, dribbling: 75, defense: 50, physical: 45 },
    backstory: 'Biyonik görüş geliştirmelerine sahip olduğu söyleniyor.',
    rarity: 'Nadir',
    avatarColor: '#a855f7',
    salary: 65
  }
];

export const COLORS = {
  primary: '#06b6d4', // Cyan 500
  secondary: '#8b5cf6', // Violet 500
  accent: '#f43f5e', // Rose 500
  background: '#0f172a', // Slate 900
  card: '#1e293b' // Slate 800
};
