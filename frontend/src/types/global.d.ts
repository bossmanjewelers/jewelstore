interface Window { electronAPI?: { platform: string; isElectron: boolean; version: string; onNavigate: (callback: (path: string) => void) => () => void; print: () => void; }; }
