import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Phone, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { formatCurrency, getInitials } from '@/lib/utils';
export default function CustomerList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => apiGet<any>('/customers', { page, limit: 20, search: search || undefined }),
    placeholderData: (prev) => prev,
  });
  const customers = data?.data || [];
  const pagination = data?.pagination;
  return (<div className="space-y-5">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1><p className="text-sm text-gray-500">{pagination?.total || 0} registered</p></div>
      <button onClick={() => navigate('/customers/new')} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Add Customer</button>
    </div>
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search customers…" className="w-full max-w-md pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm" />
    </div>
    {isLoading ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>)
      : customers.length === 0 ? (<div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center"><User className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No customers found</p></div>)
      : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {customers.map((c: any) => (<div key={c.id} onClick={() => navigate(`/customers/${c.id}`)} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md hover:border-amber-300 cursor-pointer transition-all">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">{c.photoUrl ? <img src={c.photoUrl} className="w-full h-full rounded-full object-cover" alt="" /> : getInitials(c.fullName)}</div>
            <div><p className="font-semibold text-gray-900 dark:text-white">{c.fullName}</p><p className="text-xs text-gray-400">{c.customerId}</p></div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} /> {c.phone}</div>
            {c.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12} /> {c.email}</div>}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div><p className="text-xs text-gray-400">Balance</p><p className={`text-sm font-semibold ${Number(c.balance?.balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(c.balance?.balance || 0)}</p></div>
            <div className="text-right"><p className="text-xs text-gray-400">Purchases</p><p className="text-sm font-semibold">{formatCurrency(c.balance?.totalPurchase || 0)}</p></div>
          </div>
        </div>))}
      </div>)}
    {pagination && pagination.totalPages > 1 && (<div className="flex justify-center gap-2">
      <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">← Prev</button>
      <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {pagination.totalPages}</span>
      <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm border rounded-lg disabled:opacity-40">Next →</button>
    </div>)}
  </div>);
}
