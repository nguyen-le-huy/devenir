import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3111/api'
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api$/, '')).replace(/\/$/, '')

let socketInstance = null
let currentToken = null

export const getSocket = (token) => {
  if (!token) return null

  if (socketInstance && currentToken === token) {
    return socketInstance
  }

  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }

  currentToken = token
  socketInstance = io(SOCKET_URL, {
    transports: ['websocket', 'polling'], // Cho phép fallback sang polling nếu websocket fail
    autoConnect: true,
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000, // Tăng timeout cho connection chậm
  })

  // Debug logging cho development
  if (import.meta.env.DEV) {
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message)
    })

    socketInstance.on('disconnect', (reason) => {
      console.warn('🔌 Socket disconnected:', reason)
    })
  }

  return socketInstance
}
