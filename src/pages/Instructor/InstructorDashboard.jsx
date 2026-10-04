import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient.js';
import { storage } from '../../utils/storage.js';
import { useAuth } from '../../context/AuthContext.jsx';

const deriveStatus = (knowledge) => {
  if (knowledge >= 85) return 'Top performer';
  if (knowledge >= 65) return 'On track';
  if (knowledge >= 55) return 'Review';
  return 'Needs attention';
};

const normaliseStudent = (row) => ({
  id: row.id,
  name: row.name || row.email?.split('@')[0] || 'Student',
  email: row.email || '',
  knowledge: Number(row.knowledge_score || 0),
  completed: Number(row.completed_modules || 0),
  current: Number(row.current_module || 0),
  assessment: Math.round(Number(row.assessment_average || 0)),
  circuits: Number(row.circuit_count || 0),
  lab: Number(row.lab_count || 0),
  status: deriveStatus(Number(row.knowledge_score || 0)),
});

const normaliseAssessment = (row) => ({
  id: row.id,
  name: row.title,
  description: row.description || '',
  type: row.assessment_type === 'lab' ? 'Coding' : row.assessment_type === 'mixed' ? 'Mixed' : 'Quiz',
  difficulty: row.difficulty ? row.difficulty.charAt(0).toUpperCase() + row.difficulty.slice(1) : 'Medium',
  duration: Number(row.duration_minutes || 30),
  assigned: Number(row.assigned_count || 0),
  submissions: Number(row.submission_count || 0),
  average: Math.round(Number(row.average_score || 0)),
  published: row.status === 'published',
  status: row.status,
});

const tone = status => status === 'Needs attention' ? 'tag-danger' : status === 'Top performer' || status === 'On track' ? 'tag-success' : 'tag-warning';
const Meter = ({ value, danger = false }) => <div className="progress-bar"><div className={`progress-fill${danger ? '' : ' success'}`} style={{ width: `${value}%` }} /></div>;

