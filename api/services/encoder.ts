export function encodeUrl(content: string): string {
  try {
    return encodeURIComponent(content)
  } catch {
    throw new Error('URL encode failed')
  }
}

export function decodeUrl(content: string): string {
  try {
    return decodeURIComponent(content)
  } catch {
    throw new Error('URL decode failed')
  }
}

export function encodeBase64(content: string): string {
  try {
    return Buffer.from(content, 'utf-8').toString('base64')
  } catch {
    throw new Error('Base64 encode failed')
  }
}

export function decodeBase64(content: string): string {
  try {
    return Buffer.from(content, 'base64').toString('utf-8')
  } catch {
    throw new Error('Base64 decode failed')
  }
}

export function encodeUnicode(content: string): string {
  try {
    let result = ''
    for (let i = 0; i < content.length; i++) {
      const code = content.charCodeAt(i)
      result += '\\u' + code.toString(16).padStart(4, '0')
    }
    return result
  } catch {
    throw new Error('Unicode encode failed')
  }
}

export function decodeUnicode(content: string): string {
  try {
    return content.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
  } catch {
    throw new Error('Unicode decode failed')
  }
}

export function encodeHtml(content: string): string {
  try {
    const map: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return content.replace(/[<>&"']/g, (char) => map[char])
  } catch {
    throw new Error('HTML encode failed')
  }
}

export function decodeHtml(content: string): string {
  try {
    const map: Record<string, string> = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
    }
    return content.replace(
      /&(lt|gt|amp|quot|#39);/g,
      (entity) => map[entity],
    )
  } catch {
    throw new Error('HTML decode failed')
  }
}

export function encodeHex(content: string): string {
  try {
    return Buffer.from(content, 'utf-8').toString('hex')
  } catch {
    throw new Error('Hex encode failed')
  }
}

export function decodeHex(content: string): string {
  try {
    return Buffer.from(content, 'hex').toString('utf-8')
  } catch {
    throw new Error('Hex decode failed')
  }
}
