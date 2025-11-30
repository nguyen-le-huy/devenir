import logger from '../config/logger.js'

export function emitRealtimeEvent(req, event, payload = {}) {
  try {
    const io = req?.app?.get?.('io')
    if (!io) {
      return
    }
    io.emit(event, {
      ...payload,
      event,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Realtime emit failed', { event, error: error.message })
  }
}