export default function InstructorDashboard() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All students');
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (!supabase || !user?.id) throw new Error('Supabase authentication is required for the instructor workspace.');
      const [{ data, error: rosterError }, assessmentRows, learningPaths] = await Promise.all([
        supabase.rpc('get_instructor_students'), storage.getAssessments(), storage.getInstructorLearningPaths(user.id),
      ]);
      if (rosterError) throw rosterError;
      const nextStudents = (data || []).map(normaliseStudent);
      setStudents(nextStudents);
      setSelected(current => nextStudents.find(student => student.id === current?.id) || nextStudents[0] || null);
      setAssessments((assessmentRows || []).map(normaliseAssessment));
      setPaths(learningPaths || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load instructor data.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [user?.id]);

  const visibleStudents = useMemo(
    () => students.filter(s => (filter === 'All students' || s.status === filter) && s.name.toLowerCase().includes(query.toLowerCase())),
    [students, query, filter]
  );
  const act = message => { setNotice(message); window.setTimeout(() => setNotice(''), 2600); };

  const persistAssessment = async (draft, existingId) => {
    if (!user) return;
    const payload = {
      title: draft.name.trim(),
      description: draft.description || '',
      created_by: user.id,
      assessment_type: draft.type === 'Coding' ? 'lab' : draft.type === 'Mixed' || draft.type === 'MCQ + Circuit' || draft.type === 'MCQ + Coding + Circuit' ? 'mixed' : 'quiz',
      difficulty: (draft.difficulty || 'Medium').toLowerCase(),
      duration_minutes: parseInt(draft.duration) || 30,
      status: draft.published ? 'published' : 'draft',
    };
    let saved;
    if (existingId) {
      saved = await storage.updateAssessment(existingId, payload);
    } else {
      saved = await storage.createAssessment(payload);
    }
    if (saved) {
      await load();
    }
    return saved;
  };

  const togglePublished = async (assessment) => {
    if (!assessment.id) { return; }
    const newStatus = assessment.published ? 'draft' : 'published';
    const saved = await storage.updateAssessment(assessment.id, { status: newStatus });
    if (saved) {
      await load();
      act(newStatus === 'published' ? 'Assessment published.' : 'Assessment moved to draft.');
    }
  };

  const deleteAssessment = async (assessment) => {
    if (!assessment.id) return;
    const ok = await storage.deleteAssessment(assessment.id);
    if (ok) { await load(); act('Assessment deleted.'); }
  };

  const tabs = [['overview', 'Overview'], ['students', 'Students'], ['assessments', 'Assessments'], ['paths', 'Learning paths'], ['settings', 'Settings']];

  const needAttention = students.filter(s => s.status === 'Needs attention');
  const avgKnowledge = students.length ? Math.round(students.reduce((sum, s) => sum + s.knowledge, 0) / students.length) : 0;
  const avgCompleted = students.length ? Math.round(students.reduce((sum, s) => sum + s.completed, 0) / students.length) : 0;

  return <div className="page fade-in instructor-workspace">
    <div className="page-header instructor-header">
      <div><div className="eyebrow">INSTRUCTOR WORKSPACE</div><h1 className="page-title">Teaching command center</h1><p className="page-subtitle">Live student progress, assessments, feedback, and learning-path assignments.</p></div>
      <div className="instructor-actions"><button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button><button className="btn btn-primary" onClick={() => { setTab('assessments'); setModal({ kind: 'assessment' }); }}>+ Create assessment</button></div>
    </div>
    {notice && <div className="toast instructor-toast">✓ {notice}</div>}
    {error && <div className="card" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}
    <div className="tabs instructor-tabs">{tabs.map(([id, label]) => <div key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{label}</div>)}</div>

    {tab === 'overview' && <Overview students={students} loading={loading} needAttention={needAttention} avgKnowledge={avgKnowledge} avgCompleted={avgCompleted} assessments={assessments} onStudents={() => setTab('students')} />}
    {tab === 'students' && <Students selected={selected} setSelected={setSelected} students={visibleStudents} loading={loading} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} instructorId={user?.id} act={act} refresh={load} />}
    {tab === 'assessments' && <Assessments assessments={assessments} loading={loading} togglePublished={togglePublished} deleteAssessment={deleteAssessment} act={act} open={setModal} />}
    {tab === 'paths' && <LearningPaths paths={paths} students={students} />}
    {tab === 'settings' && <Settings user={user} updateUser={updateUser} act={act} />}
    {modal && <WorkspaceModal modal={modal} close={() => setModal(null)} persistAssessment={persistAssessment} act={act} />}
  </div>;
}

function Overview({ students, loading, needAttention, avgKnowledge, avgCompleted, assessments, onStudents }) {
  const completionRate = students.length ? Math.round((avgCompleted / 24) * 100) : 0;
  const completedAssessments = assessments.reduce((sum, a) => sum + (a.submissions || 0), 0);
  const stats = [
    ['Total Students', loading ? '—' : String(students.length), 'Assigned to this instructor'],
    ['Assessments Completed', String(completedAssessments), 'Across all published assessments'],
    ['Average Knowledge Score', loading ? '—' : `${avgKnowledge}%`, 'Across enrolled students'],
    ['Course Completion Rate', loading ? '—' : `${completionRate}%`, `${avgCompleted} modules on average`],
    ['Need Attention', loading ? '—' : String(needAttention.length), 'Below 55% knowledge'],
  ];
  return <>
    <div className="grid grid-3 instructor-stats">{stats.map(([label, value, hint], index) => <div className="stat-card" key={label}><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className={index === 5 ? 'metric-alert' : 'metric-hint'}>{hint}</div></div>)}</div>
    <section className="card" style={{ marginTop: 20 }}><div className="section-title"><div><h3>Students needing attention</h3><p>Persisted student progress with a knowledge score below 55%.</p></div><span className="tag tag-danger">{needAttention.length} flagged</span></div><StudentRows students={needAttention} compact /><button className="btn btn-secondary btn-sm" onClick={onStudents}>View student signals →</button></section>
  </>;
}

