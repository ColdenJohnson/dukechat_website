const ENV_OPENWEBUI_URL = process.env.NEXT_PUBLIC_OPENWEBUI_URL;

export const OPENWEBUI_URL =
  ENV_OPENWEBUI_URL && ENV_OPENWEBUI_URL.trim().length > 0
    ? ENV_OPENWEBUI_URL.trim()
    : 'http://67.159.73.73:3000/';
