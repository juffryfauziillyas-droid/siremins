const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = (
  configuredApiUrl ||
  (import.meta.env.PROD ? "/api" : "http://localhost:5000/api")
).replace(/\/+$/, "");
