import { randomInt } from 'crypto'

// Skup karaktera bez vizuelno sličnih (0/O, 1/I/L) — lakše za usmeno deljenje
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8
const PREFIX = 'AC-'

/**
 * Generiše jedinstven preporuka kod u formatu AC-XXXXXXXX.
 * Koristi crypto.randomInt za kriptografski siguran random.
 * Prostor: 31^8 ≈ 852 milijardi kombinacija.
 */
export function generatePreporukaCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[randomInt(0, CHARSET.length)]
  }
  return `${PREFIX}${code}`
}
