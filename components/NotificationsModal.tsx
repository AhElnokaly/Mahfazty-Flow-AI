import React from 'react';
import { useApp } from '../store';
import { X, Bell, CheckCircle2, AlertCircle, Zap, Sparkles, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NotificationsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, dispatch } = useApp();
  const { language, notificationHistory } = state;
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={20} className="text-emerald-500" />;
      case 'error': return <AlertCircle size={20} className="text-rose-500" />;
      case 'info': return <Zap size={20} className="text-blue-500" />;
      case 'update': return <Sparkles size={20} className="text-yellow-500" />;
      default: return <Bell size={20} className="text-slate-500" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    const text = (notification.title + ' ' + notification.message).toLowerCase();
    
    if (text.includes('ملخص') || text.includes('summary') || text.includes('تحليل') || text.includes('analytics') || text.includes('رسم بياني') || text.includes('chart')) {
      navigate('/analytics');
    } else if (text.includes('قسط') || text.includes('جمعية') || text.includes('installment') || text.includes('debt')) {
      navigate('/installments');
    } else if (text.includes('هدف') || text.includes('أهداف') || text.includes('goal')) {
      navigate('/goals');
    } else if (text.includes('معاملة') || text.includes('transaction') || text.includes('سجل') || text.includes('history')) {
      navigate('/history');
    } else if (text.includes('ذكاء') || text.includes('ai') || text.includes('مساعد') || text.includes('assistant')) {
      navigate('/ai');
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white">
              {language === 'ar' ? 'الإشعارات' : 'Notifications'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notificationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Bell size={48} className="mb-4 opacity-20" />
              <p className="font-bold">{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
            </div>
          ) : (
            notificationHistory.map((notification, index) => (
              <div 
                key={notification.id || index} 
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-2xl border cursor-pointer ${notification.read ? 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800' : 'bg-white border-blue-100 dark:bg-slate-800 dark:border-blue-900/30 shadow-sm'} flex gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800`}
              >
                <div className="shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  {notification.title && <h4 className={`text-sm font-bold ${notification.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{notification.title}</h4>}
                  <p className={`text-xs mt-1 ${notification.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>{notification.message}</p>
                  {notification.timestamp && (
                    <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                      {new Date(notification.timestamp).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {notificationHistory.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0 bg-slate-50 dark:bg-slate-900/50">
            <button 
              onClick={() => dispatch.markNotificationsRead()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Check size={16} />
              {language === 'ar' ? 'تحديد كمقروء' : 'Mark All Read'}
            </button>
            <button 
              onClick={() => dispatch.clearNotificationHistory()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-xl text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              <Trash2 size={16} />
              {language === 'ar' ? 'مسح الكل' : 'Clear All'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
