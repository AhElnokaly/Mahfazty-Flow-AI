const fs = require('fs');
let code = fs.readFileSync('screens/AddFlow.tsx', 'utf-8');

// Add installment action type
code = code.replace(
  `const [ccAction, setCcAction] = useState<'purchase' | 'repayment'>('purchase');`,
  `const [ccAction, setCcAction] = useState<'purchase' | 'repayment' | 'installment'>('purchase');`
);

// Add the 3rd button
code = code.replace(
  `<div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">\n                  <button\n                    type="button"\n                    onClick={() => handleCcActionChange('purchase')}`,
  `<div className="flex flex-col sm:flex-row bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6 gap-1 sm:gap-0">\n                  <button\n                    type="button"\n                    onClick={() => handleCcActionChange('purchase')}`
);

code = code.replace(
  `onClick={() => handleCcActionChange('repayment')}\n                    className={\`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all \${ccAction === 'repayment' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}\n                  >\n                    {language === 'ar' ? 'تسديد' : 'Repayment'}\n                  </button>`,
  `onClick={() => handleCcActionChange('repayment')}\n                    className={\`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl transition-all \${ccAction === 'repayment' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}\n                  >\n                    {language === 'ar' ? 'تسديد' : 'Repayment'}\n                  </button>\n                  <button\n                    type="button"\n                    onClick={() => handleCcActionChange('installment')}\n                    className={\`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl transition-all \${ccAction === 'installment' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}\n                  >\n                    {language === 'ar' ? 'تقسيط' : 'Installment'}\n                  </button>`
);

code = code.replace(
  `onClick={() => handleCcActionChange('purchase')}\n                    className={\`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all \${ccAction === 'purchase' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}`,
  `onClick={() => handleCcActionChange('purchase')}\n                    className={\`flex-1 py-3 text-xs sm:text-sm font-black uppercase tracking-widest rounded-xl transition-all \${ccAction === 'purchase' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}\`}`
);

code = code.replace(
  `{ccAction === 'purchase' && (\n                  <div className="mt-4">`,
  `{(ccAction === 'purchase' || ccAction === 'installment') && (\n                  <div className="mt-4">`
);

code = code.replace(
  `className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-lg font-black text-slate-800 dark:text-white outline-none"\n                    />\n                  </div>\n                )}`,
  `className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-lg font-black text-slate-800 dark:text-white outline-none"\n                    />\n                  </div>\n                )}\n\n                {ccAction === 'installment' && (\n                  <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">\n                    <div>\n                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">\n                        {language === 'ar' ? 'عدد الأشهر' : 'Months'}\n                      </label>\n                      <input\n                        type="number"\n                        value={duration}\n                        onChange={(e) => setDuration(e.target.value)}\n                        placeholder="12"\n                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-lg font-black text-slate-800 dark:text-white outline-none"\n                      />\n                    </div>\n                    <div>\n                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-2">\n                        {language === 'ar' ? 'فائدة الكلية %' : 'Total Interest %'}\n                      </label>\n                      <input\n                        type="number"\n                        value={interestRate}\n                        onChange={(e) => setInterestRate(e.target.value)}\n                        placeholder="0"\n                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-lg font-black text-slate-800 dark:text-white outline-none"\n                      />\n                    </div>\n                  </div>\n                )}`
);

// We need to support `ccAction === 'installment'` inside `handleMainTabChange`
code = code.replace(
  `if (ccAction === 'purchase') {\n        setType(TransactionType.EXPENSE);\n        setPaymentMethod('credit');\n      } else {`,
  `if (ccAction === 'purchase' || ccAction === 'installment') {\n        setType(TransactionType.EXPENSE);\n        setPaymentMethod('credit');\n      } else {`
);

// We need to support `handleCcActionChange` to setType
code = code.replace(
  `const handleCcActionChange = (action: 'purchase' | 'repayment') => {\n    setCcAction(action);\n    if (action === 'purchase') {`,
  `const handleCcActionChange = (action: 'purchase' | 'repayment' | 'installment') => {\n    setCcAction(action);\n    if (action === 'purchase' || action === 'installment') {`
);

// Handle dueDate issue for installment
code = code.replace(
  `dueDate: mainTab === 'credit_card' && ccAction === 'purchase' ? dueDate : undefined,\n      isSettled: mainTab === 'credit_card' && ccAction === 'purchase' ? false : undefined,`,
  `dueDate: mainTab === 'credit_card' && (ccAction === 'purchase' || ccAction === 'installment') ? dueDate : undefined,\n      isSettled: mainTab === 'credit_card' && (ccAction === 'purchase' || ccAction === 'installment') ? false : undefined,`
);

// Handle saving
code = code.replace(
  `if (isEditMode && editTransactionId) {\n      dispatch.updateTransaction(editTransactionId, transactionData);\n      dispatch.setNotification({ message: language === 'ar' ? 'تم تحديث المعاملة بنجاح' : 'Transaction updated successfully', type: 'success' });\n    } else {`,
  `if (isEditMode && editTransactionId) {\n      dispatch.updateTransaction(editTransactionId, transactionData);\n      dispatch.setNotification({ message: language === 'ar' ? 'تم تحديث المعاملة بنجاح' : 'Transaction updated successfully', type: 'success' });\n    } else {\n      // Check if it is a credit card installment\n      if (mainTab === 'credit_card' && ccAction === 'installment') {\n        const totalInterest = parseFloat(interestRate) || 0;\n        const totalWithInterest = transactionData.amount * (1 + totalInterest / 100);\n        const installmentMonths = parseInt(duration) || 12;\n        \n        dispatch.addInstallment({\n          title: note || (language === 'ar' ? 'شراء بالفيزا (تقسيط)' : 'Credit Card Installment'),\n          totalAmount: totalWithInterest,\n          interestRate: totalInterest,\n          installmentCount: installmentMonths,\n          startDate: date,\n          type: 'purchase',\n          creditCardId: creditCardId\n        });\n        \n        // Modify the transaction to be the principal amount, the installment total will be paid later, but credit card balance increases right away.\n        transactionData.amount = totalWithInterest;\n      }`
);

fs.writeFileSync('screens/AddFlow.tsx', code);
