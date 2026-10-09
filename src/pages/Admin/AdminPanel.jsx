import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminApi } from '../../services/quantumApi.js';
import { getDefaultAdminContent, mergeAdminContent } from '../../data/adminDefaults.js';

const sections = [['overview', 'Overview'], ['users', 'Users'], ['contests', 'Contests'], ['modules', 'Modules'], ['topics', 'Topics'], ['resources', 'Resources'], ['questions', 'Questions'], ['circuit-challenges', 'Circuit challenges'], ['coding-challenges', 'Coding challenges'], ['achievements', 'Achievements'], ['projects', 'Projects'], ['announcements', 'Announcements'], ['settings', 'Settings'], ['audit', 'Audit log']];
const contentSections = new Set(sections.map(([key]) => key).filter(key => !['overview', 'users', 'contests', 'settings', 'audit'].includes(key)));

export default function AdminPanel() {
  const { refreshUser } = useAuth();
  const [section, setSection] = useState('overview'); const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [query, setQuery] = useState(''); const [editor, setEditor] = useState(null); const [contestEditor, setContestEditor] = useState(false); const [editingContest, setEditingContest] = useState(null); const [roleSaving, setRoleSaving] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      if (section === 'overview') {
        setData(await adminApi.dashboard());
      } else if (section === 'users') {
        setData(await adminApi.users(query));
      } else if (section === 'contests') {
        setData(await adminApi.contests());
      } else if (section === 'settings') {
        setData(await adminApi.settings());
      } else if (section === 'audit') {
        setData(await adminApi.auditLogs());
      } else {
        let dbItems = [];
        try {
          const res = await adminApi.content(section, query);
          dbItems = res?.items || [];
        } catch {
          dbItems = [];
        }
        const defaultItems = getDefaultAdminContent(section, query);
        const merged = mergeAdminContent(dbItems, defaultItems);
        setData({ items: merged });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { setQuery(''); setEditor(null); setContestEditor(false); setEditingContest(null); load(); }, [section]);
  const saveContent = async values => {
    try {
      const isDbUuid = editor?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editor.id);
      if (isDbUuid) {
        await adminApi.updateContent(section, editor.id, values);
      } else {
        await adminApi.createContent(section, values);
      }
      setEditor(null);
      setNotice('Saved.');
      await load();
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };
  const archive = async row => {
    if (!window.confirm(`Archive "${row.title}"? Historical records will be preserved.`)) return;
    try {
      const isDbUuid = row?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row.id);
      if (isDbUuid) {
        await adminApi.archiveContent(section, row.id);
      } else {
        await adminApi.createContent(section, { ...row, status: 'archived' });
      }
      setNotice('Archived.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const updateRole = async (id, role) => { setRoleSaving(id); try { await adminApi.updateUserRole(id, role); if (role === 'student' || role === 'instructor' || role === 'admin') { await refreshUser(); } setNotice('User role updated.'); load(); } catch (e) { setError(e.message); } finally { setRoleSaving(''); } };
  const saveSettings = async values => { try { await adminApi.updateSettings(values); setNotice('Settings saved.'); load(); } catch (e) { setError(e.message); throw e; } };
  const saveContest = async values => { try { await adminApi.createContest(values); setContestEditor(false); setNotice('Contest and problem created.'); await load(); } catch (e) { setError(e.message); throw e; } };
  const updateContest = async (id, values) => { try { await adminApi.updateContest(id, values); setEditingContest(null); setNotice('Contest updated.'); await load(); } catch (e) { setError(e.message); throw e; } };
  const rows = data?.items || data?.users || data?.logs || []; const title = sections.find(([key]) => key === section)?.[1];
  return <div className="page fade-in"><div className="page-header"><h1 className="page-title">Admin Dashboard</h1><p className="page-subtitle">Secure management for platform content and operations.</p></div><div className="tabs" style={{ marginBottom: 18, overflowX: 'auto' }}>{sections.map(([key, name]) => <button key={key} className={`tab ${section === key ? 'active' : ''}`} onClick={() => setSection(key)}>{name}</button>)}</div>{notice && <div className="tag tag-success" style={{ marginBottom: 14 }}>{notice}</div>}{error && <div className="card" style={{ color: 'var(--danger)', marginBottom: 14 }}>{error} <button className="btn btn-secondary btn-sm" onClick={load}>Retry</button></div>}{section === 'overview' && <Overview data={data?.metrics} loading={loading} refresh={load} />}{section === 'users' && <Users rows={rows} loading={loading} query={query} setQuery={setQuery} refresh={load} updateRole={updateRole} saving={roleSaving} />}{section === 'contests' && <Contests rows={data?.contests || []} loading={loading} create={() => setContestEditor(true)} edit={setEditingContest} />}{section === 'settings' && <Settings data={data?.settings} loading={loading} save={saveSettings} />}{section === 'audit' && <Records rows={rows} loading={loading} audit refresh={load} />}{contentSections.has(section) && <Content title={title} section={section} rows={rows} loading={loading} query={query} setQuery={setQuery} refresh={load} create={() => setEditor({})} edit={setEditor} archive={archive} />}{editor && <Editor value={editor} title={title} section={section} close={() => setEditor(null)} save={saveContent} />}{contestEditor && <ContestEditor close={() => setContestEditor(false)} save={saveContest} />}{editingContest && <ContestEditModal contest={editingContest} close={() => setEditingContest(null)} save={updateContest} />}</div>;
}

function Overview({ data, loading, refresh }) { const cards = [['Users', data?.total_users], ['Modules', data?.total_modules], ['Published modules', data?.published_modules], ['Topics', data?.total_topics], ['Contests', data?.total_contests], ['Live contests', data?.live_contests], ['Submissions', data?.total_submissions], ['Quantum jobs', data?.total_quantum_jobs]]; return <><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}><h2 style={{ margin: 0 }}>Platform metrics</h2><button className="btn btn-secondary btn-sm" onClick={refresh}>Refresh</button></div><div className="stats-grid">{cards.map(([name, value]) => <div className="stat-card" key={name}><div className="stat-value">{loading ? '—' : value ?? 'Unavailable'}</div><div className="stat-label">{name}</div></div>)}</div></>; }
function Search({ query, setQuery, refresh, createLabel, create }) { return <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}><input className="form-input" style={{ maxWidth: 360 }} value={query} placeholder="Search by title or name" onChange={e => setQuery(e.target.value)} /><button className="btn btn-secondary" onClick={refresh}>Search</button>{create && <button className="btn btn-primary" onClick={create}>+ {createLabel}</button>}</div>; }
function Users({ rows, loading, query, setQuery, refresh, updateRole, saving }) { return <><Search query={query} setQuery={setQuery} refresh={refresh} /><div className="card"><h3>Users</h3>{loading ? <Empty text="Loading…" /> : <table style={{ width: '100%', textAlign: 'left' }}><thead><tr><th>Name</th><th>Role</th><th>Knowledge</th><th>XP</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.full_name || 'Unnamed user'}</td><td><select className="form-input" value={row.role} disabled={saving === row.id} onChange={e => updateRole(row.id, e.target.value)}><option value="student">Student</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></td><td>{row.knowledge_score ?? '—'}%</td><td>{row.total_xp ?? 0}</td></tr>)}</tbody></table>}</div></>; }
function Settings({ data, loading, save }) { const [form, setForm] = useState({ contest_submission_limit: 10, allow_contest_resubmissions: true, maintenance_message: '' }); const [saving, setSaving] = useState(false); useEffect(() => { if (data) setForm(data); }, [data]); if (loading) return <div className="card"><Empty text="Loading…" /></div>; const submit = async e => { e.preventDefault(); setSaving(true); try { await save({ ...form, contest_submission_limit: Number(form.contest_submission_limit) }); } finally { setSaving(false); } }; return <form className="grid grid-2" onSubmit={submit}><section className="card"><h2>Contest settings</h2><label>Submission limit per problem<input className="form-input" type="number" min="1" max="50" value={form.contest_submission_limit} onChange={e => setForm({ ...form, contest_submission_limit: e.target.value })} /></label><label style={{ display: 'block', marginTop: 16 }}><input type="checkbox" checked={form.allow_contest_resubmissions} onChange={e => setForm({ ...form, allow_contest_resubmissions: e.target.checked })} /> Allow participants to resubmit</label><button className="btn btn-primary" style={{ marginTop: 18 }} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></section><section className="card"><h2>Platform notice</h2><label>Maintenance message<textarea className="form-input" rows="5" maxLength="500" value={form.maintenance_message} onChange={e => setForm({ ...form, maintenance_message: e.target.value })} /></label><p style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>Secrets are never saved here.</p></section></form>; }
function Contests({ rows, loading, create, edit }) { return <section><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}><h2 style={{ margin: 0 }}>Contests</h2><button className="btn btn-primary" onClick={create}>Create contest</button></div><div className="card">{loading ? <Empty text="Loading contests…" /> : !rows.length ? <Empty text="No contests have been created." /> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}><thead><tr><th>Title</th><th>Starts</th><th>Ends</th><th>Rated</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.title}</td><td>{new Date(row.start_time).toLocaleString()}</td><td>{new Date(row.end_time).toLocaleString()}</td><td>{row.is_rated ? 'Yes' : 'No'}</td><td><button className="text-action" onClick={() => edit(row)}>Edit</button></td></tr>)}</tbody></table></div>}</div></section>; }
function localDateTime(value) { return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function ContestEditModal({ contest, close, save }) {
  const [form, setForm] = useState(() => ({
    title: contest.title || '',
    description: contest.description || '',
    start_time: contest.start_time ? localDateTime(new Date(contest.start_time)) : '',
    end_time: contest.end_time ? localDateTime(new Date(contest.end_time)) : '',
    is_rated: contest.is_rated ?? true,
  }));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const submit = async event => {
    event.preventDefault();
    setFormError('');
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setFormError('End time must be later than start time.');
      return;
    }
    setSaving(true);
    try {
      await save(contest.id, {
        title: form.title,
        description: form.description || null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        is_rated: form.is_rated,
      });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };
  return <div className="modal-overlay"><form className="modal" onSubmit={submit} style={{ maxHeight: '90vh', overflowY: 'auto', width: 'min(600px, 94vw)' }}><h2>Edit contest</h2>{formError && <div className="card" style={{ color: 'var(--danger)', marginBottom: 12 }}>{formError}</div>}<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><label>Contest title<input className="form-input" required maxLength="200" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><label>Description<textarea className="form-input" rows="3" maxLength="5000" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label><div className="grid grid-2"><label>Start date & time<input className="form-input" type="datetime-local" required value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></label><label>End date & time<input className="form-input" type="datetime-local" required value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></label></div><label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}><input type="checkbox" checked={form.is_rated} onChange={e => setForm({ ...form, is_rated: e.target.checked })} /> Rated contest</label></div><div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}><button type="button" className="btn btn-secondary" onClick={close}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div></form></div>;
}
function ContestEditor({ close, save }) {
  const [form, setForm] = useState(() => ({
    title: '', description: '', start_time: localDateTime(new Date(Date.now() + 3600000)), end_time: localDateTime(new Date(Date.now() + 7200000)), is_rated: true,
    problem_title: '', statement: '', contest_type: 'circuit_building', framework: 'qiskit', qubit_budget: 2, gate_budget: 20, par_gates: 2, par_depth: 2, pass_threshold: 0.95, reference_ops: '',
  }));
  const [saving, setSaving] = useState(false); const [formError, setFormError] = useState('');
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const submit = async event => {
    event.preventDefault(); setFormError('');
    let referenceOps;
    try { referenceOps = JSON.parse(form.reference_ops); } catch { setFormError('Reference circuit must be valid JSON.'); return; }
    if (!Array.isArray(referenceOps) || referenceOps.length === 0) { setFormError('Add at least one reference-circuit operation.'); return; }
    setSaving(true);
    try {
      await save({
        title: form.title,
        description: form.description || null,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        is_rated: form.is_rated,
        problems: [{
          title: form.problem_title,
          statement: form.statement,
          contest_type: form.contest_type,
          framework: form.framework,
          qubit_budget: Number(form.qubit_budget),
          gate_budget: Number(form.gate_budget),
          par_gates: Number(form.par_gates),
          par_depth: Number(form.par_depth),
          pass_threshold: Number(form.pass_threshold),
          order_index: 0,
          reference_ops: referenceOps,
        }],
      });
    } catch (error) { setFormError(error.message); } finally { setSaving(false); }
  };
  return <div className="modal-overlay"><form className="modal" onSubmit={submit} style={{ maxHeight: '90vh', overflowY: 'auto', width: 'min(760px, 94vw)' }}><h2>Create contest</h2><div className="grid grid-2"><label>Contest title<input className="form-input" required maxLength="200" value={form.title} onChange={event => set('title', event.target.value)} /></label><label>Description<input className="form-input" maxLength="5000" value={form.description} onChange={event => set('description', event.target.value)} /></label><label>Start time<input className="form-input" type="datetime-local" required value={form.start_time} onChange={event => set('start_time', event.target.value)} /></label><label>End time<input className="form-input" type="datetime-local" required value={form.end_time} onChange={event => set('end_time', event.target.value)} /></label></div><label style={{ display: 'block', marginTop: 12 }}><input type="checkbox" checked={form.is_rated} onChange={event => set('is_rated', event.target.checked)} /> Rated contest</label><hr /><h3>First problem</h3><div className="grid grid-2"><label>Problem title<input className="form-input" required maxLength="200" value={form.problem_title} onChange={event => set('problem_title', event.target.value)} /></label><label>Challenge type<select className="form-input" value={form.contest_type} onChange={event => set('contest_type', event.target.value)}><option value="circuit_building">Circuit building</option><option value="coding">Code submission</option></select></label><label>Framework<select className="form-input" value={form.framework} onChange={event => set('framework', event.target.value)}><option value="qiskit">Qiskit</option><option value="pennylane">PennyLane</option><option value="cirq">Cirq</option></select></label><label>Qubit budget<input className="form-input" type="number" min="1" max="20" required value={form.qubit_budget} onChange={event => set('qubit_budget', event.target.value)} /></label><label>Gate budget<input className="form-input" type="number" min="1" max="500" required value={form.gate_budget} onChange={event => set('gate_budget', event.target.value)} /></label><label>Target gate count<input className="form-input" type="number" min="1" max="500" required value={form.par_gates} onChange={event => set('par_gates', event.target.value)} /></label><label>Target circuit depth<input className="form-input" type="number" min="1" max="500" required value={form.par_depth} onChange={event => set('par_depth', event.target.value)} /></label><label>Pass threshold<input className="form-input" type="number" min="0" max="1" step="0.01" required value={form.pass_threshold} onChange={event => set('pass_threshold', event.target.value)} /></label></div><label style={{ display: 'block', marginTop: 12 }}>Problem statement<textarea className="form-input" rows="4" required maxLength="5000" value={form.statement} onChange={event => set('statement', event.target.value)} /></label><label style={{ display: 'block', marginTop: 12 }}>Private reference circuit (JSON)<textarea className="form-input" rows="5" required value={form.reference_ops} onChange={event => set('reference_ops', event.target.value)} /><small>Operations require gate and target; controlled gates also require control. Accepted gates: H, X, Y, Z, S, T, Rx, Ry, Rz, CNOT, CZ, SWAP.</small></label>{formError && <p role="alert" style={{ color: 'var(--danger)' }}>{formError}</p>}<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}><button type="button" className="btn btn-secondary" onClick={close}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? 'Creating…' : 'Create contest'}</button></div></form></div>;
}
function Content({ title, section, rows, loading, query, setQuery, refresh, create, edit, archive }) { return <><Search query={query} setQuery={setQuery} refresh={refresh} createLabel={`New ${title.replace(/s$/, '')}`} create={create} /><Records section={section} rows={rows} loading={loading} edit={edit} archive={archive} refresh={refresh} /></>; }
function Records({ section, rows, loading, edit, archive, audit, refresh }) {
  const getBadgeMeta = row => {
    const meta = row.metadata || {};
    if (section === 'modules') return meta.category ? `${meta.category} · ${meta.difficulty || 'Beginner'}` : meta.difficulty;
    if (section === 'topics') return meta.difficulty ? `${meta.difficulty}${meta.estimated_minutes ? ` · ${meta.estimated_minutes}m` : ''}` : meta.module_name;
    if (section === 'resources') return meta.resource_type || meta.author;
    if (section === 'questions') return meta.difficulty ? `${meta.difficulty}${meta.xp_reward ? ` · ${meta.xp_reward} XP` : ''}` : null;
    if (section === 'circuit-challenges') return `${meta.qubit_budget || 2}q · ${meta.difficulty || 'Medium'}`;
    if (section === 'coding-challenges') return `${meta.framework || 'Qiskit'} · ${meta.difficulty || 'Medium'}`;
    if (section === 'achievements') return `${meta.badge_icon || '🏆'} ${meta.category || ''} (+${meta.xp_reward || 100} XP)`;
    if (section === 'projects') return meta.difficulty ? `${meta.difficulty}${meta.estimated_hours ? ` · ${meta.estimated_hours}` : ''}` : null;
    if (section === 'announcements') return meta.priority || 'Normal';
    return null;
  };
  const fields = audit ? ['action', 'entity_type', 'entity_id', 'created_at'] : ['title', 'status', 'updated_at'];
  return <div className="card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h3 style={{ margin: 0 }}>{audit ? 'Append-only audit log' : 'Records'}</h3>{refresh && <button className="btn btn-secondary btn-sm" onClick={refresh}>Refresh</button>}</div>{loading ? <Empty text="Loading…" /> : !rows.length ? <Empty text="No records found." /> : <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}><thead><tr>{fields.map(field => <th key={field}>{field.replace('_', ' ')}</th>)}{!audit && <th>Details</th>}{edit && <th>Actions</th>}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{fields.map(field => <td key={field}>{field === 'status' ? <span className={`tag ${row.status === 'published' ? 'tag-success' : row.status === 'archived' ? 'tag-warning' : 'tag-info'}`}>{row.status}</span> : field.includes('_at') ? new Date(row[field]).toLocaleString() : String(row[field] ?? '—')}</td>)}{!audit && <td style={{ color: 'var(--text-muted)', fontSize: '.84rem' }}>{getBadgeMeta(row) || '—'}</td>}{edit && <td style={{ whiteSpace: 'nowrap' }}><button className="text-action" style={{ marginRight: 8 }} onClick={() => edit(row)}>Edit</button> <button className="text-action danger" onClick={() => archive(row)}>Archive</button></td>}</tr>)}</tbody></table></div>}</div>;
}
function Editor({ value, title, section, close, save }) {
  const [name, setName] = useState(value.title || '');
  const [description, setDescription] = useState(value.description || value.body || '');
  const [status, setStatus] = useState(value.status || 'draft');
  const [sortOrder, setSortOrder] = useState(value.sort_order ?? 0);
  const [meta, setMeta] = useState(() => ({ ...(value.metadata || {}) }));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const setM = (key, val) => setMeta(prev => ({ ...prev, [key]: val }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await save({
        title: name,
        description: description || null,
        body: description || null,
        status,
        sort_order: Number(sortOrder || 0),
        metadata: meta,
      });
    } catch (err) {
      setFormError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const isEdit = Boolean(value.id);
  const singular = title.replace(/s$/, '');

  return (
    <div className="modal-overlay">
      <form className="modal" onSubmit={submit} style={{ maxHeight: '92vh', overflowY: 'auto', width: 'min(780px, 95vw)' }}>
        <h2>{isEdit ? `Edit ${singular}` : `New ${singular}`}</h2>
        {formError && <div className="card" style={{ color: 'var(--danger)', marginBottom: 14 }}>{formError}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid grid-2">
            <label>
              {section === 'questions' ? 'Question prompt' : section === 'announcements' ? 'Headline' : 'Title'}
              <input className="form-input" required maxLength="200" value={name} onChange={e => setName(e.target.value)} placeholder={`Enter ${singular.toLowerCase()} title`} />
            </label>
            <label>
              Status
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          </div>

          <label>
            {section === 'questions' ? 'Explanation / Solution breakdown' : section === 'announcements' ? 'Announcement body' : 'Description'}
            <textarea className="form-input" rows={section === 'announcements' || section === 'topics' ? 4 : 3} value={description} onChange={e => setDescription(e.target.value)} placeholder={`Enter ${singular.toLowerCase()} description or content`} />
          </label>

          {section === 'modules' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Module Options & Settings</h4>
              <div className="grid grid-2">
                <label>
                  Category
                  <select className="form-input" value={meta.category || 'Core Quantum'} onChange={e => setM('category', e.target.value)}>
                    <option>Core Quantum</option>
                    <option>Quantum Algorithms</option>
                    <option>Quantum Hardware</option>
                    <option>Quantum Cryptography</option>
                    <option>Error Correction</option>
                    <option>Applied Quantum</option>
                  </select>
                </label>
                <label>
                  Difficulty
                  <select className="form-input" value={meta.difficulty || 'Beginner'} onChange={e => setM('difficulty', e.target.value)}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label>
                  Icon / Emoji
                  <input className="form-input" placeholder="e.g. ⚛️, 🧠, 🔐" value={meta.icon || ''} onChange={e => setM('icon', e.target.value)} />
                </label>
                <label>
                  Estimated duration
                  <input className="form-input" placeholder="e.g. 45 mins, 2 hours" value={meta.duration || ''} onChange={e => setM('duration', e.target.value)} />
                </label>
              </div>
              <label style={{ display: 'block', marginTop: 10 }}>
                Prerequisites
                <input className="form-input" placeholder="e.g. Linear Algebra, Basic Python" value={meta.prerequisites || ''} onChange={e => setM('prerequisites', e.target.value)} />
              </label>
            </div>
          )}

          {section === 'topics' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Topic Options & Curriculum Addons</h4>
              <div className="grid grid-2">
                <label>
                  Module name / Track
                  <input className="form-input" placeholder="e.g. Module 1: Foundations" value={meta.module_name || ''} onChange={e => setM('module_name', e.target.value)} />
                </label>
                <label>
                  Difficulty
                  <select className="form-input" value={meta.difficulty || 'Beginner'} onChange={e => setM('difficulty', e.target.value)}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label>
                  Estimated read/lab time
                  <input className="form-input" placeholder="e.g. 15 mins" value={meta.estimated_minutes || ''} onChange={e => setM('estimated_minutes', e.target.value)} />
                </label>
                <label>
                  Key concepts (comma-separated)
                  <input className="form-input" placeholder="e.g. Superposition, Bloch Sphere, H gate" value={meta.key_concepts || ''} onChange={e => setM('key_concepts', e.target.value)} />
                </label>
              </div>
              <div className="grid grid-2" style={{ marginTop: 10 }}>
                <label>
                  Formula (LaTeX / Math expression)
                  <input className="form-input" placeholder="e.g. |\psi\rangle = \alpha|0\rangle + \beta|1\rangle" value={meta.formula || ''} onChange={e => setM('formula', e.target.value)} />
                </label>
                <label>
                  Interactive Lab / Circuit Suggestion
                  <input className="form-input" placeholder="e.g. Build an H gate circuit" value={meta.lab_prompt || ''} onChange={e => setM('lab_prompt', e.target.value)} />
                </label>
              </div>
            </div>
          )}

          {section === 'resources' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Resource Link & Metadata</h4>
              <div className="grid grid-2">
                <label>
                  Resource type
                  <select className="form-input" value={meta.resource_type || 'Documentation'} onChange={e => setM('resource_type', e.target.value)}>
                    <option>Documentation</option>
                    <option>Research Paper</option>
                    <option>Interactive Lab</option>
                    <option>Video Tutorial</option>
                    <option>Textbook / Book</option>
                    <option>Cheat Sheet</option>
                  </select>
                </label>
                <label>
                  Author / Publisher
                  <input className="form-input" placeholder="e.g. IBM Quantum, PennyLane, Nielsen & Chuang" value={meta.author || ''} onChange={e => setM('author', e.target.value)} />
                </label>
              </div>
              <div className="grid grid-2" style={{ marginTop: 10 }}>
                <label>
                  Resource URL
                  <input className="form-input" type="url" placeholder="https://..." value={meta.url || ''} onChange={e => setM('url', e.target.value)} />
                </label>
                <label>
                  Tags (comma-separated)
                  <input className="form-input" placeholder="e.g. qiskit, algorithms, entanglement" value={meta.tags || ''} onChange={e => setM('tags', e.target.value)} />
                </label>
              </div>
            </div>
          )}

          {section === 'questions' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Quiz & Assessment Options</h4>
              <div className="grid grid-3">
                <label>
                  Difficulty
                  <select className="form-input" value={meta.difficulty || 'Medium'} onChange={e => setM('difficulty', e.target.value)}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
                <label>
                  XP Points Awarded
                  <input className="form-input" type="number" min="5" max="500" value={meta.xp_reward ?? 20} onChange={e => setM('xp_reward', Number(e.target.value))} />
                </label>
                <label>
                  Topic / Concept tag
                  <input className="form-input" placeholder="e.g. Quantum Gates" value={meta.topic || ''} onChange={e => setM('topic', e.target.value)} />
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                <h5 style={{ margin: '0 0 8px 0' }}>Answer Options</h5>
                <div className="grid grid-2" style={{ gap: 10 }}>
                  <label>
                    Option A (required)
                    <input className="form-input" required placeholder="Option A text" value={meta.option_a || ''} onChange={e => setM('option_a', e.target.value)} />
                  </label>
                  <label>
                    Option B (required)
                    <input className="form-input" required placeholder="Option B text" value={meta.option_b || ''} onChange={e => setM('option_b', e.target.value)} />
                  </label>
                  <label>
                    Option C
                    <input className="form-input" placeholder="Option C text" value={meta.option_c || ''} onChange={e => setM('option_c', e.target.value)} />
                  </label>
                  <label>
                    Option D
                    <input className="form-input" placeholder="Option D text" value={meta.option_d || ''} onChange={e => setM('option_d', e.target.value)} />
                  </label>
                </div>
                <label style={{ display: 'block', marginTop: 10, maxWidth: 300 }}>
                  Correct Option
                  <select className="form-input" value={meta.correct_answer || 'A'} onChange={e => setM('correct_answer', e.target.value)}>
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {section === 'circuit-challenges' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Circuit Challenge Constraints & Target</h4>
              <div className="grid grid-3">
                <label>
                  Difficulty
                  <select className="form-input" value={meta.difficulty || 'Medium'} onChange={e => setM('difficulty', e.target.value)}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
                <label>
                  Qubit budget
                  <input className="form-input" type="number" min="1" max="10" value={meta.qubit_budget ?? 2} onChange={e => setM('qubit_budget', Number(e.target.value))} />
                </label>
                <label>
                  Gate budget (max gates)
                  <input className="form-input" type="number" min="1" max="100" value={meta.gate_budget ?? 10} onChange={e => setM('gate_budget', Number(e.target.value))} />
                </label>
              </div>
              <div className="grid grid-2" style={{ marginTop: 10 }}>
                <label>
                  Target state / Goal
                  <input className="form-input" placeholder="e.g. (|00> + |11>)/√2" value={meta.target_state || ''} onChange={e => setM('target_state', e.target.value)} />
                </label>
                <label>
                  Allowed gates
                  <input className="form-input" placeholder="e.g. H, X, Y, Z, CNOT, SWAP" value={meta.allowed_gates || 'H, X, Y, Z, CNOT'} onChange={e => setM('allowed_gates', e.target.value)} />
                </label>
              </div>
              <label style={{ display: 'block', marginTop: 10, maxWidth: 200 }}>
                XP Reward
                <input className="form-input" type="number" min="10" max="1000" value={meta.xp_reward ?? 50} onChange={e => setM('xp_reward', Number(e.target.value))} />
              </label>
            </div>
          )}

          {section === 'coding-challenges' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Coding Challenge Configuration</h4>
              <div className="grid grid-3">
                <label>
                  Framework
                  <select className="form-input" value={meta.framework || 'qiskit'} onChange={e => setM('framework', e.target.value)}>
                    <option value="qiskit">Qiskit</option>
                    <option value="pennylane">PennyLane</option>
                    <option value="cirq">Cirq</option>
                  </select>
                </label>
                <label>
                  Difficulty
                  <select className="form-input" value={meta.difficulty || 'Medium'} onChange={e => setM('difficulty', e.target.value)}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
                <label>
                  XP Reward
                  <input className="form-input" type="number" min="10" max="1000" value={meta.xp_reward ?? 100} onChange={e => setM('xp_reward', Number(e.target.value))} />
                </label>
              </div>
              <label style={{ display: 'block', marginTop: 10 }}>
                Starter Code Template
                <textarea className="form-input" rows="4" style={{ fontFamily: 'monospace' }} placeholder="from qiskit import QuantumCircuit\n\ndef solution():\n    qc = QuantumCircuit(2)\n    # Your code\n    return qc" value={meta.starter_code || ''} onChange={e => setM('starter_code', e.target.value)} />
              </label>
              <label style={{ display: 'block', marginTop: 10 }}>
                Reference Solution / Test Hints
                <textarea className="form-input" rows="3" style={{ fontFamily: 'monospace' }} placeholder="Reference solution or test assertions" value={meta.reference_solution || ''} onChange={e => setM('reference_solution', e.target.value)} />
              </label>
            </div>
          )}

          {section === 'achievements' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Badge & Unlock Rules</h4>
              <div className="grid grid-3">
                <label>
                  Badge icon / Emoji
                  <input className="form-input" placeholder="e.g. 🏆, ⚡, 🌟, 🎖️, 🚀, 🔮" value={meta.badge_icon || '🏆'} onChange={e => setM('badge_icon', e.target.value)} />
                </label>
                <label>
                  Category
                  <select className="form-input" value={meta.category || 'Circuits'} onChange={e => setM('category', e.target.value)}>
                    <option>Circuits</option>
                    <option>Quizzes</option>
                    <option>Streaks</option>
                    <option>Contests</option>
                    <option>Mastery</option>
                    <option>Community</option>
                  </select>
                </label>
                <label>
                  XP Reward
                  <input className="form-input" type="number" min="10" max="5000" value={meta.xp_reward ?? 100} onChange={e => setM('xp_reward', Number(e.target.value))} />
                </label>
              </div>
              <div className="grid grid-2" style={{ marginTop: 10 }}>
                <label>
                  Unlock criteria type
                  <select className="form-input" value={meta.criteria_type || 'circuits_completed'} onChange={e => setM('criteria_type', e.target.value)}>
                    <option value="circuits_completed">Circuits Completed</option>
                    <option value="modules_completed">Modules Completed</option>
                    <option value="streak_days">Streak Days</option>
                    <option value="contests_won">Contest Rank</option>
                    <option value="xp_earned">Total XP</option>
                  </select>
                </label>
                <label>
                  Target threshold count
                  <input className="form-input" type="number" min="1" max="10000" value={meta.threshold ?? 5} onChange={e => setM('threshold', Number(e.target.value))} />
                </label>
              </div>
            </div>
          )}

          {section === 'projects' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Project Specification & Links</h4>
              <div className="grid grid-2">
                <label>
                  Difficulty
                  <select className="form-input" value={meta.difficulty || 'Intermediate'} onChange={e => setM('difficulty', e.target.value)}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label>
                  Estimated completion time
                  <input className="form-input" placeholder="e.g. 6 hours, 2 days" value={meta.estimated_hours || ''} onChange={e => setM('estimated_hours', e.target.value)} />
                </label>
              </div>
              <div className="grid grid-2" style={{ marginTop: 10 }}>
                <label>
                  Template / GitHub repository URL
                  <input className="form-input" type="url" placeholder="https://github.com/..." value={meta.github_url || ''} onChange={e => setM('github_url', e.target.value)} />
                </label>
                <label>
                  Skills / Tech stack
                  <input className="form-input" placeholder="e.g. Qiskit, Python, Cryptography" value={meta.skills || ''} onChange={e => setM('skills', e.target.value)} />
                </label>
              </div>
              <label style={{ display: 'block', marginTop: 10 }}>
                Key deliverables / Milestone breakdown
                <textarea className="form-input" rows="3" placeholder="Milestone 1: State preparation\nMilestone 2: Key sifting" value={meta.milestones || ''} onChange={e => setM('milestones', e.target.value)} />
              </label>
            </div>
          )}

          {section === 'announcements' && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 14 }}>
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>Announcement Banner & Audience</h4>
              <div className="grid grid-3">
                <label>
                  Priority
                  <select className="form-input" value={meta.priority || 'Normal'} onChange={e => setM('priority', e.target.value)}>
                    <option>Normal</option>
                    <option>Important</option>
                    <option>Urgent</option>
                  </select>
                </label>
                <label>
                  Banner theme
                  <select className="form-input" value={meta.style || 'info'} onChange={e => setM('style', e.target.value)}>
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="danger">Danger (Red)</option>
                  </select>
                </label>
                <label>
                  Target audience
                  <select className="form-input" value={meta.audience || 'All users'} onChange={e => setM('audience', e.target.value)}>
                    <option>All users</option>
                    <option>Students only</option>
                    <option>Instructors only</option>
                  </select>
                </label>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input type="checkbox" checked={!!meta.pinned} onChange={e => setM('pinned', e.target.checked)} />
                Pin announcement to top of dashboard
              </label>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 10 }}>
            <label style={{ maxWidth: 160 }}>
              Display sort order
              <input className="form-input" type="number" min="0" value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 22 }}>
          <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : `Create ${singular}`}</button>
        </div>
      </form>
    </div>
  );
}
function Empty({ text }) { return <p style={{ color: 'var(--text-muted)', padding: 18 }}>{text}</p>; }
