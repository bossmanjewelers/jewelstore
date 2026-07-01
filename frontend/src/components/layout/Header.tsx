import { Menu, Search, Bell, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/inventory':          'Inventory',
  '/inventory/new':      'Add Item',
  '/customers':          'Customers',
  '/customers/new':      'New Customer',
  '/sales':              'Sales',
  '/sales/new':          'New Invoice',
  '/reports':            'Reports',
  '/settings':           'Settings',
  '/balances':           'Customer Balances',
  '/suppliers':     0    'Suppliers',
  '/purchases':          'Purchases',
  '/notifications':      'Notifications',
  '/categories':         'Categories',
  '/search':             'Search',
};

function getPageTitle(pathname: string): string {
  if (pathname.includes('/inventory/') && pathname.includes('/edit')) return 'Edit Item';
  if (pathname.includes('/customers/')) return 'Customer Profile';
  if (pathname.includes('/sales/') && pathname !== '/sales/new') return 'Invoice Detail';
  return PAGE_TITLES[pathname] || 'Management';
}

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-10 bg-card border-b border-border px-4 lg:px-6 h-16 flex items-center justify-between gap-4"
      style={{ boxShadow: '0 1px 0 0 hsl(var(--border))' }}
    >
      {/* Left: menu + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1
          className="text-lg font-semibold text-foreground truncate"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {title}
        </h1>
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-2">
        {/* Search — desktop */}
        <form onSubmit={handleSearch} className="hidden md:block">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
     0        value={search}
              onChange={e => setSearch(e.target.value)}
           