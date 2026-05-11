
export const DEVSCORE_TIERS = {
  ROOKIE: 'Rookie',
  RELIABLE: 'Reliable',
  PROVEN: 'Proven',
  ELITE: 'Elite',
} as const;

export const getDevScoreTier = (score: number): string => {
  if (score >= 85) return DEVSCORE_TIERS.ELITE;
  if (score >= 70) return DEVSCORE_TIERS.PROVEN;
  if (score >= 50) return DEVSCORE_TIERS.RELIABLE;
  return DEVSCORE_TIERS.ROOKIE;
};

export const formatDevScore = (score: number | bigint | undefined | null): string => {
  const s = typeof score === 'bigint' ? Number(score) : (score ?? 0);
  const tier = getDevScoreTier(s);
  return `${tier} (${s})`;
};
