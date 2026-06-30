import { Menu, Search, Bell, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps { onMenuClick: () => void; }

export default function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [search, setSearch] = useState('');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`); };
  return (
    <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
        <form onSubmit={handleSearch} className="hidden md:flex items-center">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inventory, customers, invoices…" className="pl-9 pr-4 py-2 w-72 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
        </form>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">{isDark ? <Sun className="w-5 h-5 text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600" />}</button>
        <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" /></button>
      </div>
    </header>
  );
}
