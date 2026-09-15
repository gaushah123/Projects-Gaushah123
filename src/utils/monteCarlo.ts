import { MonteCarloResult } from '../types';

/**
 * Box-Muller transform for generating standard normal random numbers
 */
function randomNormal(mean = 0, stdev = 1): number {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdev * randStdNormal;
}

export interface MonteCarloConfig {
  initialCapital: number;
  monthlySip: number;
  horizonYears: number;
  expectedAnnualReturnPercent: number; // e.g., 14.5%
  annualVolatilityPercent: number; // e.g., 13.2%
  inflationRatePercent?: number; // default 6%
  numSimulations?: number; // default 2000
}

export function runMonteCarloSimulation(config: MonteCarloConfig): MonteCarloResult {
  const {
    initialCapital,
    monthlySip = 0,
    horizonYears = 10,
    expectedAnnualReturnPercent,
    annualVolatilityPercent,
    inflationRatePercent = 6.0,
    numSimulations = 2000,
  } = config;

  const mu = expectedAnnualReturnPercent / 100;
  const sigma = annualVolatilityPercent / 100;
  const annualSip = monthlySip * 12;
  const totalPrincipalInvested = initialCapital + annualSip * horizonYears;
  const inflationMultiplier = Math.pow(1 + inflationRatePercent / 100, horizonYears);
  const inflationTargetCorpus = initialCapital * inflationMultiplier + (annualSip > 0 ? annualSip * horizonYears * (inflationMultiplier * 0.7) : 0);

  // Store yearly values for each year 0..horizonYears across all simulations
  // yearValues[year][simulationIndex]
  const yearValues: number[][] = Array.from({ length: horizonYears + 1 }, () => []);

  // Initialize Year 0
  for (let s = 0; s < numSimulations; s++) {
    yearValues[0].push(initialCapital);
  }

  let lossCount = 0;
  let beatInflationCount = 0;
  const finalCorpusList: number[] = [];

  for (let s = 0; s < numSimulations; s++) {
    let currentCorpus = initialCapital;

    for (let y = 1; y <= horizonYears; y++) {
      // Annual compounding with geometric Brownian motion
      // S_{t+1} = (S_t + SIP) * exp((mu - 0.5 * sigma^2) + sigma * Z)
      const z = randomNormal(0, 1);
      const returnFactor = Math.exp((mu - 0.5 * sigma * sigma) + sigma * z);
      
      // Assume SIP contributed mid-year or throughout year
      currentCorpus = (currentCorpus + annualSip * 0.5) * returnFactor + annualSip * 0.5;
      
      yearValues[y].push(currentCorpus);
    }

    finalCorpusList.push(currentCorpus);

    if (currentCorpus < totalPrincipalInvested) {
      lossCount++;
    }
    if (currentCorpus >= inflationTargetCorpus) {
      beatInflationCount++;
    }
  }

  // Calculate percentiles for each year
  const years: number[] = [];
  const p10: number[] = [];
  const p25: number[] = [];
  const p50: number[] = [];
  const p75: number[] = [];
  const p90: number[] = [];
  const expectedMean: number[] = [];

  const getPercentile = (arr: number[], q: number) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    }
    return sorted[base];
  };

  for (let y = 0; y <= horizonYears; y++) {
    years.push(y);
    const vals = yearValues[y];
    p10.push(Math.round(getPercentile(vals, 0.1)));
    p25.push(Math.round(getPercentile(vals, 0.25)));
    p50.push(Math.round(getPercentile(vals, 0.5)));
    p75.push(Math.round(getPercentile(vals, 0.75)));
    p90.push(Math.round(getPercentile(vals, 0.9)));
    
    const sum = vals.reduce((a, b) => a + b, 0);
    expectedMean.push(Math.round(sum / vals.length));
  }

  const finalP10 = p10[horizonYears];
  const finalP50 = p50[horizonYears];
  const finalP90 = p90[horizonYears];
  const finalMean = expectedMean[horizonYears];

  // Projected CAGR at median
  const medianFinal = Math.max(1, finalP50);
  const effectiveBase = Math.max(1, initialCapital + (annualSip * horizonYears) / 2);
  const projectedCagrP50 = Number(((Math.pow(medianFinal / effectiveBase, 1 / horizonYears) - 1) * 100).toFixed(2));

  return {
    years,
    p10,
    p25,
    p50,
    p75,
    p90,
    expectedMean,
    finalValues: {
      p10: finalP10,
      p50: finalP50,
      p90: finalP90,
      mean: finalMean,
    },
    lossProbability: Number(((lossCount / numSimulations) * 100).toFixed(1)),
    inflationBeatProbability: Number(((beatInflationCount / numSimulations) * 100).toFixed(1)),
    projectedCagrP50,
  };
}
