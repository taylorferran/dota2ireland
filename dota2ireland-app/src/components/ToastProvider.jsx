import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error',   dur),
    info:    (msg, dur) => addToast(msg, 'info',    dur),
  };

  const icons = {
    success: 'check_circle',
    error:   'error',
    info:    'info',
  };

  const colours = {
    success: 'border-primary/50 text-primary',
    error:   'border-red-500/50 text-red-400',
    info:    'border-white/20 text-white/70',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 bg-zinc-900 border ${colours[t.type]} rounded-full px-5 py-3 shadow-xl whitespace-nowrap animate-toast-in`}
          >
            <span className="material-symbols-outlined text-xl shrink-0">{icons[t.type]}</span>
            <span className="text-white text-sm font-medium">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-white/30 hover:text-white/70 transition-colors shrink-0 ml-1">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