function Students({ students: rows, loading, selected, setSelected, query, setQuery, filter, setFilter, instructorId, act, refresh }) { const [feedback, setFeedback] = useState(''); const [path, setPath] = useState(''); const [saving, setSaving] = useState(false); const sendFeedback = async () => { if (!selected || !feedback.trim() || !instructorId) return; setSaving(true); const saved = await storage.sendInstructorFeedback({ instructorId, studentId: selected.id, message: feedback.trim() }); setSaving(false); if (saved) { setFeedback(''); act(`Feedback sent to ${selected.name}.`); } }; const assignPath = async () => { if (!selected || !path.trim() || !instructorId) return; setSaving(true); const saved = await storage.assignLearningPath({ instructorId, studentId: selected.id, title: path.trim() }); setSaving(false); if (saved) { setPath(''); await refresh(); act(`Learning path assigned to ${selected.name}.`); } }; return <>
  <div className="card instructor-toolbar"><input className="form-input" placeholder="Search students by name..." value={query} onChange={e => setQuery(e.target.value)} /><select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}><option>All students</option><option>Needs attention</option><option>Review</option><option>On track</option><option>Top performer</option></select></div>
  {loading && <p style={{ color: 'var(--text-muted)', padding: 18 }}>Loading students…</p>}
  {!loading && rows.length === 0 && <p style={{ color: 'var(--text-muted)', padding: 18 }}>No students assigned yet. Ask your admin to assign students.</p>}
  {!loading && rows.length > 0 && selected && <div className="grid grid-2"><section className="card roster-card"><div className="section-title"><div><h3>Student progress</h3><p>{rows.length} learners matching this view</p></div></div><div className="student-table">{rows.map(student => <button className={`student-row ${selected.id === student.id ? 'selected' : ''}`} key={student.id || student.name} onClick={() => setSelected(student)}><span><strong>{student.name}</strong><small>{student.email || 'Assigned learner'} · Module {student.current || '—'}</small></span><span className="student-score">{student.knowledge}%<small>{student.completed}/24 modules</small></span><span className={`tag ${tone(student.status)}`}>{student.status}</span></button>)}</div></section>
  <section className="card student-detail"><div className="section-title"><div><span className={`tag ${tone(selected.status)}`}>{selected.status}</span><h3 style={{ marginTop: 10 }}>{selected.name}</h3><p>{selected.email || 'Assigned learner'} · Current module {selected.current || '—'}</p></div></div><div className="detail-score"><strong>{selected.knowledge}%</strong><span>Knowledge percentage</span></div><Meter value={selected.knowledge} danger={selected.knowledge < 55} /><div className="detail-grid"><Info label="Assessment average" value={`${selected.assessment}%`} /><Info label="Completed modules" value={`${selected.completed} / 24`} /><Info label="Circuit activity" value={`${selected.circuits} builds`} /><Info label="Quantum Lab" value={`${selected.lab} experiments`} /></div><label style={{ display: 'block', marginTop: 18 }}>Send feedback<textarea className="form-textarea" value={feedback} onChange={event => setFeedback(event.target.value)} /></label><button className="btn btn-secondary btn-sm" disabled={saving || !feedback.trim()} onClick={sendFeedback}>Send feedback</button><label style={{ display: 'block', marginTop: 18 }}>Assign learning path<input className="form-input" value={path} onChange={event => setPath(event.target.value)} placeholder="Learning path title" /></label><button className="btn btn-primary btn-sm" disabled={saving || !path.trim()} onClick={assignPath}>Assign path</button></section></div>}
</>; }

function Assessments({ assessments, loading, togglePublished, deleteAssessment, open }) { return <><div className="section-title"><div><h2>Assessment studio</h2><p>Build and manage persisted assessments.</p></div><button className="btn btn-primary" onClick={() => open({ kind: 'assessment' })}>+ New assessment</button></div><div className="card table-card">{loading ? <p style={{ color: 'var(--text-muted)', padding: 18 }}>Loading assessments…</p> : <table><thead><tr><th>Assessment</th><th>Format</th><th>Difficulty / time</th><th>Submissions</th><th>Average</th><th>Status</th><th /></tr></thead><tbody>{assessments.map((a, i) => <tr key={a.id || `${a.name}-${i}`}><td><strong>{a.name}</strong><small>{a.assigned} students assigned</small></td><td>{a.type}</td><td>{a.difficulty}<small>{a.duration} min</small></td><td>{a.submissions}/{a.assigned}</td><td>{a.submissions ? `${a.average}%` : '—'}</td><td><button className={`tag ${a.published ? 'tag-success' : 'tag-warning'}`} onClick={() => togglePublished(a)}>{a.published ? 'Published' : 'Draft'}</button></td><td><button className="text-action" onClick={() => open({ kind: 'assessment', assessment: a, index: i })}>Edit</button> <button className="text-action danger" onClick={() => deleteAssessment(a)}>Delete</button></td></tr>)}</tbody></table>}{!loading && !assessments.length && <p className="muted-copy">No assessments have been created.</p>}</div></> }

