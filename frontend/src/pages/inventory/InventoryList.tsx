import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiDelete } from '@/lib/api';
import { formatCurrency, formatWeight, STOCK_STATUS_COLORS, METAL_TYPE_LABELS, PURITY_LABELS } from '@/lib/utils';
export default function InventoryList() {
  const navigate = useNavigate(); const qc = useQueryClient();
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [metalFilter, setMetalFilter] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['inventory', page, search, metalFilter], queryFn: () => apiGet<any>('/inventory', { page, limit: 20, search: search||undefined, metalType: metalFilter||undefined }), placeholderData: (prev) => prev });
  const deleteMutation = useMutation({ mutationFn: (id: string) => apiDelete(`/inventory/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }) });
  const items = data?.data || [], pagination = data?.pagination;
  return (<div className="space-y-5">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1><p className="text-sm text-gray-500">{pagination?.total||0} items</p></div>
      <button onClick={()=>navigate('/inventory/new')} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Add Item</button>
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e)=>{ setSearch(e.target.value); setPage(1); }} placeholder="Search items…" className="w-full pl-9 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-sm" /></div>
      <select value={metalFilter} onChange={(e)=>{ setMetalFilter(e.target.value); setPage(1); }} className="px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-sm">
        <option value="">All Metals</option><option value="GOLD">Gold</option><option value="SILVER">Silver</option><option value="PLATINUM">Platinum</option><option value="DIAMOND">Diamond</option>
      </select>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
      {isLoading?<div className="p-8 text-center text-gray-400">Loading…</div>
      :items.length===0?<div className="p-12 text-center"><Package className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No items found</p></div>
      :<div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="bg-gray-50 dark:bg-gray-900 border-b">{['Product','Category','Metal/Purity','Weight','Price','Qty','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">{items.map((item: any)=>(<tr key={item.id} className="hover:bg-gray-50">
          <td className="px-4 py-3"><div className="flex items-center gap-3">
            {item.images[0]?<img src={item.images[0]} className="w-10 h-10 rounded-lg object-cover" />:<div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>}
            <div><p className="font-medium text-gray-900 dark:text-white">{item.name}</p><p className="text-xs text-gray-400">{item.productId}</p></div>
          </div></td>
          <td className="px-4 py-3 text-gray-600">{item.category?.name||'—'}</td>
          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">{METAL_TYPE_LABELS[item.metalType]}</span><span className="ml-1 text-xs text-gray-400">{PURITY_LABELS[item.purity]}</span></td>
          <td className="px-4 py-3">{formatWeight(item.weight)}</td>
          <td className="px-4 py-3 font-medium">{formatCurrency(item.sellingPrice)}</td>
          <td className="px-4 py-3"><span className={`flex items-center gap-1 ${item.quantity<=2?'text-red-600':''}`}>{item.quantity<=2&&<AlertTriangle size={12} />} {item.quantity}</span></td>
          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STOCK_STATUS_COLORS[item.stockStatus]}`}>{item.stockStatus.replace('_',' ')}</span></td>
          <td className="px-4 py-3"><div className="flex items-center gap-1">
            <button onClick={()=>navigate(`/inventory/${item.id}/edit`)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-amber-600"><Edit size={15} /></button>
            <button onClick={()=>{ if(confirm('Delete?')) deleteMutation.mutate(item.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 size={15} /></button>
          </div></td>
        </tr>))}</tbody>
      </table></div>}
      {pagination&&pagination.totalPages>1&&<div className="px-4 py-3 border-t flex items-center justify-between">
        <p className="text-xs text-gray-500">Showing {(page-1)*20+1}–{Math.min(page*20,pagination.total)} of {pagination.total}</p>
        <div className="flex gap-1"><button disabled={!pagination.hasPrev} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 text-xs border rounded disabled:opacity-40">Prev</button><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 text-xs border rounded disabled:opacity-40">Next</button></div>
      </div>}
    </div>
  </div>);
}
