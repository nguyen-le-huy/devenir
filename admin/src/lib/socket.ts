import { io, type Socket } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3111/api'
const FALLBACK_URL = API_BASE_URL.replace(/\/api$/, '')
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || FALLBACK_URL

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true,
    })
  }
  return socket
}

export function connectAdminSocket() {
  const instance = getSocket()
  if (!instance.connected) {
    const token = localStorage.getItem('token')
    if (token) {
      instance.auth = { token }
    }
    instance.connect()
  }
  return instance
}
