import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Gem, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
const schema = z.object({ email: z.string().email('Invalid email'), password: z.string().min(1, 'Password required') });
type FormData = z.infer<typeof schema>;
export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const onSubmit = async (data: FormData) => {
    setError('');
    try { await login(data.email, data.password); navigate('/dashboard');
    } catch (e: any) { setError(e?.response?.data?.message || 'Invalid email or password'); }
  };
  return (<div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-2xl shadow-lg mb-4"><Gem className="w-8 h-8 text-white" /></div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">JewelStore</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Jewelry Management System</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sign in to your account</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input {...register('email')} type="email" placeholder="admin@jewelstore.com" className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="••••••" className="w-full px-4 py-2.5 pr-11 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</> : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-center text-gray-400">Demo: admin@jewelstore.com / Admin@123</p>
        </div>
      </div>
    </div>
  </div>);
}
