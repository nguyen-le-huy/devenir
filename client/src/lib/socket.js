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
    transports: ['websocket'],
    autoConnect: true,
    auth: { token },
  })

  return socketInstance
}
