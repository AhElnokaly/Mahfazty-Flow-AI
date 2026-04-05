import React, { useMemo, useState } from 'react';
import { useApp } from '../store';
import { TransactionType } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity, PieChart, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Investments: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const { language, baseCurrency, isPrivacyMode } = state;

  const [activeTab, setActiveTab] = useState<'stocks' | 'deposits'>('stocks');

  // Filter investment transactions
  const investmentTxs = useMemo(() => {
    return state.transactions.filter(t => t.type === TransactionType.INVESTMENT);
  }, [state.transactions]);

  // Calculate Stocks Portfolio
  const stocksPortfolio = useMemo(() => {
    const stocks = new Map<string, {
      symbol: string;
      totalShares: number;
      investedAmount: number;
      realizedProfit: number;
      dividends: number;
    }>();

    investmentTxs.filter(t => t.investmentType === 'stock' && t.stockSymbol).forEach(t => {
      const symbol = t.stockSymbol!.toUpperCase();
      if (!stocks.has(symbol)) {
        stocks.set(symbol, { symbol, totalShares: 0, investedAmount: 0, realizedProfit: 0, dividends: 0 });
      }
      
      const stock = stocks.get(symbol)!;
      
      if (t.investmentAction === 'BUY') {
        stock.totalShares += (t.shares || 0);
        stock.investedAmount += t.amount;
      } else if (t.investmentAction === 'FREE_STOCK') {
        stock.totalShares += (t.shares || 0);
      } else if (t.investmentAction === 'SELL') {
        // Calculate average cost before selling
        const avgCost = stock.totalShares > 0 ? stock.investedAmount / stock.totalShares : 0;
        const sharesSold = t.shares || 0;
        
        // Deduct from invested amount based on avg cost
        const costOfSoldShares = avgCost * sharesSold;
        stock.investedAmount -= costOfSoldShares;
        stock.totalShares -= sharesSold;
        
        // Calculate realized profit
        stock.realizedProfit += (t.amount - costOfSoldShares);
      } else if (t.investmentAction === 'DIVIDEND') {
        stock.dividends += t.amount;
      }
    });

    return Array.from(stocks.values()).filter(s => s.totalShares > 0 || s.realizedProfit !== 0 || s.dividends !== 0);
  }, [investmentTxs]);

  // Calculate Deposits/Certificates
  const depositsPortfolio = useMemo(() => {
    return investmentTxs.filter(t => t.investmentType === 'deposit');
  }, [investmentTxs]);

  const totalInvestedStocks = stocksPortfolio.reduce((sum, s) => sum + s.investedAmount, 0);
  const totalRealizedProfit = stocksPortfolio.reduce((sum, s) => sum + s.realizedProfit, 0);
  const totalDividends = stocksPortfolio.reduce((sum, s) => sum + s.dividends, 0);

  const totalDeposits = depositsPortfolio.reduce((sum, t) => {
    if (t.investmentAction === 'BUY') return sum + t.amount;
    if (t.investmentAction === 'RETURN') return sum - t.amount; // Assuming return means withdrawing principal
    return sum;
  }, 0);

  const totalInvested = totalInvestedStocks + totalDeposits;

  const formatMoney = (amount: number) => {
    if (isPrivacyMode) return '••••••';
    return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${baseCurrency}`;
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {language === 'ar' ? 'المحفظة الاستثمارية' : 'Investment Portfolio'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'ar' ? 'تتبع أسهمك وودائعك' : 'Track your stocks and deposits'}
          </p>
        </div>
        <button 
          onClick={() => navigate('/add')}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/30 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-xl shadow-slate-900/20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Briefcase size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
              {language === 'ar' ? 'إجمالي الاستثمارات' : 'Total Invested'}
            </p>
            <h3 className="text-3xl font-black tracking-tight">
              {formatMoney(totalInvested)}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
              <TrendingUp size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {language === 'ar' ? 'أرباح محققة' : 'Realized Profit'}
            </p>
          </div>
          <h3 className={`text-2xl font-black ${totalRealizedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalRealizedProfit > 0 ? '+' : ''}{formatMoney(totalRealizedProfit)}
          </h3>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
              <DollarSign size={20} />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              {language === 'ar' ? 'توزيعات الأرباح' : 'Total Dividends'}
            </p>
          </div>
          <h3 className="text-2xl font-black text-blue-500">
            +{formatMoney(totalDividends)}
          </h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'stocks' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {language === 'ar' ? 'الأسهم' : 'Stocks'}
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex-1 py-3 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'deposits' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          {language === 'ar' ? 'الودائع والشهادات' : 'Deposits'}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stocks' && (
        <div className="space-y-4">
          {stocksPortfolio.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              <Activity size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-500 font-medium">
                {language === 'ar' ? 'لا توجد أسهم حالياً' : 'No stocks currently'}
              </p>
            </div>
          ) : (
            stocksPortfolio.map(stock => {
              const avgCost = stock.totalShares > 0 ? stock.investedAmount / stock.totalShares : 0;
              
              return (
                <div key={stock.symbol} className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg font-black text-slate-700 dark:text-slate-300">
                      {stock.symbol.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">{stock.symbol}</h4>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {stock.totalShares} {language === 'ar' ? 'سهم' : 'Shares'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {language === 'ar' ? 'متوسط التكلفة' : 'Avg Cost'}
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {isPrivacyMode ? '•••' : avgCost.toLocaleString(undefined, { maximumFractionDigits: 2 })} {baseCurrency}
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {language === 'ar' ? 'إجمالي التكلفة' : 'Total Cost'}
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatMoney(stock.investedAmount)}
                      </p>
                    </div>
                    {(stock.realizedProfit !== 0 || stock.dividends !== 0) && (
                      <div className="col-span-2 sm:col-span-1 text-left sm:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {language === 'ar' ? 'أرباح/توزيعات' : 'Profit/Div'}
                        </p>
                        <div className="flex items-center sm:justify-end gap-2">
                          {stock.realizedProfit !== 0 && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stock.realizedProfit > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                              {stock.realizedProfit > 0 ? '+' : ''}{isPrivacyMode ? '•••' : stock.realizedProfit.toLocaleString()}
                            </span>
                          )}
                          {stock.dividends > 0 && (
                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              +{isPrivacyMode ? '•••' : stock.dividends.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'deposits' && (
        <div className="space-y-4">
          {depositsPortfolio.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
              <PieChart size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-500 font-medium">
                {language === 'ar' ? 'لا توجد ودائع حالياً' : 'No deposits currently'}
              </p>
            </div>
          ) : (
            depositsPortfolio.map(deposit => (
              <div key={deposit.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${deposit.investmentAction === 'BUY' ? 'bg-purple-500' : deposit.investmentAction === 'RETURN' ? 'bg-rose-500' : 'bg-blue-500'}`}>
                    {deposit.investmentAction === 'BUY' ? <ArrowUpRight size={20} /> : deposit.investmentAction === 'RETURN' ? <ArrowDownRight size={20} /> : <DollarSign size={20} />}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {deposit.investmentAction === 'BUY' ? (language === 'ar' ? 'إيداع / شهادة' : 'Deposit / Certificate') : 
                       deposit.investmentAction === 'RETURN' ? (language === 'ar' ? 'استرداد' : 'Withdrawal') : 
                       (language === 'ar' ? 'عائد' : 'Return')}
                    </h4>
                    <p className="text-xs font-bold text-slate-500">
                      {new Date(deposit.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  {deposit.interestRate && (
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {language === 'ar' ? 'الفائدة' : 'Interest'}
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {deposit.interestRate}%
                      </p>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {language === 'ar' ? 'المبلغ' : 'Amount'}
                    </p>
                    <p className={`text-lg font-black ${deposit.investmentAction === 'RETURN' ? 'text-rose-500' : deposit.investmentAction === 'DIVIDEND' ? 'text-blue-500' : 'text-slate-900 dark:text-white'}`}>
                      {deposit.investmentAction === 'RETURN' ? '-' : '+'}{formatMoney(deposit.amount)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
