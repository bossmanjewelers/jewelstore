import { NavLink, useLocation } from 'react-router-dom';
import { Gem, LayoutDashboard, Package, Users, ShoppingCart, Truck, BarChart3, Settings, Tag, LogOut, ChevronDown, ChevronRight, Bell, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cn, getInitials } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Inventory', icon: Package, children: [{ label: 'All Items', href: '/inventory' }, { label: 'Add Item', href: '/inventory/new' }, { label: 'Low Stock', href: '/inventory/low-stock' }, { label: 'Categories', href: '/categories' }] },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Sales', icon: ShoppingCart, children: [{ label: 'All Sales', href: '/sales' }, { label: 'New Invoice', href: '/sales/new' }] },
  { label: 'Balances', icon: Wallet, href: '/balances' },
  { label: 'Suppliers', icon: Truck, href: '/suppliers' },
  { label: 'Purchases', icon: Tag, href: '/purchases' },
  { label: 'Reports', icon: BarChart3, href: '/reports' },
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Settings', icon: Settings, href: '/settings', roles: ['ADMIN', 'MANAGER'] },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [openGroups, setOpenGroups] = useState<string[]>(['Inventory', 'Sales']);
  const toggleGroup = (label: string) => setOpenGroups((p) => p.includes(label) ? p.filter((g) => g !== label) : [...p, label]);
  const isGroupActive = (item: any) => item.children?.some((c: any) => location.pathname.startsWith(c.href));
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
      <aside className={cn('fixed top-0 left-0 h-full w-64 bg-gray-900 dark:bg-gray-950 text-white z-30 flex flex-col transition-transform duration-300', isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-xl flex items-center justify-center"><Gem className="w-5 h-5 text-white" /></div>
          <div><p className="font-bold text-white text-sm">JewelStore</p><p className="text-xs text-gray-400">Management System</p></div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.filter((i: any) => !i.roles || i.roles.includes(user?.role || '')).map((item: any) => {
            if (item.children) {
              const open = openGroups.includes(item.label);
              return (<div key={item.label}>
                <button onClick={() => toggleGroup(item.label)} className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', isGroupActive(item) ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}>
                  <item.icon size={18} className="flex-shrink-0" /><span className="flex-1 text-left">{item.label}</span>
                  {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {open && <div className="ml-9 mt-0.5 space-y-0.5">{item.children.map((c: any) => <NavLink key={c.href} to={c.href} onClick={onClose} className={({ isActive }) => cn('block px-3 py-2 rounded-lg text-xs font-medium transition-colors', isActive ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300')}>{c.label}</NavLink>)}</div>}
              </div>);
            }
            return <NavLink key={item.href} to={item.href} onClick={onClose} className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors', isActive ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}><item.icon size={18} className="flex-shrink-0" />{item.label}</NavLink>;
          })}
        </nav>
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{getInitials(user?.name || 'U')}</div><div className="min-w-0"><p className="text-sm font-medium text-white truncate">{user?.name}</p><p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p></div></div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>
    </>
  );
}
