/**
 * Enhanced typo detection with suggestions
 */

import { checkTypo as originalCheckTypo } from '../typo/typo'

interface TypoResult {
  isTypo: boolean
  suggestion?: string
  confidence?: number
}

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Check for common typos and provide suggestions
 */
export const checkTypoWithSuggestion = async (
  email: string,
  additionalTopLevelDomains?: string[]
): Promise<TypoResult> => {
  const result = await originalCheckTypo(email, additionalTopLevelDomains)
  
  if (!result) {
    return { isTypo: false }
  }

  // Parse email
  const [localPart, domain] = email.toLowerCase().split('@')
  
  // Common domain typos and their corrections
  const commonTypos: Record<string, string> = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yahou.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmail.co': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outlook.co': 'outlook.com',
    'outloo.com': 'outlook.com',
    'live.co': 'live.com',
    'aol.co': 'aol.com',
    'icloud.co': 'icloud.com',
    'protomail.com': 'protonmail.com',
    'zoho.co': 'zoho.com',
    'mail.co': 'mail.com',
    'gmx.co': 'gmx.com'
  }

  let suggestion = commonTypos[domain]
  let confidence = 0.95

  // If no exact match found, look for similar domains
  if (!suggestion) {
    const possibleCorrections = Object.keys(commonTypos)
    let bestMatch = ''
    let bestDistance = Infinity

    for (const correction of possibleCorrections) {
      const distance = levenshteinDistance(domain, correction)
      if (distance < bestDistance && distance <= 2) {
        bestDistance = distance
        bestMatch = correction
      }
    }

    if (bestMatch) {
      suggestion = commonTypos[bestMatch]
      // Confidence decreases with distance
      confidence = Math.max(0.7, 0.95 - bestDistance * 0.1)
    }
  }

  if (suggestion) {
    return {
      isTypo: true,
      suggestion: `${localPart}@${suggestion}`,
      confidence
    }
  }

  return { isTypo: true }
}

/**
 * Get list of likely typo corrections for a domain
 */
export const getSuggestedDomains = (domain: string): string[] => {
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com',
    'aol.com', 'icloud.com', 'mail.com', 'gmx.com', 'protonmail.com',
    'zoho.com', 'yandex.com', 'fastmail.com', 'tutanota.com'
  ]

  const suggestions: Array<{ domain: string; distance: number }> = []

  for (const candidate of commonDomains) {
    const distance = levenshteinDistance(domain, candidate)
    if (distance <= 2 && distance > 0) {
      suggestions.push({ domain: candidate, distance })
    }
  }

  return suggestions.sort((a, b) => a.distance - b.distance).map(s => s.domain)
}
