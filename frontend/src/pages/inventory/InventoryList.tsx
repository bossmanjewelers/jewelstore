import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiDelete } from '@/lib/api';
import { formatCurrency, formatWeight, STOCK_STATUS_COLORS, METAL_TYPE_LABELS, PURITY_LABELS } from '@/lib/utils';

interface InventoryItem {
  id:          string;
  productId:   string;
  name:        string;
  metalType:   string;
  purity:      string;
  weight:      number;
  sellingPrice: number;
  quantity:    number;
  stockStatus: string;
  category?:  { name: string };
  images:     string[];
}

const METAL_BADGE_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  GOLD:     { bg: 'rgba(201,168,76,0.12)', color: '#9e7b26',  border: 'rgba(201,168,76,0.3)' },
  SILVER:   { bg: 'rgba(160,160,160,0.1)', color: '#6b6b6b',  border: 'rgba(160,160,160,0.25)' },
  PLATINUM: { bg: 'rgba(99,102,241,0.1)',  color: '#4f46e5',  border: 'rgba(99,102,241,0.25)' },
  DIAMOND:  { bg: 'rgba(14,165,233,0.1)',  color: '#0284c7',  border: 'rgba(14,165,233,0.25)' },
  CUSTOM:   { bg: 'rgba(100,100,100,0.1)', color: '#555',     border: 'rgba(100,100,100,0.2)' },
};

const DARK_METAL_BADGE: Record<string, string> = {
  GOLD:     '#E8D48A',
  SILVER:   '#b0b0b0',
  PLATINUM: '#818cf8',
  DIAMOND:  '#38bdf8',
  CUSTOM:   '#888',
};

function MetalBadge({ metalType }: { metalType: string }) {
  const style = METAL_BADGE_STYLE[metalType] || METAL_BADGE_STYLE.CUSTOM;
  return (
    <span
      className="badge text-[10px] dark:!text-current"
      style={{
        background: style.bg,
        color: style.color,
        borderColor: style.border,
      }}
    >
      {METAL_TYPE_LABELS[metalType] || metalType}
    </span>
  );
}

const STOCK_BADGE_CLASS: Record<string, string> = {
  IN_STOCK:    'badge-green',
  LOW_STOCK:   'badge-amber',
  OUT_OF_STOCK:'badge-red',
  DISCONTINUED:'badge-gray',
};

export default function InventoryList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [metalFilter, setMetalFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, search, metalFilter],
    queryFn: () => apiGet<any>('/inventory', {
      page, limit: 20,
      search: search || undefined,
      metalType: metalFilter || undefined,
    }),
    placeholderData: prev => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/inventory/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const items: InventoryItem[] = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Inventory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pagination?.total || 0} items in stock
          </p>
        </div>
        <button
          onClick={() => navigate('/inventory/new')}
          className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
        >
          <Plus size={15} /> Add Item
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
     0      value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name, ID, barcode…"
            className="luxury-input pl-9"
          />
        </div>
        <select
          value={metalFilter}
          onChange={e => { setMetalFilter(e.target.value); setPage(1); }}
          className="luxury-input w-auto min-w-[140px]"
        >
          <option value="">All Metals</option>
          <option value="GOLD">Gold</option>
          <option value="SILVER">Silver</option>
          <option value="PLATINUM">Platinum</option>
          <option value="DIAMOND">Diamond</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="luxury-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />)}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <Package className="w-7 h-7" style={{ color: '#C9A84C' }} />
            </div>
            <p className="font-medium text-foreground mb-1">No inventory items found</p>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first item</p>
            <button
              onClick={() => navigate('/inventory/new')}
              className="btn-gold px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Add First Item
            </button>
          </div>
        ) : (
    0     <div className="overflow-x-auto">
     0      <table className="w-full text-sm luxury-table">
              <thead>
             0  <tr className="bg-muted/50 border-b border-border">
                  <th>Product</th>
                  <th>Category</th>
         0        <th>Metal</th>
                  <th>Weight</th>
                  <th>Price</th>
                  <th>Qty</th>
             0    <th>Status</th>
                  <th className="w-20"></th>
                </tr>
  0            </thead>
              <tbody>
 0              {items.map(item => (
         0          <tr key={item.id}>
               0     <td className="px-4 py-3">
            0          <div className="flex items-center gap-3">
                         {item.images[0] ? (
                          <img
      0                     src={item.images[0]}
  0                          alt={item.name}
  0                          className="w40 h-10 rounded-lg object-cover flex-shrink-0 border border-border"
                          />
  0                     ) : (
                 0         <div className="w40 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted border border-border">
          0                  <Package size={15} className="text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground leading-tight">{item.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{item.productId}</p>
                        </div>
                    </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm">{item.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <MetalBadge metalType={item.metalType} />
                        <span className="text-[11px] text-muted-foreground">{PURITY_LABELS[item.purity]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-sm font-mono">{formatWeight(item.weight)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(item.sellingPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-sm font-medium ${item.quantity <= 2 ? 'text-red-500' : 'text-foreground'}`}>
                        {item.quantity <= 2 && <AlertTriangle size={12} />}
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-[10px] ${STOCK_BADGE_CLASS[item.stockStatus] || 'badge-gray'}`}>
                        {item.stockStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/inventory/${item.id}/edit`)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Delete "${item.name}"?`)) deleteMutation.mutate(item.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
              {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} items
            </p>
            <div className="flex gap-1.5">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none font-medium"
              >
                ← Prev
              </button>
              <span className="px-3 py-1.5 text-xs text-muted-foreground">
                {page} / {pagination.totalPages}
              </span>
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
