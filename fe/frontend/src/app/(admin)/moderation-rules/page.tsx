'use client';

import { useEffect, useState } from 'react';
import { Check, Edit3, Loader2, Play, Plus, Power, ShieldAlert, Trash2, X } from 'lucide-react';
import { moderationApi, ModerationResult, ModerationRule, ModerationRuleType } from '@/services/moderationApi';

const emptyRule = { name: '', pattern: '', ruleType: 'keyword' as ModerationRuleType, reason: '', isEnabled: true };
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback;

export default function ModerationRulesPage() {
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [form, setForm] = useState(emptyRule);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [testContent, setTestContent] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ModerationResult | null>(null);

  const load = async () => {
    setLoading(true);
    try { setRules(await moderationApi.list()); }
    catch (e: unknown) { setNotice({ type: 'error', text: errorMessage(e, 'Không thể tải quy tắc.') }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(emptyRule); setEditingId(null); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setNotice(null);
    try {
      const rule = editingId ? await moderationApi.update(editingId, form) : await moderationApi.create(form);
      setRules(prev => editingId ? prev.map(x => x.id === rule.id ? rule : x) : [rule, ...prev]);
      setNotice({ type: 'ok', text: editingId ? 'Đã cập nhật quy tắc.' : 'Đã thêm quy tắc.' }); resetForm();
    } catch (e: unknown) { setNotice({ type: 'error', text: errorMessage(e, 'Không thể lưu quy tắc.') }); }
    finally { setSaving(false); }
  };
  const edit = (rule: ModerationRule) => { setEditingId(rule.id); setForm({ name: rule.name, pattern: rule.pattern, ruleType: rule.ruleType, reason: rule.reason, isEnabled: rule.isEnabled }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const toggle = async (id: number) => { try { const r = await moderationApi.toggle(id); setRules(p => p.map(x => x.id === id ? r : x)); } catch { setNotice({ type: 'error', text: 'Không thể đổi trạng thái quy tắc.' }); } };
  const remove = async (rule: ModerationRule) => { if (!window.confirm(`Xóa quy tắc "${rule.name}"?`)) return; try { await moderationApi.remove(rule.id); setRules(p => p.filter(x => x.id !== rule.id)); } catch { setNotice({ type: 'error', text: 'Không thể xóa quy tắc.' }); } };
  const runTest = async () => { setTesting(true); setResult(null); try { setResult(await moderationApi.test(testTitle, testContent)); } catch { setNotice({ type: 'error', text: 'Không thể thử quy tắc.' }); } finally { setTesting(false); } };
  const field = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs text-zinc-950 placeholder-zinc-400 outline-none focus:border-accent dark:border-white/10 dark:bg-white/[0.03] dark:text-white';

  return <div className="mx-auto max-w-7xl space-y-8 p-6 sm:p-10">
    <header className="border-b border-zinc-200/80 pb-6 dark:border-white/[0.08]">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent dark:text-rose-600"><ShieldAlert className="h-3.5 w-3.5" /> QUẢN TRỊ NỘI DUNG</div>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">Quy tắc kiểm duyệt</h1>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Chặn từ khóa hoặc regex khi người dùng đăng và sửa bài viết đã xuất bản.</p>
    </header>
    {notice && <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-xs font-medium ${notice.type === 'ok' ? 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-rose-500/30 bg-rose-50 text-accent dark:bg-rose-500/10 dark:text-rose-300'}`}><span className="flex items-center gap-2">{notice.type === 'ok' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{notice.text}</span><button onClick={() => setNotice(null)}><X className="h-4 w-4" /></button></div>}
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <section className="space-y-5 rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/70 lg:col-span-5">
        <div><h2 className="font-bold text-zinc-950 dark:text-white">{editingId ? 'Chỉnh sửa quy tắc' : 'Thêm quy tắc mới'}</h2><p className="mt-0.5 text-xs text-zinc-500">Regex được kiểm tra trước khi lưu.</p></div>
        <form onSubmit={submit} className="space-y-4">
          <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tên quy tắc" className={field} />
          <div className="grid grid-cols-3 gap-3"><select value={form.ruleType} onChange={e => setForm({ ...form, ruleType: e.target.value as ModerationRuleType })} className={field}><option value="keyword">Từ khóa</option><option value="regex">Regex</option></select><input required value={form.pattern} onChange={e => setForm({ ...form, pattern: e.target.value })} placeholder={form.ruleType === 'regex' ? 'ví dụ: spam\\s+' : 'ví dụ: quảng cáo'} className={`${field} col-span-2 font-mono`} /></div>
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={form.isEnabled} onChange={e => setForm({ ...form, isEnabled: e.target.checked })} /> Bật ngay sau khi lưu</label>
          <div className="flex gap-2"><button disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-bold text-white shadow-md shadow-accent/25 hover:bg-accent-hover disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}{editingId ? 'Lưu thay đổi' : 'Thêm quy tắc'}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-zinc-200 px-4 text-xs font-semibold dark:border-white/10">Hủy</button>}</div>
        </form>
      </section>
      <section className="overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/70 lg:col-span-7">
        <div className="border-b border-zinc-200/80 px-6 py-5 dark:border-white/[0.06]"><h2 className="font-bold text-zinc-950 dark:text-white">Danh sách quy tắc</h2><p className="mt-0.5 text-xs text-zinc-500">{rules.filter(r => r.isEnabled).length} / {rules.length} quy tắc đang bật</p></div>
        {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div> : rules.length === 0 ? <div className="p-12 text-center text-xs text-zinc-500">Chưa có quy tắc bật — bài gửi đăng sẽ tự xuất bản.</div> : <div className="divide-y divide-zinc-200/60 dark:divide-white/[0.05]">{rules.map(rule => <div key={rule.id} className="flex gap-4 p-5"><button onClick={() => toggle(rule.id)} title={rule.isEnabled ? 'Tắt quy tắc' : 'Bật quy tắc'} className={`mt-0.5 rounded-lg p-2 ${rule.isEnabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-400 dark:bg-white/5'}`}><Power className="h-4 w-4" /></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-zinc-950 dark:text-white">{rule.name}</strong><span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] uppercase text-zinc-500 dark:bg-white/5">{rule.ruleType}</span>{!rule.isEnabled && <span className="text-[10px] font-bold uppercase text-zinc-400">Đã tắt</span>}</div><code className="mt-2 block break-all rounded-lg bg-zinc-50 px-2 py-1.5 text-[11px] text-accent dark:bg-black/20 dark:text-red-300">{rule.pattern}</code></div><div className="flex h-fit gap-1"><button onClick={() => edit(rule)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-accent dark:hover:bg-white/5"><Edit3 className="h-4 w-4" /></button><button onClick={() => remove(rule)} className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}
      </section>
    </div>
    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0c121e]/70"><div className="flex items-center gap-2"><Play className="h-4 w-4 text-accent" /><h2 className="font-bold text-zinc-950 dark:text-white">Thử quy tắc đang bật</h2></div><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"><input value={testTitle} onChange={e => setTestTitle(e.target.value)} placeholder="Tiêu đề thử nghiệm" className={field}/><textarea rows={3} value={testContent} onChange={e => setTestContent(e.target.value)} placeholder="Nội dung thử nghiệm" className={field}/></div><div className="mt-3 flex items-center gap-4"><button onClick={runTest} disabled={testing} className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">{testing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Kiểm tra</button>{result && <p className={`text-xs font-medium ${result.outcome === 'pass' ? 'text-emerald-600' : result.outcome === 'reject' ? 'text-rose-600' : 'text-amber-600'}`}>{result.outcome === 'pass' ? 'Đạt: không khớp quy tắc nào.' : `${result.outcome === 'reject' ? 'Vi phạm' : 'Lỗi bộ lọc'}: ${result.reason}`}</p>}</div></section>
  </div>;
}
