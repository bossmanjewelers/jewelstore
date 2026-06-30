import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Receipt, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate, PAYMENT_STATUS_COLORS } from '@/lib/utils';
export default function SalesList() {
  const navigate = useNavigate(); const [search,setSearch] = useState(''); const [page,setPage] = useState(1); const [status,setStatus] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['sales',page,search,status], queryFn: ()=>apiGet<any>('/sales',{page,limit:20,search:search||undefined,paymentStatus:status||undefined}), placeholderData:(prev)=>prev });
  const sales = data?.data||[], pagination = data?.pagination;
  return (<div className="space-y-5">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales</h1><p className="text-sm text-gray-500">{pagination?.total||0} invoices</p></div>
      <button onClick={()=>navigate('/sales/new')} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"><Plus size={16} /> New Invoice</button>
    </div>
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e)=>{setSearch(e.target.value);setPage(1);}} placeholder="Search invoice…" className="w-full pl-9 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-sm" /></div>
      <select value={status} onChange={(e)=>{setStatus(e.target.value);setPage(1);}} className="px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-sm">
        <option value="">All</option><option value="PENDING">Pending</option><option value="PARTIAL">Partial</option><option value="PAID">Paid</option><option value="OVERDUE">Overdue</option>
      </select>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
      {isLoading?<div className="p-8 text-center text-gray-400">Loading…</div>
      :sales.length===0?<div className="p-12 text-center"><Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No sales found</p></div>
      :<div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-b">{['Invoice','Customer','Date','Items','Total','Paid','Balance','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{sales.map((s:any)=>(<tr key={s.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 font-medium text-amber-600">{s.invoiceNumber}</td>
          <td className="px-4 py-3">{s.customer?.fullName}</td>
          <td className="px-4 py-3 text-gray-500">{formatDate(s.saleDate)}</td>
          <td className="px-4 py-3 text-gray-500">{s.items?.length||0}</td>
          <td className="px-4 py-3 font-semibold">{formatCurrency(s.grandTotal)}</td>
          <td className="px-4 py-3 text-green-600">{formatCurrency(s.paidAmount)}</td>
          <td className="px-4 py-3 text-red-600">{formatCurrency(s.balanceAmount)}</td>
          <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[s.paymentStatus]}`}>{s.paymentStatus}</span></td>
          <td className="px-4 py-3"><button onClick={()=>navigate(`/sales/${s.id}`)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-amber-600"><Eye size={15} /></button></td>
        </tr>))}</tbody>
      </table></div>}
      {pagination&&pagination.totalPages>1&&<div className="px-4 py-3 border-t flex items-center justify-between">
        <p className="text-xs text-gray-500">Page {page} of {pagination.totalPages}</p>
        <div className="flex gap-1"><button disabled={!pagination.hasPrev} onClick={()=>setPage(p=>p-1)} className="px-3 py-1.5 text-xs border rounded disabled:opacity-40">Prev</button><button disabled={!pagination.hasNext} onClick={()=>setPage(p=>p+1)} className="px-3 py-1.5 text-xs border rounded disabled:opacity-40">Next</button></div>
      </div>}
    </div>
  </div>);
}
