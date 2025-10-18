import React, { createContext, useContext, useState } from 'react';
import AppAlert from '../components/common/AppAlert';

type Severity = 'info' | 'success' | 'warning' | 'error';

type AlertOptions = {
  title?: string;
  message: string;
  severity?: Severity;
  // duration in ms; if omitted, success/info default to 3000, others no auto-dismiss.
  duration?: number | null;
};

type AlertContextValue = {
  show: (opts: AlertOptions) => void;
};

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);

  const timerRef = React.useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current as unknown as number);
      timerRef.current = null;
    }
  };

  const show = (opts: AlertOptions) => {
    clearTimer();
    setAlert(opts);

    // determine default duration
    let duration = opts.duration;
    if (duration === undefined) {
      if (opts.severity === 'success' || opts.severity === 'info') duration = 3000;
      else duration = null;
    }

    if (duration && duration > 0) {
      // schedule hide
      timerRef.current = window.setTimeout(() => {
        setAlert(null);
        timerRef.current = null;
      }, duration) as unknown as number;
    }
  };

  return (
    <AlertContext.Provider value={{ show }}>
      {children}
      {alert && (
        <AppAlert
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
          severity={alert.severity}
        />
      )}
    </AlertContext.Provider>
  );
};

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    // Fallback: avoid throwing so UI doesn't crash if provider is missing (HMR/module duplication cases).
    console.warn('useAlert used outside AlertProvider - falling back to window.alert');
    return {
      show: (opts: AlertOptions) => {
        try {
          const title = opts.title ? `${opts.title}\n\n` : '';
          window.alert(title + opts.message);
        } catch (e) {
          // last-resort
           
          console.warn('Failed to show fallback alert', e);
        }
      },
    };
  }
  return ctx;
}
