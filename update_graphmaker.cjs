const fs = require('fs');

let content = fs.readFileSync('screens/GraphMaker.tsx', 'utf-8');

// 1. Add imports
content = content.replace(
  `Play, ArrowLeft, Check, X, Download, Type, Grid, Tag, Save, Trash2\n} from 'lucide-react';`,
  `Play, ArrowLeft, Check, X, Download, Type, Grid, Tag, Save, Trash2, ListFilter\n} from 'lucide-react';`
);

// 2. Add state
content = content.replace(
  `const [timeGrouping, setTimeGrouping] = useState<'daily' | 'monthly' | 'yearly'>('monthly');\n  const [dataType, setDataType] = useState<'expense' | 'income' | 'net' | 'all'>('expense');`,
  `const [timeGrouping, setTimeGrouping] = useState<'daily' | 'monthly' | 'yearly'>('monthly');\n  const [dataType, setDataType] = useState<'expense' | 'income' | 'net' | 'all'>('expense');\n  const [groupBy, setGroupBy] = useState<'time' | 'category' | 'client' | 'group'>('time'); // +++ أضيف بناءً على طلبك +++\n  const [limitTop, setLimitTop] = useState<number | 'all'>('all'); // +++ أضيف بناءً على طلبك +++`
);

// 3. handleSaveGraph
content = content.replace(
  `selectedCategories, // +++ أضيف بناءً على طلبك +++\n      dateRange,\n      timeGrouping,\n      dataType,\n      showGrid,\n      showLabels\n    };`,
  `selectedCategories, // +++ أضيف بناءً على طلبك +++\n      dateRange,\n      timeGrouping,\n      dataType,\n      showGrid,\n      showLabels,\n      groupBy,\n      limitTop\n    };`
);

// 4. handleLoadGraph
content = content.replace(
  `setTimeGrouping(graph.timeGrouping);\n    setDataType(graph.dataType);\n    setShowGrid(graph.showGrid);\n    setShowLabels(graph.showLabels);`,
  `setTimeGrouping(graph.timeGrouping);\n    setDataType(graph.dataType);\n    setShowGrid(graph.showGrid);\n    setShowLabels(graph.showLabels);\n    setGroupBy(graph.groupBy || 'time');\n    setLimitTop(graph.limitTop || 'all');`
);

// 5. handleNewGraph
content = content.replace(
  `setTimeGrouping('monthly');\n    setDataType('expense');\n    setShowGrid(true);\n    setShowLabels(false);\n    setGeneratedData(null);`,
  `setTimeGrouping('monthly');\n    setDataType('expense');\n    setShowGrid(true);\n    setShowLabels(false);\n    setGroupBy('time');\n    setLimitTop('all');\n    setGeneratedData(null);`
);

