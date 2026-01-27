import logger from '../config/logger.js';
import { getIO } from '../lib/socket.js';

export function emitRealtimeEvent(event, payload = {}) {
  try {
    const io = getIO();
    if (!io) {
      // Socket might not be initialized yet or not running in this context (e.g. scripts)
      return;
    }
    io.emit(event, {
      ...payload,
      event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Realtime emit failed', { event, error: error.message });
  }
}

