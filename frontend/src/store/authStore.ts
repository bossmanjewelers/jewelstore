import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiPost } from '../lib/api';
interface User { id: string; name: string; email: string; role: 'ADMIN'|'MANAGER'|'SALES_STAFF'; avatarUrl?: string; }
interface AuthState { user: User|null; accessToken: string|null; isAuthenticated: boolean; isLoading: boolean; login:(email:string,password:string)=>Promise<void>; logout:()=>void; setUser:(user:User)=>void; }
export const useAuthStore = create<AuthState>()(persist((set)=>({
  user: null, accessToken: null, isAuthenticated: false, isLoading: false,
  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await apiPost<{ user: User; accessToken: string; refreshToken: string }>('/auth/login',{ email, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      set({ user: res.data.user, accessToken: res.data.accessToken, isAuthenticated: true });
    } finally { set({ isLoading: false }); }
  },
  logout: () => {
    apiPost('/auth/logout').catch(()=>{});
    localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
  setUser: (user: User) => set({ user }),
}),{ name: 'auth-store', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) }));
