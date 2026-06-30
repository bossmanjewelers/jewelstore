import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
const API_URL = import.meta.env.VITE_API_URL || '/api';
export const api = axios.create({ baseURL: API_URL, timeout: 30000, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];
const processQueue = (error: unknown, token: string | null = null) => { queue.forEach(({ resolve, reject }) => (token ? resolve(token) : reject(error))); queue = []; };
api.interceptors.response.use((r) => r, async (error: AxiosError) => {
  const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
  if (error.response?.status === 401 && !original._retry) {
    if (isRefreshing) return new Promise((res, rej) => queue.push({ resolve: res, reject: rej })).then((t) => { original.headers.Authorization = `Bearer ${t}`; return api(original); });
    original._retry = true; isRefreshing = true;
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      processQueue(null, data.data.accessToken);
      original.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(original);
    } catch (err) { processQueue(err, null); localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); window.location.href = '/login'; return Promise.reject(err);
    } finally { isRefreshing = false; }
  }
  return Promise.reject(error);
});
export const apiGet = <T>(url: string, params?: object) => api.get<{ success: boolean; data: T }>(url, { params }).then((r) => r.data.data);
export const apiPost = <T>(url: string, data?: object) => api.post<{ success: boolean; data: T; message: string }>(url, data).then((r) => r.data);
export const apiPut = <T>(url: string, data?: object) => api.put<{ success: boolean; data: T; message: string }>(url, data).then((r) => r.data);
export const apiPatch = <T>(url: string, data?: object) => api.patch<{ success: boolean; data: T; message: string }>(url, data).then((r) => r.data);
export const apiDelete = <T>(url: string) => api.delete<{ success: boolean; data: T; message: string }>(url).then((r) => r.data);
