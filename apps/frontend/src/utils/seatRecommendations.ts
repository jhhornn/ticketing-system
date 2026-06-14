/**
 * Seat Recommendation Algorithm
 * 
 * Provides intelligent seat suggestions based on:
 * - Contiguous seating (seats together)
 * - Price vs proximity balance
 * - Availability confidence (avoiding nearly-expired reservations)
 * 
 * Frontend-only implementation using existing seat map data.
 */

import type { Seat, Section, SeatMapData } from '../hooks/useSeatSelection';
import { calculateRemainingTime } from './seatStatusUtils';

export interface SeatGroup {
  seats: Seat[];
  section: string;
  score: number;
  averagePrice: number;
  isContiguous: boolean;
  scoreBreakdown: {
    contiguityScore: number;
    priceScore: number;
    proximityScore: number;
    availabilityScore: number;
  };
}

export interface RecommendationOptions {
  desiredSeatCount: number;
  maxPricePer?: number;
  minPricePer?: number;
  preferredSections?: string[];
}

/**
 * Calculate time-based availability confidence score
 * Avoids seats that are reserved and expiring soon (might be taken)
 */
function calculateAvailabilityScore(seat: Seat): number {
  if (seat.status === 'AVAILABLE') {
    return 1.0; // Perfect availability
  }
  
  if (seat.status === 'BOOKED' || seat.status === 'BLOCKED') {
    return 0; // Not available
  }
  
  if (seat.status === 'RESERVED' && seat.reservedUntil) {
    const remainingSeconds = calculateRemainingTime(seat.reservedUntil);
    
    if (!remainingSeconds || remainingSeconds <= 0) {
      return 0.9; // About to expire, likely to become available
    }
    
    // Avoid seats reserved for more than 30 seconds (likely to be purchased)
    if (remainingSeconds > 30) {
      return 0.1; // Low confidence
    }
    
    // Seats expiring in 10-30 seconds - medium confidence
    return 0.5;
  }
  
  return 0;
}

/**
 * Calculate contiguity score based on seat grouping
 * Higher score for more seats together in a row
 */
