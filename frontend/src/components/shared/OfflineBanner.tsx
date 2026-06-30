import { useState, useEffect } from 'react';
import { WifiOff, X, Download } from 'lucide-react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  useEffect(() => {
    const on = () => { setIsOnline(true); setShowOffline(false); };
    const off = () => { setIsOnline(false); setShowOffline(true); };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const handleInstall = (e: any) => { e.preventDefault(); setDeferredPrompt(e); if (!window.matchMedia('(display-mode: standalone)').matches) setShowInstall(true); };
    window.addEventListener('beforeinstallprompt', handleInstall);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); window.removeEventListener('beforeinstallprompt', handleInstall); };
  }, []);
  const doInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };
  return (<>
    {showOffline && <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2"><WifiOff size={16} /><span>You're offline — data saved locally</span></div>
      <button onClick={() => setShowOffline(false)}><X size={14} /></button>
    </div>}
    {showInstall && <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-xl shadow-2xl p-4 max-w-xs border border-gray-700">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center"><Download size={18} className="text-white" /></div>
        <div><p className="font-semibold text-sm">Install JewelStore</p>
          <p className="text-xs text-gray-400 mt-0.5">Add to home screen — works offline</p>
          <div className="flex gap-2 mt-3">
            <button onClick={doInstall} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium">Install</button>
            <button onClick={() => setShowInstall(false)} className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg text-xs">Not now</button>
          </div></div>
      </div>
    </div>}
  </>);
}
