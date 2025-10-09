import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

type Severity = 'info' | 'success' | 'warning' | 'error';

interface AppAlertProps {
  title?: string;
  message: string;
  onClose: () => void;
  severity?: Severity;
}

const severityMap: Record<Severity, { bg: string; iconBg: string; text: string; Icon: any }> = {
  info: { bg: 'bg-blue-50 dark:bg-blue-900/30', iconBg: 'bg-blue-100 dark:bg-blue-700', text: 'text-blue-800 dark:text-blue-200', Icon: Info },
  success: { bg: 'bg-green-50 dark:bg-green-900/30', iconBg: 'bg-green-100 dark:bg-green-700', text: 'text-green-800 dark:text-green-200', Icon: CheckCircle },
  warning: { bg: 'bg-amber-50 dark:bg-amber-900/30', iconBg: 'bg-amber-100 dark:bg-amber-700', text: 'text-amber-800 dark:text-amber-200', Icon: AlertTriangle },
  error: { bg: 'bg-red-50 dark:bg-red-900/30', iconBg: 'bg-red-100 dark:bg-red-700', text: 'text-red-800 dark:text-red-200', Icon: XCircle },
};

export default function AppAlert({ title = 'Notice', message, onClose, severity = 'info' }: AppAlertProps) {
  const s = severityMap[severity];

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className={`rounded shadow-lg max-w-lg w-full p-4 z-10 ${s.bg} border border-transparent`}> 
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${s.iconBg} flex items-center justify-center`}>
              <s.Icon className={`w-6 h-6 ${s.text}`} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${s.text}`}>{title}</h3>
                <div className={`text-sm whitespace-pre-wrap ${s.text}`}>{message}</div>
              </div>
              <div>
                <button onClick={onClose} className={`text-sm font-medium ml-4 text-gray-600 dark:text-gray-300`}>Close</button>
              </div>
            </div>
            <div className="mt-4 text-right">
              <button className={`px-4 py-2 rounded ${severity === 'success' ? 'bg-green-600 text-white' : severity === 'error' ? 'bg-red-600 text-white' : severity === 'warning' ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white'}`} onClick={onClose}>OK</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
