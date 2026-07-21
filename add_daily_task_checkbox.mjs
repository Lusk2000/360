import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldUI = `                            {RESPONSAVEIS.map((r: any) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                      </>`;

const newUI = `                            {RESPONSAVEIS.map((r: any) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input type="checkbox" id="task_diaria" checked={formData.is_diaria || false} onChange={(e) => setFormData({...formData, is_diaria: e.target.checked})} className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500" />
                          <label htmlFor="task_diaria" className="text-sm font-bold text-slate-300">Tarefa Diária (Recorrente)</label>
                        </div>
                      </>`;

content = content.replace(oldUI, newUI);
fs.writeFileSync('src/App.tsx', content);
