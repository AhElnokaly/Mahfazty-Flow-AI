import { useEffect } from 'react';
import { useApp } from '../store';
import { TransactionType } from '../types';

export const SmartNotifications = () => {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (!state.userProfile.isAuthenticated) return;

    const checkNotifications = () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Helper to check if we already notified about this today
      const hasNotified = (id: string) => {
        return state.notificationHistory.some(n => n.id === `${id}_${todayStr}`);
      };

      const sendNotification = (id: string, title: string, message: string, type: 'info' | 'success' | 'error' | 'update') => {
        if (hasNotified(id)) return;
        
        const newNotification = {
          id: `${id}_${todayStr}`,
          title,
          message,
          type,
          timestamp: new Date().toISOString(),
          read: false
        };

        dispatch.addNotificationToHistory(newNotification);
        dispatch.setNotification(newNotification);
      };

      // 1. Installments
      state.installments.forEach(inst => {
        if (inst.status === 'completed') return;
        
        const startDate = new Date(inst.startDate);
        const nextDueDate = new Date(startDate);
        nextDueDate.setMonth(startDate.getMonth() + inst.paidCount);
        
        const diffTime = nextDueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1 || diffDays === 2) {
          sendNotification(
            `inst_due_${inst.id}`,
            state.language === 'ar' ? 'تذكير بقسط قادم 📅' : 'Upcoming Installment 📅',
            state.language === 'ar' 
              ? `اقترب موعد سداد قسط "${inst.title}" بقيمة ${inst.monthlyAmount} ${state.baseCurrency} خلال ${diffDays} يوم.`
              : `Installment "${inst.title}" of ${inst.monthlyAmount} ${state.baseCurrency} is due in ${diffDays} days.`,
            'info'
          );
        } else if (diffDays < 0 && diffDays >= -5) { // Overdue by up to 5 days
          sendNotification(
            `inst_overdue_${inst.id}`,
            state.language === 'ar' ? 'قسط متأخر ⚠️' : 'Overdue Installment ⚠️',
            state.language === 'ar'
              ? `تنبيه: لديك قسط متأخر لـ "${inst.title}" منذ ${Math.abs(diffDays)} يوم.`
              : `Alert: Installment "${inst.title}" is overdue by ${Math.abs(diffDays)} days.`,
            'error'
          );
        }
      });

      // 2. Credit Card Due Dates
      state.transactions.forEach(t => {
        if (t.paymentMethod === 'credit' && t.dueDate && !t.isSettled) {
          const dueDate = new Date(t.dueDate);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1 || diffDays === 2 || diffDays === 0) {
            sendNotification(
              `cc_due_${t.id}`,
              state.language === 'ar' ? 'تذكير سداد فيزا 💳' : 'Credit Card Due 💳',
              state.language === 'ar'
                ? `اقترب موعد سداد بطاقة الائتمان لمعاملة بقيمة ${t.amount} ${t.currency} ${diffDays === 0 ? 'اليوم' : `خلال ${diffDays} يوم`}.`
                : `Credit card payment for ${t.amount} ${t.currency} is due ${diffDays === 0 ? 'today' : `in ${diffDays} days`}.`,
              'info'
            );
          } else if (diffDays < 0 && diffDays >= -5) {
            sendNotification(
              `cc_overdue_${t.id}`,
              state.language === 'ar' ? 'سداد فيزا متأخر ⚠️' : 'Overdue Credit Card ⚠️',
              state.language === 'ar'
                ? `تنبيه: لديك سداد بطاقة ائتمان متأخر لمعاملة بقيمة ${t.amount} ${t.currency} منذ ${Math.abs(diffDays)} يوم.`
                : `Alert: Credit card payment for ${t.amount} ${t.currency} is overdue by ${Math.abs(diffDays)} days.`,
              'error'
            );
          }
        }
      });

      // 3. Budgets
      state.groups.forEach(group => {
        if (!group.monthlyBudget) return;
        
        const groupExpenses = state.transactions
          .filter(t => t.groupId === group.id && t.type === TransactionType.EXPENSE)
          .filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const percentage = (groupExpenses / group.monthlyBudget) * 100;

        if (percentage >= 100) {
          sendNotification(
            `budget_exceeded_${group.id}`,
            state.language === 'ar' ? 'تخطي الميزانية 🚨' : 'Budget Exceeded 🚨',
            state.language === 'ar'
              ? `تحذير: لقد تجاوزت الميزانية المحددة لـ "${group.name}".`
              : `Warning: You have exceeded the budget for "${group.name}".`,
            'error'
          );
        } else if (percentage >= 80) {
          sendNotification(
            `budget_warning_${group.id}`,
            state.language === 'ar' ? 'تنبيه الميزانية 💰' : 'Budget Alert 💰',
            state.language === 'ar'
              ? `لقد استهلكت ${Math.round(percentage)}% من ميزانية "${group.name}" لهذا الشهر.`
              : `You have used ${Math.round(percentage)}% of the budget for "${group.name}" this month.`,
            'update'
          );
        }
      });

      // 3. Goals
      state.goals.forEach(goal => {
        const percentage = (goal.currentAmount / goal.targetAmount) * 100;
        if (percentage >= 100) {
          sendNotification(
            `goal_achieved_${goal.id}`,
            state.language === 'ar' ? 'هدف مكتمل 🎯' : 'Goal Achieved 🎯',
            state.language === 'ar'
              ? `مبروك! لقد حققت هدفك وجمعت المبلغ المطلوب لـ "${goal.title}".`
              : `Congratulations! You've reached your goal for "${goal.title}".`,
            'success'
          );
        } else if (percentage >= 50 && percentage < 55) { // Only notify once when it crosses 50%
          sendNotification(
            `goal_halfway_${goal.id}`,
            state.language === 'ar' ? 'منتصف الطريق 🚀' : 'Halfway There 🚀',
            state.language === 'ar'
              ? `رائع! لقد وصلت إلى ${Math.round(percentage)}% من هدفك "${goal.title}".`
              : `Great! You've reached ${Math.round(percentage)}% of your goal "${goal.title}".`,
            'info'
          );
        }
      });

      // 4. Engagement
      if (state.transactions.length > 0) {
        const lastTxDate = new Date(Math.max(...state.transactions.map(t => new Date(t.date).getTime())));
        const diffTime = today.getTime() - lastTxDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 3) {
          sendNotification(
            'engagement_reminder',
            state.language === 'ar' ? 'اشتقنالك 👋' : 'We Miss You 👋',
            state.language === 'ar'
              ? 'لم تقم بتسجيل أي معاملة منذ 3 أيام، هل نسيت تسجيل شيء؟'
              : 'You haven\'t recorded any transactions in 3 days. Did you forget something?',
            'info'
          );
        }
      }
      // 5. Weekly and Monthly Summaries
      const dayOfWeek = today.getDay(); // 0 is Sunday
      const dayOfMonth = today.getDate(); // 1 is the first day of the month

      // Weekly Summary (Every Sunday)
      if (dayOfWeek === 0) {
        sendNotification(
          'weekly_summary',
          state.language === 'ar' ? 'ملخص الأسبوع 📊' : 'Weekly Summary 📊',
          state.language === 'ar'
            ? 'اطلع على ملخص مصروفاتك وإيراداتك لهذا الأسبوع.'
            : 'Check out your expenses and income summary for this week.',
          'info'
        );
      }

      // Monthly Summary (Every 1st of the month)
      if (dayOfMonth === 1) {
        sendNotification(
          'monthly_summary',
          state.language === 'ar' ? 'ملخص الشهر 📈' : 'Monthly Summary 📈',
          state.language === 'ar'
            ? 'شهر جديد! راجع أداءك المالي للشهر الماضي.'
            : 'New month! Review your financial performance for the past month.',
          'info'
        );
      }

    };

    // Run checks once on mount or when dependencies change
    // Debounce it slightly to avoid running multiple times on rapid state changes
    const timer = setTimeout(checkNotifications, 3000);
    return () => clearTimeout(timer);
  }, [state.installments, state.transactions, state.goals, state.groups, state.language, state.userProfile.isAuthenticated, dispatch, state.notificationHistory, state.baseCurrency]);

  return null;
};