// 6. Data grouping logic
content = content.replace(
  `      // Grouping Data
      let processedData: any[] = [];

      if (chartType === 'pie' || chartType === 'radar') {
        // Group by Category/Group for Pie/Radar
        const grouped = filtered.reduce((acc, t) => {
          let key;
          if (t.categoryId) {
            key = state.categories?.find(c => c.id === t.categoryId)?.name || 'Unknown';
          } else {
            key = groups.find(g => g.id === t.groupId)?.name || 'Unknown';
          }
          if (!acc[key]) acc[key] = 0;
          acc[key] += t.amount;
          return acc;
        }, {} as Record<string, number>);

        processedData = Object.keys(grouped).map(key => ({
          name: key,
          value: grouped[key]
        })).sort((a, b) => b.value - a.value);

      } else {
        // Time-based grouping for Bar, Line, Area, Composed
        const grouped = filtered.reduce((acc, t) => {
          let dateKey = t.date;
          if (timeGrouping === 'monthly') {
            dateKey = t.date.substring(0, 7); // YYYY-MM
          } else if (timeGrouping === 'yearly') {
            dateKey = t.date.substring(0, 4); // YYYY
          }

          if (!acc[dateKey]) {
            acc[dateKey] = { date: dateKey, income: 0, expense: 0, net: 0 };
          }

          if (t.type?.toUpperCase() === 'INCOME') {
            acc[dateKey].income += t.amount;
            acc[dateKey].net += t.amount;
          } else if (t.type?.toUpperCase() === 'EXPENSE') {
            acc[dateKey].expense += t.amount;
            acc[dateKey].net -= t.amount;
          }

          return acc;
        }, {} as Record<string, any>);

        processedData = Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
      }`,
  `      // Grouping Data
      const grouped = filtered.reduce((acc, t) => {
        let key = 'Unknown';
        
        if (groupBy === 'time') {
          key = t.date;
          if (timeGrouping === 'monthly') key = t.date.substring(0, 7);
          else if (timeGrouping === 'yearly') key = t.date.substring(0, 4);
        } else if (groupBy === 'category') {
          key = t.categoryId ? (state.categories?.find(c => c.id === t.categoryId)?.name || 'Unknown') : 'Uncategorized';
        } else if (groupBy === 'client') {
          key = t.clientId ? (clients.find(c => c.id === t.clientId)?.name || 'Unknown') : (
            t.clientIds && t.clientIds.length > 0 ? 'Multiple' : 'Unknown'
          );
        } else if (groupBy === 'group') {
          key = groups.find(g => g.id === t.groupId)?.name || 'Unknown';
        }

        if (!acc[key]) {
          acc[key] = { date: key, name: key, label: key, income: 0, expense: 0, net: 0, value: 0 };
        }

        if (t.type?.toUpperCase() === 'INCOME') {
          acc[key].income += t.amount;
          acc[key].net += t.amount;
        } else if (t.type?.toUpperCase() === 'EXPENSE') {
          acc[key].expense += t.amount;
          acc[key].net -= t.amount;
        } else if (t.type?.toUpperCase() === 'INVESTMENT') {
          // investments are technically expenses
          acc[key].expense += t.amount;
          acc[key].net -= t.amount;
        }

        return acc;
      }, {} as Record<string, any>);

      let processedData = Object.values(grouped);

      // Map "value" for pie/radar logic
      processedData.forEach(item => {
        if (dataType === 'expense') item.value = item.expense;
        else if (dataType === 'income') item.value = item.income;
        else if (dataType === 'net') item.value = item.net;
        else item.value = item.expense + item.income;
      });

      // Sorting
      if (groupBy === 'time') {
        processedData.sort((a: any, b: any) => a.date.localeCompare(b.date));
      } else {
        processedData.sort((a: any, b: any) => {
          if (dataType === 'expense') return b.expense - a.expense;
          if (dataType === 'income') return b.income - a.income;
          if (dataType === 'net') return b.net - a.net;
          return b.value - a.value;
        });
      }

      // Limit results
      if (limitTop !== 'all' && Number(limitTop) > 0 && groupBy !== 'time') {
        processedData = processedData.slice(0, Number(limitTop));
      }`
);

// 7. Remove the "Only for non-pie/radar" restriction
content = content.replace(
  `{/* Data Type & Time Grouping (Only for non-pie/radar) */}
          {chartType !== 'pie' && chartType !== 'radar' && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">`,
  `{/* Data Type & Time Grouping */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-6">
              {/* +++ أضيف بناءً على طلبك +++ */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Layers size={16} /> {language === 'ar' ? 'المحور الأفقي / التجميع' : 'X-Axis / Group By'}
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'time', label: language === 'ar' ? 'الوقت' : 'Time' },
                    { id: 'category', label: language === 'ar' ? 'التصنيف' : 'Category' },
                    { id: 'client', label: language === 'ar' ? 'العميل' : 'Client' },
                    { id: 'group', label: language === 'ar' ? 'المجموعة' : 'Group' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setGroupBy(type.id as any);
                        if (type.id === 'time') setLimitTop('all');
                      }}
                      className={\`flex-1 py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${groupBy === type.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {groupBy !== 'time' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <ListFilter size={16} /> {language === 'ar' ? 'الحد الأقصى للنتائج' : 'Limit top results'}
                  </h3>
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: language === 'ar' ? 'الكل' : 'All' },
                      { id: 3, label: 3 },
                      { id: 5, label: 5 },
                      { id: 10, label: 10 },
                    ].map(type => (
                      <button
                        key={type.id.toString()}
                        onClick={() => setLimitTop(type.id as any)}
                        className={\`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${limitTop === type.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}`
);

content = content.replace(
  `<div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Calendar size={16} /> {language === 'ar' ? 'التجميع الزمني' : 'Time Grouping'}
                </h3>`,
  `{groupBy === 'time' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <Calendar size={16} /> {language === 'ar' ? 'التجميع الزمني' : 'Time Grouping'}
                  </h3>`
);

content = content.replace(
  `{language === 'ar' ? (type === 'daily' ? 'يومي' : type === 'monthly' ? 'شهري' : 'سنوي') : type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}`,
  `{language === 'ar' ? (type === 'daily' ? 'يومي' : type === 'monthly' ? 'شهري' : 'سنوي') : type}
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>`
);

fs.writeFileSync('screens/GraphMaker.tsx', content);