function LearningPaths({ paths, students }) { const names = new Map(students.map(student => [student.id, student.name])); return <section className="card"><h2>Assigned learning paths</h2>{paths.length ? <div className="activity-list">{paths.map(path => <div className="activity-item" key={path.id}><span className="activity-dot" /><div><strong>{path.title}</strong><p>{names.get(path.student_id) || 'Student'} · {new Date(path.assigned_at).toLocaleString()}</p></div></div>)}</div> : <p className="muted-copy">No active learning paths are assigned.</p>}</section>; }
function Settings({ user, updateUser, act }) { const [name, setName] = useState(user?.name || ''); const save = async event => { event.preventDefault(); await updateUser({ name }); act('Profile saved.'); }; return <form className="card" onSubmit={save}><h2>Instructor profile</h2><label>Display name<input className="form-input" value={name} onChange={event => setName(event.target.value)} required /></label><label>Email<input className="form-input" value={user?.email || ''} readOnly /></label><button className="btn btn-primary" style={{ marginTop: 16 }}>Save profile</button></form>; }
function StudentRows({ students = [], compact = false }) { return <div className="activity-list">{(compact ? students.slice(0, 4) : students).map(s => <div className="attention-row" key={s.id}><div><strong>{s.name}</strong><p>Module {s.current || '—'} · {s.completed}/24 modules completed</p></div><div><strong>{s.knowledge}%</strong><span className={`tag ${tone(s.status)}`}>{s.status}</span></div></div>)}{students.length === 0 && <p className="muted-copy">No students need attention right now.</p>}</div>; }
function Info({ label, value }) { return <div><small>{label}</small><strong>{value}</strong></div>; }

function WorkspaceModal({ modal, close, persistAssessment, act }) {
  const [draft, setDraft] = useState(modal.assessment || { name: '', description: '', type: 'MCQ', difficulty: 'Medium', duration: 30, published: false });
  const [saving, setSaving] = useState(false);
  const saveAssessment = async () => {
    if (!draft.name.trim()) return;
    setSaving(true);
    try {
      await persistAssessment(draft, modal.assessment?.id);
      act(modal.assessment ? 'Assessment updated successfully.' : 'Assessment created successfully.');
      close();
    } finally {
      setSaving(false);
    }
  };
  let title = 'Instructor tool'; let body = null;
  if (modal.kind === 'assessment') { title = modal.assessment ? 'Edit assessment' : 'Create assessment'; body = <div className="modal-form"><label>Assessment title<input className="form-input" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Assessment title" required /></label><label>Description<textarea className="form-textarea" value={draft.description || ''} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label><label>Question format<select className="form-select" value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })}><option>MCQ</option><option>Coding</option><option>Mixed</option></select></label><div className="modal-form-row"><label>Difficulty<select className="form-select" value={draft.difficulty} onChange={e => setDraft({ ...draft, difficulty: e.target.value })}><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label>Time limit<input className="form-input" type="number" min="1" value={draft.duration} onChange={e => setDraft({ ...draft, duration: e.target.value })} required /></label></div><label><input type="checkbox" checked={Boolean(draft.published)} onChange={e => setDraft({ ...draft, published: e.target.checked })} /> Publish immediately</label><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={saveAssessment} disabled={saving}>{saving ? 'Saving…' : modal.assessment ? 'Save changes' : 'Create assessment'}</button></div></div>; }
  return <div className="modal-overlay" onMouseDown={close}><div className="modal instructor-modal" onMouseDown={e => e.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="btn btn-secondary btn-sm" onClick={close}>Close</button></div>{body}</div></div>;
}
