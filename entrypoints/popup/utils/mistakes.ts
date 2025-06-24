/**
 * Mistake simulation logic for realistic typing
 * Handles typo generation and backspace corrections
 */

/**
 * Determines if a mistake should be made based on configuration and limits
 * @param includeMistakes - Whether mistakes are enabled
 * @param mistakeCount - Current number of mistakes made
 * @param maxMistakes - Maximum allowed mistakes
 * @param currentLength - Current text length
 * @returns Whether to make a mistake
 */
export function shouldMakeMistake(
  includeMistakes: boolean,
  mistakeCount: number,
  maxMistakes: number,
  currentLength: number
): boolean {
  return includeMistakes && 
         mistakeCount < maxMistakes && 
         Math.random() < 0.03 && // 3% chance
         currentLength > 0;
}

/**
 * Generate a realistic wrong character based on QWERTY keyboard layout
 * @returns A random wrong character
 */
export function generateWrongCharacter(): string {
  const qwertyRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  const randomRow = qwertyRows[Math.floor(Math.random() * qwertyRows.length)];
  return randomRow[Math.floor(Math.random() * randomRow.length)];
}

/**
 * Calculate maximum allowed mistakes based on text length
 * @param textLength - Total text length
 * @returns Maximum number of mistakes (5% of text length, minimum 1)
 */
export function calculateMaxMistakes(textLength: number): number {
  return Math.max(1, Math.floor(textLength * 0.05));
}