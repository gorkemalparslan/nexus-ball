import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Player, Position, MatchResult, Tactic } from "./types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY is missing from environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePlayerProfile = async (targetPosition?: Position): Promise<Omit<Player, 'id' | 'avatarColor' | 'salary'>> => {
  const ai = getAIClient();
  
  // Updated prompt to be less likely to trigger safety filters (avoiding "illegal", "banned", "underground" in a criminal context)
  const prompt = `Alternatif bir cyberpunk ligi için kurgusal bir futbolcu profili oluştur. 
  Oyuncu geleneksel olmayan futbol ülkelerinden (örn. küçük ada ülkeleri, uzak bölgeler veya kurgusal fütüristik şehir devletleri) gelmelidir.
  ${targetPosition ? `Oyuncu şu mevkide olmalı: ${targetPosition}.` : ''}
  İstatistiklerine göre nadirliğini belirle (Sıradan: ort < 60, Nadir: ort < 80, Efsanevi: ort < 95, Glitch: ort > 95).
  Bu alternatif ligde nasıl keşfedildiğine dair kısa, havalı ve gizemli bir hikaye yaz (Türkçe).
  İsimler yabancı/fütüristik olabilir ama hikaye ve köken Türkçe olmalı.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          origin: { type: Type.STRING },
          age: { type: Type.INTEGER },
          position: { type: Type.STRING, enum: [Position.FORWARD, Position.MIDFIELDER, Position.DEFENDER, Position.GOALKEEPER] },
          stats: {
            type: Type.OBJECT,
            properties: {
              pace: { type: Type.INTEGER },
              shooting: { type: Type.INTEGER },
              passing: { type: Type.INTEGER },
              dribbling: { type: Type.INTEGER },
              defense: { type: Type.INTEGER },
              physical: { type: Type.INTEGER }
            },
            required: ["pace", "shooting", "passing", "dribbling", "defense", "physical"]
          },
          backstory: { type: Type.STRING },
          rarity: { type: Type.STRING, enum: ['Sıradan', 'Nadir', 'Efsanevi', 'Glitch'] }
        },
        required: ["name", "origin", "age", "position", "stats", "backstory", "rarity"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as Omit<Player, 'id' | 'avatarColor' | 'salary'>;
};

export const simulateMatch = async (squad: Player[], tactic: Tactic): Promise<MatchResult> => {
  const ai = getAIClient();
  
  // Calculate aggregate stats for context
  const avgAttack = squad.reduce((acc, p) => acc + p.stats.shooting + p.stats.pace, 0) / squad.length;
  const avgDefense = squad.reduce((acc, p) => acc + p.stats.defense + p.stats.physical, 0) / squad.length;
  const starPlayer = squad.reduce((prev, current) => (prev.stats.dribbling > current.stats.dribbling) ? prev : current);

  const prompt = `Nexus Ligi'nde yüksek riskli bir maç simüle et.
  Kullanıcının Takım Stratejisi: ${tactic}.
  Kullanıcının Kilit Oyuncusu: ${starPlayer.name} (${starPlayer.position}).
  Takım Ortalama Saldırı Gücü: ${Math.round(avgAttack)}.
  Takım Ortalama Savunma Gücü: ${Math.round(avgDefense)}.
  
  Kurgusal, cyberpunk temalı bir rakip takım ismi oluştur (örn. 'Neo-Tokyo Drifters', 'Svalbard Buzkıranları').
  Taktik ve istatistiklere göre skoru belirle (Taş Kağıt Makas mantığı: Kontratak Saldırıyı yener, Topa Sahip Olma Otobüsü yener vb.).
  Dakika bilgisiyle 3-5 önemli maç olayı oluştur (Türkçe).
  Maçın atmosferini anlatan kısa, dramatik bir özet yaz (Türkçe).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          homeScore: { type: Type.INTEGER },
          awayScore: { type: Type.INTEGER },
          opponentName: { type: Type.STRING },
          summary: { type: Type.STRING },
          possession: { type: Type.INTEGER },
          winner: { type: Type.STRING, enum: ['home', 'away', 'draw'] },
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                minute: { type: Type.INTEGER },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['goal', 'chance', 'card', 'injury', 'tactical'] }
              },
              required: ["minute", "description", "type"]
            }
          }
        },
        required: ["homeScore", "awayScore", "opponentName", "summary", "events", "possession", "winner"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  return JSON.parse(text) as MatchResult;
};