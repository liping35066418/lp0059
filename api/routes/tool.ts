import { Router, type Request, type Response } from 'express'
import {
  encodeUrl,
  decodeUrl,
  encodeBase64,
  decodeBase64,
  encodeUnicode,
  decodeUnicode,
  encodeHtml,
  decodeHtml,
  encodeHex,
  decodeHex,
} from '../services/encoder.js'
import { encrypt, decrypt } from '../services/crypto.js'
import {
  appendLog,
  readHistory,
  writeHistory,
  generateId,
  clearLogs,
  getTodayLogs,
  type HistoryItem,
} from '../utils/storage.js'

const router = Router()

interface EncodeDecodeBody {
  type: string
  content: string
}

interface EncryptDecryptBody {
  content: string
  key: string
}

interface HistoryBody {
  type: string
  subType: string
  input: string
  output: string
}

router.post('/encode', async (req: Request, res: Response): Promise<void> => {
  const { type, content } = req.body as EncodeDecodeBody
  try {
    if (!type || content === undefined) {
      appendLog('encode', type || 'unknown', 'error', 'Missing parameters')
      res.status(400).json({ success: false, error: 'Missing parameters' })
      return
    }
    let result: string
    switch (type) {
      case 'url':
        result = encodeUrl(content)
        break
      case 'base64':
        result = encodeBase64(content)
        break
      case 'unicode':
        result = encodeUnicode(content)
        break
      case 'html':
        result = encodeHtml(content)
        break
      case 'hex':
        result = encodeHex(content)
        break
      default:
        appendLog('encode', type, 'error', 'Unknown encode type')
        res.status(400).json({ success: false, error: 'Unknown encode type' })
        return
    }
    appendLog('encode', type, 'success')
    res.json({ success: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Encode failed'
    appendLog('encode', type, 'error', msg)
    res.status(500).json({ success: false, error: msg })
  }
})

router.post('/decode', async (req: Request, res: Response): Promise<void> => {
  const { type, content } = req.body as EncodeDecodeBody
  try {
    if (!type || content === undefined) {
      appendLog('decode', type || 'unknown', 'error', 'Missing parameters')
      res.status(400).json({ success: false, error: 'Missing parameters' })
      return
    }
    let result: string
    switch (type) {
      case 'url':
        result = decodeUrl(content)
        break
      case 'base64':
        result = decodeBase64(content)
        break
      case 'unicode':
        result = decodeUnicode(content)
        break
      case 'html':
        result = decodeHtml(content)
        break
      case 'hex':
        result = decodeHex(content)
        break
      default:
        appendLog('decode', type, 'error', 'Unknown decode type')
        res.status(400).json({ success: false, error: 'Unknown decode type' })
        return
    }
    appendLog('decode', type, 'success')
    res.json({ success: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Decode failed'
    appendLog('decode', type, 'error', msg)
    res.status(500).json({ success: false, error: msg })
  }
})

router.post('/encrypt', async (req: Request, res: Response): Promise<void> => {
  const { content, key } = req.body as EncryptDecryptBody
  try {
    if (content === undefined || !key) {
      appendLog('encrypt', 'aes', 'error', 'Missing parameters')
      res.status(400).json({ success: false, error: 'Missing parameters' })
      return
    }
    const result = encrypt(content, key)
    appendLog('encrypt', 'aes', 'success')
    res.json({ success: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Encrypt failed'
    appendLog('encrypt', 'aes', 'error', msg)
    res.status(500).json({ success: false, error: msg })
  }
})

router.post('/decrypt', async (req: Request, res: Response): Promise<void> => {
  const { content, key } = req.body as EncryptDecryptBody
  try {
    if (content === undefined || !key) {
      appendLog('decrypt', 'aes', 'error', 'Missing parameters')
      res.status(400).json({ success: false, error: 'Missing parameters' })
      return
    }
    const result = decrypt(content, key)
    appendLog('decrypt', 'aes', 'success')
    res.json({ success: true, result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Decrypt failed'
    appendLog('decrypt', 'aes', 'error', msg)
    res.status(500).json({ success: false, error: msg })
  }
})

router.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = readHistory()
    appendLog('history', 'list', 'success')
    res.json({ success: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Read history failed'
    appendLog('history', 'list', 'error', msg)
    res.status(500).json({ success: false, error: msg })
  }
})

router.post('/history', async (req: Request, res: Response): Promise<void> => {
  const { type, subType, input, output } = req.body as HistoryBody
  try {
    if (!type || !subType || input === undefined || output === undefined) {
      appendLog('history', 'add', 'error', 'Missing parameters')
      res.status(400).json({ success: false, error: 'Missing parameters' })
      return
    }
    const items = readHistory()
    const newItem: HistoryItem = {
      id: generateId(),
      type,
      subType,
      input,
      output,
      createdAt: new Date().toISOString(),
      favorited: false,
    }
    items.unshift(newItem)
    writeHistory(items)
    appendLog('history', 'add', 'success')
    res.json({ success: true, data: newItem })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Add history failed'
    appendLog('history', 'add', 'error', msg)
    res.status(500).json({ success: false, error: msg })
  }
})

router.put('/history/:id/favorite', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  try {
    const items = readHistory()
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) {
      appendLog('history', 'favorite', 'error', 'History not found')
      res.status(404).json({ success: false, error: 'History not found' })
      return
    }
    items[index].favorited = !items[index].favorited
    writeHistory(items)
    appendLog('history', 'favorite', 'success')
    res.json({ success: true, data: items[index] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Toggle favorite failed'
    appendLog('history', 'favorite', 'error', msg)
    res.status(500).json({ success: false, error: msg })
  }
})

router.delete('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    writeHistory([])
    appendLog('history', 'clear', 'success')
    res.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Clear history failed'
    appendLog('history', 'clear', 'error', msg)
    res.status(500).json({ success: false, error: msg })
  }
})

router.get('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = getTodayLogs()
    appendLog('logs', 'list', 'success')
    res.json({ success: true, data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Read logs failed'
    res.status(500).json({ success: false, error: msg })
  }
})

router.delete('/logs', async (req: Request, res: Response): Promise<void> => {
  try {
    clearLogs()
    appendLog('logs', 'clear', 'success')
    res.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Clear logs failed'
    res.status(500).json({ success: false, error: msg })
  }
})

export default router