function calculateContiguityScore(seats: Seat[], requestedCount: number): number {
  if (seats.length === 0) return 0;
  if (seats.length === 1) return 0.3; // Single seats get low score
  
  // Group seats by row
  const seatsByRow = new Map<string, Seat[]>();
  
  seats.forEach(seat => {
    const row = seat.rowNumber || 'unknown';
    if (!seatsByRow.has(row)) {
      seatsByRow.set(row, []);
    }
    seatsByRow.get(row)!.push(seat);
  });
  
  // Find the largest contiguous group in any row
  let maxContiguousSeats = 0;
  
  seatsByRow.forEach(rowSeats => {
    // Sort by seat number to find contiguous blocks
    const sortedSeats = rowSeats.sort((a, b) => {
      const numA = parseInt(a.seatNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.seatNumber.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    
    let currentContiguous = 1;
    let maxInRow = 1;
    
    for (let i = 1; i < sortedSeats.length; i++) {
      const prevNum = parseInt(sortedSeats[i - 1].seatNumber.replace(/\D/g, '')) || 0;
      const currNum = parseInt(sortedSeats[i].seatNumber.replace(/\D/g, '')) || 0;
      
      // Check if seats are adjacent (difference of 1)
      if (currNum === prevNum + 1) {
        currentContiguous++;
        maxInRow = Math.max(maxInRow, currentContiguous);
      } else {
        currentContiguous = 1;
      }
    }
    
    maxContiguousSeats = Math.max(maxContiguousSeats, maxInRow);
  });
  
  // Score based on how many seats are contiguous
  const contiguityRatio = maxContiguousSeats / requestedCount;
  
  if (contiguityRatio >= 1.0) {
    return 1.0; // All seats together
  } else if (contiguityRatio >= 0.8) {
    return 0.9; // Most seats together
  } else if (contiguityRatio >= 0.5) {
    return 0.6; // Half together
  } else {
    return 0.3; // Scattered
  }
}

/**
 * Calculate price score (lower prices get higher scores)
 * Normalizes based on section price ranges
 */
function calculatePriceScore(seats: Seat[], minPrice: number, maxPrice: number): number {
  if (seats.length === 0) return 0;
  if (minPrice === maxPrice) return 1.0;
  
  const avgPrice = seats.reduce((sum, seat) => sum + seat.price, 0) / seats.length;
  const priceRange = maxPrice - minPrice;
  
  // Invert the score - lower prices get higher scores
  // But not too low (prefer middle-tier pricing)
  const normalizedPrice = (avgPrice - minPrice) / priceRange;
  
  // Sweet spot is 20-50% of the price range (good value)
  if (normalizedPrice >= 0.2 && normalizedPrice <= 0.5) {
    return 1.0;
  } else if (normalizedPrice < 0.2) {
    // Very cheap seats might be far from stage
    return 0.7 + normalizedPrice * 1.5;
  } else {
    // More expensive seats - diminishing returns
    return 1.0 - (normalizedPrice - 0.5);
  }
}

/**
 * Calculate proximity score based on row position
 * Assumes lower row numbers or letters are closer to stage
 */
function calculateProximityScore(seats: Seat[]): number {
  if (seats.length === 0) return 0;
  
  // Extract row identifiers and calculate average position
  const rowScores = seats.map(seat => {
    if (!seat.rowNumber) return 0.5; // Unknown row = middle score
    
    const row = seat.rowNumber.toUpperCase();
    
    // If row is a letter (A, B, C...)
    const letterMatch = row.match(/^([A-Z])/);
    if (letterMatch) {
      const letterCode = letterMatch[1].charCodeAt(0) - 'A'.charCodeAt(0);
      // Normalize: A=1.0, B=0.95, C=0.9, etc.
      return Math.max(0.1, 1.0 - (letterCode * 0.05));
    }
    
    // If row is a number
    const numberMatch = row.match(/\d+/);
    if (numberMatch) {
      const rowNum = parseInt(numberMatch[0]);
      // Normalize: 1-5 = excellent, 6-15 = good, 16+ = ok
      if (rowNum <= 5) return 1.0;
      if (rowNum <= 10) return 0.9;
      if (rowNum <= 15) return 0.7;
      if (rowNum <= 20) return 0.5;
      return 0.3;
    }
    
    return 0.5;
  });
  
  return rowScores.reduce((sum, score) => sum + score, 0) / rowScores.length;
}

/**
 * Find all possible seat groups of the desired size
 */
function generateSeatGroups(
  section: Section,
  desiredCount: number,
  options: RecommendationOptions
): SeatGroup[] {
  const groups: SeatGroup[] = [];
  
  // Filter available seats based on options
  const availableSeats = section.seats.filter(seat => {
    // Must be available
    if (seat.status !== 'AVAILABLE') {
      // Only consider reserved seats if they're about to expire
      if (seat.status === 'RESERVED' && seat.reservedUntil) {
        const remaining = calculateRemainingTime(seat.reservedUntil);
        if (!remaining || remaining > 30) return false;
      } else {
        return false;
      }
    }
    
    // Price filters
    if (options.maxPricePer && seat.price > options.maxPricePer) return false;
    if (options.minPricePer && seat.price < options.minPricePer) return false;
    
    return true;
  });
  
  if (availableSeats.length < desiredCount) return groups;
  
  // Generate combinations of seats
  // For performance, limit to reasonable group sizes
  if (desiredCount <= 6) {
    // For small groups, try all combinations
    const combinations = generateCombinations(availableSeats, desiredCount);
    
    combinations.forEach(seatCombo => {
      const group = scoreSeatGroup(seatCombo, section.name, options);
      groups.push(group);
    });
  } else {
    // For larger groups, use heuristic approach (find contiguous blocks)
    const contiguousGroups = findContiguousGroups(availableSeats, desiredCount);
    
    contiguousGroups.forEach(seatCombo => {
      const group = scoreSeatGroup(seatCombo, section.name, options);
      groups.push(group);
    });
  }
  
  return groups;
}

/**
 * Generate combinations of seats (for small groups)
 */
function generateCombinations(seats: Seat[], size: number): Seat[][] {
  const results: Seat[][] = [];
  
  // Limit combinations to prevent performance issues
  const maxCombinations = 100;
  
  function combine(start: number, combo: Seat[]) {
    if (combo.length === size) {
      results.push([...combo]);
      return;
    }
    
    if (results.length >= maxCombinations) return;
    
    for (let i = start; i < seats.length && results.length < maxCombinations; i++) {
      combo.push(seats[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  
  combine(0, []);
  return results.slice(0, maxCombinations);
}

/**
 * Find contiguous groups of seats (for larger groups)
 */
function findContiguousGroups(seats: Seat[], desiredCount: number): Seat[][] {
  const groups: Seat[][] = [];
  
  // Group by row
  const seatsByRow = new Map<string, Seat[]>();
  seats.forEach(seat => {
    const row = seat.rowNumber || 'unknown';
    if (!seatsByRow.has(row)) {
      seatsByRow.set(row, []);
    }
    seatsByRow.get(row)!.push(seat);
  });
  
  // Find contiguous blocks in each row
  seatsByRow.forEach(rowSeats => {
    const sortedSeats = rowSeats.sort((a, b) => {
      const numA = parseInt(a.seatNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.seatNumber.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    
    let currentBlock: Seat[] = [sortedSeats[0]];
    
    for (let i = 1; i < sortedSeats.length; i++) {
      const prevNum = parseInt(sortedSeats[i - 1].seatNumber.replace(/\D/g, '')) || 0;
      const currNum = parseInt(sortedSeats[i].seatNumber.replace(/\D/g, '')) || 0;
      
      if (currNum === prevNum + 1) {
        currentBlock.push(sortedSeats[i]);
      } else {
        if (currentBlock.length >= desiredCount) {
          // Take the first N seats from this block
          groups.push(currentBlock.slice(0, desiredCount));
        }
        currentBlock = [sortedSeats[i]];
      }
    }
    
    // Check last block
    if (currentBlock.length >= desiredCount) {
      groups.push(currentBlock.slice(0, desiredCount));
    }
  });
  
  // If no perfect contiguous blocks, return best partial groups
  if (groups.length === 0 && seats.length >= desiredCount) {
    // Take first N seats sorted by row and seat number
    const sortedSeats = [...seats].sort((a, b) => {
      if (a.rowNumber !== b.rowNumber) {
        return (a.rowNumber || '').localeCompare(b.rowNumber || '');
      }
      const numA = parseInt(a.seatNumber.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.seatNumber.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    
    groups.push(sortedSeats.slice(0, desiredCount));
  }
  
  return groups;
}

/**
 * Score a seat group based on all criteria
 */
function scoreSeatGroup(
  seats: Seat[],
  sectionName: string,
  options: RecommendationOptions
): SeatGroup {
  // Calculate price range for normalization
  const prices = seats.map(s => s.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
  
  // Calculate individual scores
  const contiguityScore = calculateContiguityScore(seats, options.desiredSeatCount);
  const priceScore = calculatePriceScore(seats, minPrice, maxPrice);
  const proximityScore = calculateProximityScore(seats);
  
  // Calculate average availability score
  const availabilityScore = 
    seats.reduce((sum, seat) => sum + calculateAvailabilityScore(seat), 0) / seats.length;
  
  // Weighted total score
  // Contiguity is most important (40%), then price (25%), proximity (20%), availability (15%)
  const totalScore = 
    (contiguityScore * 0.40) +
    (priceScore * 0.25) +
    (proximityScore * 0.20) +
    (availabilityScore * 0.15);
  
  // Boost score if in preferred section
  const sectionBoost = options.preferredSections?.includes(sectionName) ? 0.1 : 0;
  const finalScore = Math.min(1.0, totalScore + sectionBoost);
  
  return {
    seats,
    section: sectionName,
    score: finalScore,
    averagePrice: avgPrice,
    isContiguous: contiguityScore >= 0.9,
    scoreBreakdown: {
      contiguityScore,
      priceScore,
      proximityScore,
      availabilityScore,
    },
  };
}

/**
 * Get recommended seat groups for the entire event
 * Returns top N recommendations sorted by score
 */
export function getRecommendedSeats(
  seatMap: SeatMapData,
  options: RecommendationOptions,
  topN: number = 3
): SeatGroup[] {
  const allGroups: SeatGroup[] = [];
  
  // Generate groups from each section
  seatMap.sections.forEach(section => {
    const groups = generateSeatGroups(section, options.desiredSeatCount, options);
    allGroups.push(...groups);
  });
  
  // Sort by score (descending) and return top N
  return allGroups
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

/**
 * Check if a seat is part of a recommended group
 */
export function isSeatRecommended(seatId: number, recommendations: SeatGroup[]): boolean {
  return recommendations.some(group =>
    group.seats.some(seat => seat.id === seatId)
  );
}

/**
 * Get the recommendation rank for a seat (1 = best, 2 = second best, etc.)
 * Returns null if seat is not recommended
 */
export function getSeatRecommendationRank(
  seatId: number,
  recommendations: SeatGroup[]
): number | null {
  for (let i = 0; i < recommendations.length; i++) {
    if (recommendations[i].seats.some(seat => seat.id === seatId)) {
      return i + 1;
    }
  }
  return null;
}

/**
 * Format recommendation info for display
 */
export function formatRecommendationInfo(group: SeatGroup): string {
  const seatNumbers = group.seats.map(s => s.seatNumber).join(', ');
  const priceRange = group.seats.length > 1
    ? `$${Math.min(...group.seats.map(s => s.price)).toFixed(2)} - $${Math.max(...group.seats.map(s => s.price)).toFixed(2)}`
    : `$${group.averagePrice.toFixed(2)}`;
  
  const quality = group.score >= 0.8 ? 'Excellent' :
                  group.score >= 0.6 ? 'Good' :
                  group.score >= 0.4 ? 'Fair' : 'Available';
  
  return `${quality} • ${group.section} • Seats ${seatNumbers} • ${priceRange}`;
}
