import { io } from 'socket.io-client';
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL;

export const socket = io(SOCKET_SERVER_URL, {
    autoConnect: false,
    transports: ['websocket'],
});
