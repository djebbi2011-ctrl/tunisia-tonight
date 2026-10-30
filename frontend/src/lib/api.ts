import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ── INSTANCE AXIOS ────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

// Injecter le token sur chaque requête
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tn_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh si 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('tn_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('tn_access_token', data.accessToken);
        localStorage.setItem('tn_refresh_token', data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('tn_access_token');
        localStorage.removeItem('tn_refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// ── AUTH ──────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

// ── HOTELS ───────────────────────────────────────────────
export const hotelsApi = {
  search: (params: any) => api.get('/hotels/search', { params }),
  findAll: (city?: string) => api.get('/hotels', { params: { city } }),
  findOne: (id: string, checkin?: string, checkout?: string) =>
    api.get(`/hotels/${id}`, { params: { checkin, checkout } }),
};

// ── RESERVATIONS ─────────────────────────────────────────
export const reservationsApi = {
  create: (data: any) => api.post('/reservations', data),
  myReservations: () => api.get('/reservations/my'),
  findOne: (id: string) => api.get(`/reservations/${id}`),
};

// ── HOTELIER (EXTRANET) ───────────────────────────────────
export const hotelierApi = {
  dashboard: () => api.get('/hotelier/dashboard'),
  reservations: (status?: string) => api.get('/hotelier/reservations', { params: { status } }),
  validate: (id: string, data: any) => api.patch(`/hotelier/reservations/${id}/validate`, data),
  calendar: (startDate: string, days?: number) =>
    api.get('/hotelier/calendar', { params: { startDate, days } }),
  updateAvailability: (roomTypeId: string, date: string, data: any) =>
    api.put(`/hotelier/availability/${roomTypeId}/${date}`, data),
};

// ── ADMIN ─────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats').then((r) => r.data),
  getDiscountsLog: () => api.get('/discounts/log').then((r) => r.data),
  getContracts: (hotelId?: string) => api.get('/contracts', { params: { hotelId } }).then((r) => r.data),
  getHotels: () => api.get('/admin/hotels').then((r) => r.data),
  getReservations: (status?: string) => api.get('/admin/reservations', { params: { status } }).then((r) => r.data),
  activateContract: (id: string) => api.patch(`/contracts/${id}/activate`).then((r) => r.data),
  uploadContractFile: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/contracts/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
