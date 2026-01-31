/**
 * Client-side logging utility
 * Displays backend console logs in browser console
 */

class ValidationLogger {
  constructor() {
    this.logs = []
  }

  addLog(type, message, data) {
    this.logs.push({ type, message, data, timestamp: new Date().toISOString() })
  }

  getLogs() {
    return this.logs
  }

  clear() {
    this.logs = []
  }

  displayInConsole() {
    console.clear()
    console.log('%c🔍 Email Validation Logs', 'font-size: 16px; font-weight: bold; color: #5a67d8;')
    console.log('═'.repeat(80))

    this.logs.forEach((log) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString()

      switch (log.type) {
        case 'start':
          console.log(
            `%c🔍 [${timestamp}] ${log.message}`,
            'color: #667eea; font-weight: bold; font-size: 14px;'
          )
          if (log.data) console.table(log.data)
          break

        case 'success':
          console.log(`%c✅ [${timestamp}] ${log.message}`, 'color: #22c55e; font-weight: 500;')
          if (log.data) console.log(log.data)
          break

        case 'warning':
          console.log(`%c⚠️ [${timestamp}] ${log.message}`, 'color: #f59e0b; font-weight: 500;')
          if (log.data) console.log(log.data)
          break

        case 'error':
          console.log(`%c❌ [${timestamp}] ${log.message}`, 'color: #ef4444; font-weight: bold;')
          if (log.data) console.log(log.data)
          break

        case 'api':
          console.log(`%c📡 [${timestamp}] ${log.message}`, 'color: #3b82f6; font-style: italic;')
          if (log.data) console.log(log.data)
          break

        case 'step':
          console.log(`%c🔄 [${timestamp}] ${log.message}`, 'color: #8b5cf6; font-weight: 500;')
          break

        default:
          console.log(`%c[${timestamp}] ${log.message}`, 'color: #6b7280;')
          if (log.data) console.log(log.data)
      }
    })

    console.log('═'.repeat(80))
    console.log('%c✨ Validation Complete', 'font-size: 14px; font-weight: bold; color: #5a67d8;')
  }
}
