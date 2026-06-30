import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/dashboard/Dashboard';
import InventoryList from '@/pages/inventory/InventoryList';
import InventoryForm from '@/pages/inventory/InventoryForm';
import CustomerList from '@/pages/customers/CustomerList';
import SalesList from '@/pages/sales/SalesList';
import Reports from '@/pages/reports/Reports';
import { OfflineBanner } from '@/components/shared/OfflineBanner';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60000, refetchOnWindowFocus: false, networkMode: 'offlineFirst' }, mutations: { networkMode: 'offlineFirst' } } });

function App() {
  return (<QueryClientProvider client={queryClient}><OfflineBanner /><BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<AppLayout />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inventory" element={<InventoryList />} />
      <Route path="/inventory/new" element={<InventoryForm />} />
      <Route path="/inventory/:id/edit" element={<InventoryForm />} />
      <Route path="/customers" element={<CustomerList />} />
      <Route path="/sales" element={<SalesList />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/categories" element={<div className="p-4">Categories</div>} />
      <Route path="/suppliers" element={<div className="p-4">Suppliers</div>} />
      <Route path="/purchases" element={<div className="p-4">Purchases</div>} />
      <Route path="/balances" element={<div className="p-4">Balances</div>} />
      <Route path="/settings" element={<div className="p-4">Settings</div>} />
      <Route path="/notifications" element={<div className="p-4">Notifications</div>} />
      <Route path="/search" element={<div className="p-4">Search</div>} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes></BrowserRouter></QueryClientProvider>);
}
export default App;
