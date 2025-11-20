export const FRONTEND_PORT = process.env.FRONTEND_PORT ?? '7501';
export const BACKEND_PORT = process.env.BACKEND_PORT ?? '7500';

export const FRONTEND_URL = process.env.FRONTEND_URL ?? `http://localhost:${FRONTEND_PORT}`;
export const BACKEND_URL = process.env.BACKEND_URL ?? `http://localhost:${BACKEND_PORT}`;
export const WS_URL = process.env.WS_URL ?? `ws://localhost:${BACKEND_PORT}`;
