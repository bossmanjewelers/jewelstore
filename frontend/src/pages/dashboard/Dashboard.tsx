import { useQuery } from '@tanstack/react-query';
import {
  Package, Users, TrendingUp, AlertTriangle,
  DollarSign, ShoppingCart, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DashboardStats {
  totalInventory:     number;
  totalCustomers:     number;
  todaySales:         { amount: number; count: number };
  monthlySales:       { amount: number; count: number };
  outstandingBalance: number;
  lowStockCount:      number;
  recentSales:        any[];
  topCategories:      any[];
}

const MONTHLY_DATA = [
  { month: 'Jan', sales: 42000 }, { month: 'Feb', sales: 58000 },
  { month: 'Mar', sales: 51000 }, { month: 'Apr', sales: 73000 },
  { month: 'May', sales: 68000 }, { month: 'Jun', sales: 89000 },
  { month: 'Jul', sales: 95000 }, { month: 'Aug', sales: 82000 },
  { month: 'Sep', sales: 110000 }, { month: 'Oct', sales: 98000 },
  { month: 'Nov', sales: 125000 }, { month: 'Dec', sales: 145000 },
];

const PIE_DATA = [
  { name: 'Rings', value: 32 },
  { name: 'Necklaces', value: 24 },
  { name: 'Earrings', value: 18 },
  { name: 'Bangles', value: 14 },
  { name: 'Other', value: 12 },
];

const PIE_COLORS = ['#C9A84C', '#9E7B2F', '#E8D48A', '#7a5c1e', '#3b82f6'];

interface KPICardProps {
  title:     string;
  value:     string | number;
  subtitle?: string;
  icon:      React.ElementType;
  iconBg:    string;
  trend?:    { value: number; isUp: boolean };
}

function KPICard({ title, value, subtitle, icon: Icon, iconBg, trend }: KPICardProps) {
  return (
    <div className="luxury-card stat-card-gold p-5 hover:shadow-luxury-lg transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend.isUp
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
            }`}
          >
            {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-[26px] font-bold text-foreground leading-none mb-1 font-sans">
        {value}
      </p>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/60 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function SkeletonCard() {
  return <div className="h-[130px] skeleton rounded-xl" />;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn:  () => apiGet('/sales/dashboard'),
    refetchInterval: 60000,
  });

  const kpis: KPICardProps[] = [
    {
      title:    'Total Inventory',
      value:    stats?.totalInventory?.toLocaleString() || '0',
      subtitle: 'Active items',
      icon:     Package,
      iconBg:   'linear-gradient(135deg, #3b82f6, #6366f1)',
      trend:    { value: 5.2, isUp: true },
    },
    {
      title:    'Total Customers',
      value:    stats?.totalCustomers?.toLocaleString() || '0',
      subtitle: 'Registered',
      icon:     Users,
      iconBg:   'linear-gradient(135deg, #8b5cf6, #a855f7)',
      trend:    { value: 8.1, isUp: true },
    },
    {
      title:    "Today's Sales",
      value:    formatCurrency(stats?.todaySales?.amount || 0),
      subtitle: `${stats?.todaySales?.count || 0} transactions`,
      icon:     ShoppingCart,
      iconBg:   'linear-gradient(135deg, #C9A84C, #E8D48A)',
    },
    {
      title:    'Monthly Revenue',
      value:    formatCurrency(stats?.monthlySales?.amount || 0),
      subtitle: `${stats?.monthlySales?.count || 0} invoices`,
      icon:     TrendingUp,
      iconBg:   'linear-gradient(135deg, #10b981, #34d399)',
      trend:    { value: 12.4, isUp: true },
    },
    {
      title:    'Outstanding Balance',
      value:    formatCurrency(stats?.outstandingBalance || 0),
      subtitle: 'Customer dues',
      icon:     DollarSign,
      iconBg:   'linear-gradient(135deg, #ef4444, #f87171)',
    },
    {
      title:    'Low Stock Alerts',
      value:    stats?.lowStockCount || 0,
      subtitle: 'Needs restocking',
      icon:     AlertTriangle,
      iconBg:   'linear-gradient(135deg, #f59e0b, #fbbf24)',
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page heading ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatDate(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading
          ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
          : kpis.map(kpi => <KPICard key={kpi.title} {...kpi} />)
        }
      </div>

      {/* ── Charts ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sales trend */}
        <div className="lg:col-span-2 luxury-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
              Sales Trend
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
              2024
            </span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#C9A84C" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Sales']}
                contentStyle={{
                   borderRadius: '10px',
                    border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
                cursor={{ stroke: '#C9A84C', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#C9A84C"
                strokeWidth={2}
                fill="url(#goldGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#C9A84C', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top categories */}
        <div className="luxury-card p-5">
          <h2 className="font-semibold text-foreground mb-5" style={{ fontFamily: 'Playfair Display, serif' }}>
            Top Categories
          </h2>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={PIE_DATA}
                cx="50%" cy="45%"
                innerRadius={54} outerRadius={82}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {PIE_DATA.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Legend
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, '']}
                contentStyle={{
                  borderRadius: '10px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Recent transactions ───────────────────────────── */}
      <div className="luxury-card overflow-hidden">
        <div
          className="px-5 py-4 border-b border-border flex items-center justify-between"
        >
          <h2 className="font-semibold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Recent Transactions
          </h2>
          <a
            href="/sales"
            className="text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#C9A84C' }}
          >
            View all →
          </a>
        </div>

        {(stats?.recentSales || []).length === 0 ? (
          <div className="py-14 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats!.recentSales.map((sale: any) => (
              <div
                key={sale.id}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{sale.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sale.customer?.fullName} · {formatDate(sale.saleDate)}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(sale.grandTotal)}
                  </p>
                  <span className={`badge text-[10px] ${
                    sale.paymentStatus === 'PAID'    ? 'badge-green' :
                    sale.paymentStatus === 'PARTIAL' ? 'badge-blue'  :
                    sale.paymentStatus === 'OVERDUE' ? 'badge-red'   : 'badge-amber'
                  }`}>
                    {sale.paymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
