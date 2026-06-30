import { useQuery } from '@tanstack/react-query';
import { Package, Users, TrendingUp, AlertTriangle, DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
interface DashboardStats { totalInventory: number; totalCustomers: number; todaySales: { amount: number; count: number }; monthlySales: { amount: number; count: number }; outstandingBalance: number; lowStockCount: number; recentSales: any[]; topCategories: any[]; }
const MONTHLY_DATA = [{ month: 'Jan', sales: 42000 }, { month: 'Feb', sales: 58000 }, { month: 'Mar', sales: 51000 }, { month: 'Apr', sales: 73000 }, { month: 'May', sales: 68000 }, { month: 'Jun', sales: 89000 }, { month: 'Jul', sales: 95000 }, { month: 'Aug', sales: 82000 }, { month: 'Sep', sales: 110000 }, { month: 'Oct', sales: 98000 }, { month: 'Nov', sales: 125000 }, { month: 'Dec', sales: 145000 }];
const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];
function KPICard({ title, value, subtitle, icon: Icon, color, trend }: any) {
  return <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div><p className="text-sm text-gray-500 font-medium">{title}</p><p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>{subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}</div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-6 h-6 text-white" /></div>
    </div>
    {trend && <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend.isUp ? 'text-green-600' : 'text-red-500'}`}>{trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(trend.value)}% vs last month</div>}
  </div>;
}
export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({ queryKey: ['dashboard'], queryFn: () => apiGet('/sales/dashboard'), refetchInterval: 60000 });
  if (isLoading) return <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>;
  const kpis = [
    { title: 'Total Inventory', value: stats?.totalInventory?.toLocaleString() || '0', subtitle: 'Active items', icon: Package, color: 'bg-blue-500', trend: { value: 5.2, isUp: true } },
    { title: 'Total Customers', value: stats?.totalCustomers?.toLocaleString() || '0', subtitle: 'Registered', icon: Users, color: 'bg-purple-500', trend: { value: 8.1, isUp: true } },
    { title: "Today's Sales", value: formatCurrency(stats?.todaySales?.amount || 0), subtitle: `${stats?.todaySales?.count || 0} transactions`, icon: ShoppingCart, color: 'bg-amber-500' },
    { title: 'Monthly Sales', value: formatCurrency(stats?.monthlySales?.amount || 0), subtitle: `${stats?.monthlySales?.count || 0} invoices`, icon: TrendingUp, color: 'bg-green-500', trend: { value: 12.4, isUp: true } },
    { title: 'Outstanding Balance', value: formatCurrency(stats?.outstandingBalance || 0), subtitle: 'Customer dues', icon: DollarSign, color: 'bg-red-500' },
    { title: 'Low Stock Alerts', value: stats?.lowStockCount || 0, subtitle: 'Needs attention', icon: AlertTriangle, color: 'bg-orange-500' },
  ];
  return (<div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1><p className="text-gray-500 text-sm">{formatDate(new Date(), 'EEEE, MMMM d, yyyy')}</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">{kpis.map((k) => <KPICard key={k.title} {...k} />)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4"><h2 className="font-semibold">Sales Trend</h2><span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">2024</span></div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY_DATA}>
            <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => [formatCurrency(v), 'Sales']} />
            <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2} fill="url(#sg)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Top Categories</h2>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart><Pie data={[{ name: 'Rings', value: 32 }, { name: 'Necklaces', value: 24 }, { name: 'Earrings', value: 18 }, { name: 'Bangles', value: 14 }, { name: 'Other', value: 12 }]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">{PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}</Pie><Legend iconSize={10} iconType="circle" /><Tooltip formatter={(v: number) => [`${v}%`, '']} /></PieChart>
        </ResponsiveContainer>
      </div>
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between"><h2 className="font-semibold">Recent Transactions</h2><a href="/sales" className="text-xs text-amber-600 font-medium">View all →</a></div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {(stats?.recentSales || []).length === 0 ? <p className="text-center text-gray-400 py-8 text-sm">No transactions yet</p>
          : stats?.recentSales.map((sale: any) => (<div key={sale.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50">
            <div><p className="text-sm font-medium">{sale.invoiceNumber}</p><p className="text-xs text-gray-400">{sale.customer?.fullName} · {formatDate(sale.saleDate)}</p></div>
            <div className="text-right"><p className="text-sm font-semibold">{formatCurrency(sale.grandTotal)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${sale.paymentStatus==='PAID'?'bg-green-100 text-green-700':sale.paymentStatus==='PARTIAL'?'bg-blue-100 text-blue-700':'bg-yellow-100 text-yellow-700'}`}>{sale.paymentStatus}</span></div>
          </div>))}
      </div>
    </div>
  </div>);
}
