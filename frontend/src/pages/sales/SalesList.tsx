import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Receipt, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  PAID:      'badge-green',
  PARTIAL:   'badge-blue',
  PENDING:   'badge-amber',
  OVERDUE:   'badge-red',
  CANCELLED: 'badge-gray',
};

export default function SalesList() {
  const navigate = useNavigate();
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, search, statusFilter],
    queryFn: () => apiGet<any>('/sales', {
      page, limit: 20,
      search: search || undefined,
      paymentStatus: statusFilter || undefined,
    }),
    placeholderData: prev => prev,
  });

  const sales      = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Sales
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pagination?.total || 0} invoices total
          </p>
        </div>
        <button
          onClick={() => navigate('/sales/new')}
          className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
        >
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {/* ── Filters ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search invoice number…"
            className="luxury-input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="luxury-input w-auto min-w-[150px]"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
   4      <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="luxury-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />)}
          </div>
        ) : sales.length === 0 ? (
          <div className="p-16 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              <Receipt className="w-7 h-7" style={{ color: '#C9A84C' }} />
            </div>
            <p className="font-medium text-foreground mb-1">No sales found</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first invoice to get started</p>
            <button
              onClick={() => navigate('/sales/new')}
              className="btn-gold px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Create Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm luxury-table">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale: any) => (
                  <tr key={sale.id}>
                    <td className="px-4 py-3">
                      <span
                        className="font-semibold text-sm font-mono"
                        style={{ color: '#C9A84C' }}
    0                      >
                        {sale.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {sale.customer?.fullName}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground text-center">
                      {sale.items?.length || 0}
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {formatCurrency(sale.grandTotal)}
                     </td>
                    <td className="px-4 py-3 font-medium text-emerald-600">
                      {formatCurrency(sale.paidAmount)}
                    </td>
                    <td className="px-4 py-3 font-medium text-red-500">
                      {formatCurrency(sale.balanceAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${STATUS_BADGE[sale.paymentStatus] || 'badge-gray'}`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/sales/${sale.id}`)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="View invoice"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Page {page} of {pagination.totalPages}
            </p>
            <div className="flex gap-1.5">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none font-medium"
              >
                ← Prev
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none font-medium"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
