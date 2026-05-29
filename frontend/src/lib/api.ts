import axios from "axios";

// Khi build production, VITE_API_URL trỏ tới backend Render URL.
// Khi dev local, để trống → Vite proxy xử lý /api/
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
});
export default api;
