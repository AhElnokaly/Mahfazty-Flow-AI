const fs = require('fs');
let content = fs.readFileSync('./screens/GroupsManager.tsx', 'utf8');

const target = `                              <input 
                                value={editClientValue.name} 
                                onChange={(e) => setEditClientValue({...editClientValue, name: e.target.value})} 
                                className="flex-1 px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold outline-none" 
                              />
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button 
                                onClick={() => {
                                  dispatch.updateClient(client.id, editClientValue);
                                  setEditingClientId(null);
                                }}
                                className="text-emerald-500 hover:text-emerald-600 p-1 bg-white dark:bg-slate-800 rounded-lg"
                              >`;

const replacement = `                              <input 
                                value={editClientValue.name} 
                                onChange={(e) => setEditClientValue({...editClientValue, name: e.target.value})} 
                                className="flex-1 px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold outline-none" 
                              />
                              <select
                                value={editClientValue.groupId}
                                onChange={(e) => setEditClientValue({...editClientValue, groupId: e.target.value})}
                                className="w-24 px-2 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs outline-none border border-slate-200 dark:border-slate-700"
                              >
                                {groups.map(g => (
                                  <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button 
                                onClick={() => {
                                  if (editClientValue.groupId !== client.groupId) {
                                    dispatch.moveClient(client.id, editClientValue.groupId);
                                  }
                                  if (editClientValue.name !== client.name || editClientValue.icon !== client.icon) {
                                    dispatch.updateClient(client.id, { name: editClientValue.name, icon: editClientValue.icon });
                                  }
                                  setEditingClientId(null);
                                }}
                                className="text-emerald-500 hover:text-emerald-600 p-1 bg-white dark:bg-slate-800 rounded-lg"
                              >`;

// Normalize whitespace for matching
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const targetRegex = new RegExp(escapeRegExp(target).replace(/\\ /g, '\\s*').replace(/\\n/g, '\\s*'), 'g');

content = content.replace(targetRegex, replacement);

fs.writeFileSync('./screens/GroupsManager.tsx', content);
