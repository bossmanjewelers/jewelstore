import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, Users, DollarSign } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
const TABS = ['Sales','Inventory','Outstanding','Profit'];
export default function Reports() {
  const [activeTab, setActiveTab] = useState('Sales');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const { data: ss } = useQuery({ queryKey: ['rpt-sales',dateRange], queryFn: ()=>apiGet<any>('/reports/sales-summary',dateRange) });
  const { data: ir } = useQuery({ queryKey: ['rpt-inv'], queryFn: ()=>apiGet<any>('/reports/inventory'), enabled: activeTab==='Inventory' });
  const { data: ob } = useQuery({ queryKey: ['rpt-out'], queryFn: ()=>apiGet<any>('/reports/outstanding-balances'), enabled: activeTab==='Outstanding' });
  const { data: pr } = useQuery({ queryKey: ['rpt-profit',dateRange], queryFn: ()=>apiGet<any>('/reports/profit',dateRange), enabled: activeTab==='Profit' });
  const tabCls = (t: string) => `px-4 py-2.5 text-sm font-medium border-b-2 ${activeTab===t?'border-amber-500 text-amber-600':'border-transparent text-gray-500'}`;
  const card = "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm";
  return (<div className="space-y-5">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Reports</h1>
      <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"><Download size={16} /> Export</button>
    </div>
    <div className="flex flex-wrap gap-3 items-center">
      <input type="date" value={dateRange.from} onChange={(e)=>setDateRange(p=>({...p,from:e.target.value}))} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm" />
      <span className="text-gray-400 text-sm">to</span>
      <input type="date" value={dateRange.to} onChange={(e)=>setDateRange(p=>({...p,to:e.target.value}))} className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm" />
    </div>
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">{TABS.map(t=><button key={t} onClick={()=>setActiveTab(t)} className={tabCls(t)}>{t}</button>)}</div>
    {activeTab==='Sales'&&ss&&<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[{label:'Total Revenue',val:ss.totalRevenue,icn:TrendingUp,color:'bg-green-100'},{label:'Total Sales',val:ss.totalSales,icn:Users,color:'bg-blue-100'},{label:'Avg Order',val:ss.avgOrderValue,icn:DollarSign,color:'bg-amber-100'}].map((x)=><div key={x.label} className={card}>
        <div className="flex items-center gap-3 mb-2"><div className={`w-10 h-10 ${x.color} rounded-xl flex items-center justify-center`}><x.icn size={18} className="text-gray-700" /></div><p className="text-sm text-gray-500">{x.label}</p></div>
        <p className="text-2xl font-bold">{typeof x.val==='number'&&x.label!=='Total Sales'?formatCurrency(x.val):x.val}</p>
      </div>)}
    </div>}
    {activeTab==='Inventory'&&ir&&<div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className={card}><p className="text-sm text-gray-500 mb-1">Total Items</p><p className="text-2xl font-bold">{ir.totalItems}</p></div><div className={card}><p className="text-sm text-gray-500 mb-1">Total Value</p><p className="text-2xl font-bold">{formatCurrency(ir.totalValue)}</p></div></div>
    </div>}
    {activeTab==='Outstanding'&&ob&&<div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-sm text-amber-700 font-medium">Total Outstanding: <strong>{formatCurrency(ob.total)}</strong></p></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-b">{['Customer','Phone','Total Purchase','Total Paid','Balance Due'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{ob.balances.map((b:any)=>(<tr key={b.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{b.customer?.fullName}</td><td className="px-4 py-3 text-gray-500">{b.customer?.phone}</td><td className="px-4 py-3">{formatCurrency(b.totalPurchase)}</td><td className="px-4 py-3 text-green-600">{formatCurrency(b.totalPaid)}</td><td className="px-4 py-3 font-semibold text-red-600">{formatCurrency(b.balance)}</td></tr>))}</tbody>
      </table></div></div>
    </div>}
    {activeTab==='Profit'&&pr&&<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[{label:'Total Revenue',val:format Currency(pr.totalRevenue),color:'text-green-600'},{label:'Total Cost',val:formatCurrency(pr.totalCost),color:'text-red-600'},{label:'Gross Profit',val:formatCurrency(pr.grossProfit),color:'text-blue-600'},{label:'Margin',val:`${pr.profitMargin}%`,color:'text-amber-600'}].map(x=><div key={x.label} className={card}><p className="text-sm text-gray-500 mb-1">{x.label}</p><p className={`text-2xl font-bold ${x.color}`}>{x.val}</p></div>)}</div>}
  </div>);
}
