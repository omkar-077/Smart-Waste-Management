import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function ToastContainer({ toasts, onRemove }) {
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };
  const colors = {
    success: "border-green-500/50 bg-green-500/10 text-green-300",
    error: "border-red-500/50 bg-red-500/10 text-red-300",
    warning: "border-amber-500/50 bg-amber-500/10 text-amber-300",
    info: "border-blue-500/50 bg-blue-500/10 text-blue-300",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-enter flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-xl ${colors[t.type]}`}
        >
          <span className="text-lg flex-shrink-0">{icons[t.type]}</span>
          <span className="text-sm flex-1">{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="text-current opacity-60 hover:opacity-100 flex-shrink-0 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
