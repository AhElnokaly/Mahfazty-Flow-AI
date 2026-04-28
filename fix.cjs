const fs = require('fs');
let code = fs.readFileSync('screens/Analytics.tsx', 'utf-8');

code = code.replace(
  `{language === 'ar' ? 'الكمية' : 'Qty'}</th>\n                              <th className="px-6 py-4`,
  `{language === 'ar' ? 'الكمية' : 'Qty'}</th>\n                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'التصنيف' : 'Category'}</th>\n                              <th className="px-6 py-4`
);

code = code.replace(
  `const client = clients.find((c: any) => c.id === t.clientId);\n                              return (`,
  `const client = clients.find((c: any) => c.id === t.clientId);\n                              const matchedCat = (state.categories || []).find((c: any) => c.id === t.category);\n                              return (`
);

code = code.replace(
  `{t.quantity}\n                                  </td>\n                                  <td className="px-6 py-4">\n                                    <div className="flex items-center gap-2">`,
  `{t.quantity}\n                                  </td>\n                                  <td className="px-6 py-4">\n                                    {matchedCat ? (\n                                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">\n                                        <span>{matchedCat.icon}</span>\n                                        <span>{matchedCat.name}</span>\n                                      </div>\n                                    ) : (\n                                      <span className="text-xs text-slate-400">-</span>\n                                    )}\n                                  </td>\n                                  <td className="px-6 py-4">\n                                    <div className="flex items-center gap-2">`
);

fs.writeFileSync('screens/Analytics.tsx', code);
