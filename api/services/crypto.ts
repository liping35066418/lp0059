import crypto from 'crypto'

const ALGORITHM = 'aes-128-ecb'
const KEY_LENGTH = 16

function processKey(key: string): Buffer {
  const keyBuf = Buffer.from(key, 'utf-8')
  if (keyBuf.length === KEY_LENGTH) {
    return keyBuf
  }
  if (keyBuf.length > KEY_LENGTH) {
    return keyBuf.subarray(0, KEY_LENGTH)
  }
  const padded = Buffer.alloc(KEY_LENGTH)
  keyBuf.copy(padded)
  return padded
}

export function encrypt(content: string, key: string): string {
  try {
    const keyBuf = processKey(key)
    const cipher = crypto.createCipheriv(ALGORITHM, keyBuf, null)
    cipher.setAutoPadding(true)
    let encrypted = cipher.update(content, 'utf-8', 'base64')
    encrypted += cipher.final('base64')
    return encrypted
  } catch {
    throw new Error('Encrypt failed')
  }
}

export function decrypt(encrypted: string, key: string): string {
  try {
    const keyBuf = processKey(key)
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, null)
    decipher.setAutoPadding(true)
    let decrypted = decipher.update(encrypted, 'base64', 'utf-8')
    decrypted += decipher.final('utf-8')
    return decrypted
  } catch {
    throw new Error('Decrypt failed')
  }
}
