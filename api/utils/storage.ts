import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', '..', 'data')
const LOGS_DIR = path.join(DATA_DIR, 'logs')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')

export interface HistoryItem {
  id: string
  type: string
  subType: string
  input: string
  output: string
  createdAt: string
  favorited: boolean
}

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true })
  }
}

export function readHistory(): HistoryItem[] {
  ensureDataDir()
  if (!fs.existsSync(HISTORY_FILE)) {
    return []
  }
  try {
    const content = fs.readFileSync(HISTORY_FILE, 'utf-8')
    const data = JSON.parse(content) as (HistoryItem & { favorited?: boolean })[]
    return data.map((item) => ({
      ...item,
      favorited: item.favorited ?? false,
    }))
  } catch {
    return []
  }
}

export function writeHistory(items: HistoryItem[]): void {
  ensureDataDir()
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

function getLogFileName(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `app-${yyyy}${mm}${dd}.log`
}

export function appendLog(
  action: string,
  type: string,
  status: 'success' | 'error',
  message?: string,
): void {
  ensureDataDir()
  const logFile = path.join(LOGS_DIR, getLogFileName())
  const now = new Date()
  const timeStr = now.toISOString().replace('T', ' ').substring(0, 19)
  const msg = message ? ` - ${message}` : ''
  const line = `[${timeStr}] [${status}] ${action}:${type}${msg}\n`
  fs.appendFileSync(logFile, line, 'utf-8')
}

export function clearLogs(): void {
  ensureDataDir()
  if (fs.existsSync(LOGS_DIR)) {
    const files = fs.readdirSync(LOGS_DIR)
    for (const file of files) {
      if (file.endsWith('.log')) {
        fs.unlinkSync(path.join(LOGS_DIR, file))
      }
    }
  }
}

export function getTodayLogs(): string[] {
  ensureDataDir()
  const logFile = path.join(LOGS_DIR, getLogFileName())
  if (!fs.existsSync(logFile)) {
    return []
  }
  const content = fs.readFileSync(logFile, 'utf-8')
  return content.split('\n').filter((line) => line.trim() !== '')
}

export function generateId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).substring(2, 10)
  )
}
