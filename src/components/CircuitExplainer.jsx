import { useState, useEffect } from 'react';
import { explainCircuit } from '../utils/quantum.js';
import { explainCircuitWithGroq } from '../utils/aiTutor.js';

function cleanLatex(math) {
  if (!math) return '';
  return math
    .replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, (_, inner) => {
      const rows = inner.split('\\\\').map(r => r.split('&').map(cell => cell.trim()).join('  '));
      return `[ ${rows.join(' ; ')} ]`;
    })
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/$2')
    .replace(/\\frac([0-9])([0-9])/g, '$1/$2')
    .replace(/\\rangle/g, '⟩')
    .replace(/\\langle/g, '⟨')
    .replace(/\\sqrt\{2\}/g, '√2')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√$1')
    .replace(/\\otimes/g, '⊗')
    .replace(/\\pi/g, 'π')
    .replace(/\\displaystyle/g, '')
    .replace(/\\qquad/g, '  ')
    .replace(/\\quad/g, ' ')
    .replace(/\\left\|?/g, '|')
    .replace(/\\right\|?/g, '|')
    .replace(/\\bigl\(/g, '(')
    .replace(/\\bigr\)/g, ')')
    .replace(/\\bigl/g, '')
    .replace(/\\bigr/g, '')
    .replace(/\\psi/g, 'ψ')
    .replace(/\\phi/g, 'ϕ')
    .replace(/\\vert/g, '|')
    .replace(/\\[;,!:]/g, ' ')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\\\/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatInlineMarkdown(str) {
  if (!str) return '';

  let html = str;

  // 1. Process display LaTeX math blocks \[ ... \] or $$ ... $$
  html = html.replace(/(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$)/g, (_, match) => {
    const mathContent = match.replace(/^(\\\[|\$\$)/, '').replace(/(\\\]|\$\$)$/, '');
    const cleaned = cleanLatex(mathContent);
    return `<div style="padding:10px 14px;margin:10px 0;background:rgba(37,99,235,0.06);border-left:3px solid var(--accent);border-radius:6px;font-family:var(--font-mono);font-size:0.9rem;color:var(--text-primary);line-height:1.5;overflow-x:auto">${cleaned}</div>`;
  });

  // 2. Process inline LaTeX math \( ... \) or $ ... $
  html = html.replace(/(\\\([^\n]*?\\\)|(?<!\$)\$([^\$\n]+)\$(?!\$))/g, (_, match) => {
    const mathContent = match.replace(/^(\\\(|\$)/, '').replace(/(\\\)|\$)$/, '');
    const cleaned = cleanLatex(mathContent);
    return `<span style="font-family:var(--font-mono);color:#8b5cf6;font-weight:700;background:rgba(139,92,246,0.1);padding:1px 6px;border-radius:4px">${cleaned}</span>`;
  });

  // Clean remaining unhandled raw LaTeX commands inline
  html = html
    .replace(/\\pi/g, 'π')
    .replace(/\\otimes/g, '⊗')
    .replace(/\\sqrt\{2\}/g, '√2')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/$2');

  // 3. Bold **text** or __text__
  html = html.replace(/(\*\*|__)(.*?)\1/g, '<strong style="color:var(--text-primary);font-weight:700">$2</strong>');

  // 4. Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(37,99,235,0.12);color:var(--accent);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.85em;border:1px solid rgba(37,99,235,0.2)">$1</code>');

  // 5. Dirac notation kets/bras: e.g. |0⟩, |1⟩, |00⟩, |11⟩, |+⟩, |−⟩, |ψ⟩, |ψ₀⟩, ⟨ψ|
  html = html.replace(/(\|[01\+−\-\/ψϕΨΦa-zA-Z0-9\s,₀₁₂₃₄₅₆₇₈₉]+⟩|⟨[01\+−\-\/ψϕΨΦa-zA-Z0-9\s,₀₁₂₃₄₅₆₇₈₉]+\|)/g, '<span style="color:#8b5cf6;font-weight:700;font-family:var(--font-mono);background:rgba(139,92,246,0.1);padding:1px 5px;border-radius:4px">$1</span>');

  // 6. Italic *text* or _text_
  html = html.replace(/(\*|_)(.*?)\1/g, '<em style="color:var(--text-secondary);font-style:italic">$2</em>');

  return html;
}

function renderMarkdownTable(rows, tableIdx) {
  if (!rows || rows.length === 0) return null;
  
  const dataRows = rows.filter(r => !/^\|[\s\-:|]+\|$/.test(r.trim()));
  if (dataRows.length === 0) return null;

  const headerCells = dataRows[0].split('|').slice(1, -1).map(c => c.trim());
  const bodyRows = dataRows.slice(1).map(r => r.split('|').slice(1, -1).map(c => c.trim()));

  return (
    <div key={`table-${tableIdx}`} style={{ overflowX: 'auto', margin: '12px 0', borderRadius: 8, border: '1px solid var(--border-glass)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: 'rgba(37,99,235,0.08)', borderBottom: '1px solid var(--border-glass)' }}>
            {headerCells.map((h, i) => (
              <th key={i} style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(h) }} />
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} style={{ borderBottom: rIdx < bodyRows.length - 1 ? '1px solid var(--border-glass)' : 'none', background: rIdx % 2 === 1 ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} style={{ padding: '8px 12px', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cell) }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderFormattedText(text) {
  if (!text) return null;

  // Split text by code blocks (``` ... ```)
  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="formatted-ai-text" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {blocks.map((block, blockIdx) => {
        if (block.startsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : 'code';
          const codeContent = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div key={blockIdx} style={{ margin: '10px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ background: '#1e293b', padding: '6px 12px', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>💻 {lang.toUpperCase()}</span>
              </div>
              <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '12px 14px', margin: 0, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', lineHeight: 1.5 }}>
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        const lines = block.split('\n');
        let currentList = [];
        let listType = null;
        let tableRows = [];
        const renderedElements = [];

        const flushList = (key) => {
          if (currentList.length > 0) {
            if (listType === 'ol') {
              renderedElements.push(
                <ol key={`ol-${key}`} style={{ paddingLeft: 22, margin: '6px 0 10px 0', color: 'var(--text-secondary)' }}>
                  {currentList}
                </ol>
              );
            } else {
              renderedElements.push(
                <ul key={`ul-${key}`} style={{ paddingLeft: 20, margin: '6px 0 10px 0', color: 'var(--text-secondary)' }}>
                  {currentList}
                </ul>
              );
            }
            currentList = [];
            listType = null;
          }
        };

        const flushTable = (key) => {
          if (tableRows.length > 0) {
            const tableElement = renderMarkdownTable(tableRows, key);
            if (tableElement) renderedElements.push(tableElement);
            tableRows = [];
          }
        };

        lines.forEach((line, lineIdx) => {
          const trimmed = line.trim();

          // Handle Markdown Table Rows (| Col | Col |)
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            flushList(`table-list-${lineIdx}`);
            tableRows.push(trimmed);
            return;
          } else {
            flushTable(`table-${lineIdx}`);
          }

          if (!trimmed) {
            flushList(`empty-${lineIdx}`);
            renderedElements.push(<div key={`spacer-${lineIdx}`} style={{ height: 4 }} />);
            return;
          }

          if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
            flushList(`hr-${lineIdx}`);
            renderedElements.push(
              <hr key={`hr-${lineIdx}`} style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '14px 0' }} />
            );
            return;
          }

          if (trimmed.startsWith('#### ')) {
            flushList(`h4-${lineIdx}`);
            const titleHtml = formatInlineMarkdown(trimmed.replace(/^####\s+/, ''));
            renderedElements.push(
              <h5 key={`h4-${lineIdx}`} style={{ color: 'var(--accent)', marginTop: 14, marginBottom: 6, fontSize: '0.95rem', fontWeight: 700 }} dangerouslySetInnerHTML={{ __html: titleHtml }} />
            );
            return;
          }
          if (trimmed.startsWith('### ')) {
            flushList(`h3-${lineIdx}`);
            const titleHtml = formatInlineMarkdown(trimmed.replace(/^###\s+/, ''));
            renderedElements.push(
              <h4 key={`h3-${lineIdx}`} style={{ color: 'var(--accent)', marginTop: 18, marginBottom: 8, fontSize: '1.05rem', fontWeight: 700, borderBottom: '1px solid var(--border-glass)', paddingBottom: 6 }} dangerouslySetInnerHTML={{ __html: titleHtml }} />
            );
            return;
          }
          if (trimmed.startsWith('## ')) {
            flushList(`h2-${lineIdx}`);
            const titleHtml = formatInlineMarkdown(trimmed.replace(/^##\s+/, ''));
            renderedElements.push(
              <h3 key={`h2-${lineIdx}`} style={{ color: 'var(--text-primary)', marginTop: 20, marginBottom: 10, fontSize: '1.15rem', fontWeight: 700 }} dangerouslySetInnerHTML={{ __html: titleHtml }} />
            );
            return;
          }
          if (trimmed.startsWith('# ')) {
            flushList(`h1-${lineIdx}`);
            const titleHtml = formatInlineMarkdown(trimmed.replace(/^#\s+/, ''));
            renderedElements.push(
              <h2 key={`h1-${lineIdx}`} style={{ color: 'var(--text-primary)', marginTop: 22, marginBottom: 12, fontSize: '1.25rem', fontWeight: 800 }} dangerouslySetInnerHTML={{ __html: titleHtml }} />
            );
            return;
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (listType === 'ol') flushList(`switch-ol-${lineIdx}`);
            listType = 'ul';
            const listContent = formatInlineMarkdown(trimmed.replace(/^[-*]\s+/, ''));
            currentList.push(
              <li key={`li-${lineIdx}`} style={{ marginBottom: 6, lineHeight: 1.55, color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: listContent }} />
            );
            return;
          }

          if (/^\d+\.\s/.test(trimmed)) {
            if (listType === 'ul') flushList(`switch-ul-${lineIdx}`);
            listType = 'ol';
            const listContent = formatInlineMarkdown(trimmed.replace(/^\d+\.\s+/, ''));
            currentList.push(
              <li key={`li-${lineIdx}`} style={{ marginBottom: 6, lineHeight: 1.55, color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: listContent }} />
            );
            return;
          }

          if (trimmed.startsWith('> ')) {
            flushList(`quote-${lineIdx}`);
            const quoteContent = formatInlineMarkdown(trimmed.replace(/^>\s+/, ''));
            renderedElements.push(
              <div key={`quote-${lineIdx}`} style={{ borderLeft: '3px solid var(--accent)', padding: '8px 12px', margin: '8px 0', fontSize: '0.88rem', color: 'var(--text-secondary)', background: 'var(--bg-glass)', borderRadius: '0 6px 6px 0', fontStyle: 'italic' }} dangerouslySetInnerHTML={{ __html: quoteContent }} />
            );
            return;
          }

          flushList(`p-${lineIdx}`);
          const formatted = formatInlineMarkdown(trimmed);
          renderedElements.push(
            <p key={`p-${lineIdx}`} style={{ marginBottom: 6, lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '0.9rem' }} dangerouslySetInnerHTML={{ __html: formatted }} />
          );
        });

        flushList(`final-${blockIdx}`);
        return <div key={`block-${blockIdx}`}>{renderedElements}</div>;
      })}
    </div>
  );
}

export default function CircuitExplainer({ ops, nQubits, onClose }) {
  const [activeTab, setActiveTab] = useState('ai');
  const [aiText, setAiText] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);

  const explanation = explainCircuit(ops, nQubits);

  useEffect(() => {
    let isMounted = true;
    async function fetchAiExplanation() {
      setLoadingAi(true);
      const res = await explainCircuitWithGroq(ops, nQubits);
      if (isMounted) {
        setAiText(res);
        setLoadingAi(false);
      }
    }
    fetchAiExplanation();
    return () => { isMounted = false; };
  }, [ops, nQubits]);

  if (!explanation) {
    return (
      <div className="explainer-overlay" onClick={onClose}>
        <div className="explainer-drawer" onClick={e => e.stopPropagation()}>
          <div className="explainer-header">
            <h3>🧠 Circuit Explanation</h3>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            Add some gates to your circuit first, then click "Explain" to see the analysis.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="explainer-overlay" onClick={onClose}>
      <div className="explainer-drawer" onClick={e => e.stopPropagation()}>
        <div className="explainer-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.3rem' }}>🧠</span> AI Circuit Explanation
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, padding: '2px 8px',
              background: 'linear-gradient(135deg, #7c4dff, #3b82f6)', color: 'white',
              borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>AI Engine</span>
          </h3>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="explainer-tabs">
          {[
            { id: 'ai', label: '✨ AI Insight', icon: '🤖' },
            { id: 'state', label: '⟨ψ| State', icon: '📐' },
            { id: 'matrix', label: 'Matrices', icon: '🔢' },
            { id: 'concept', label: 'Concepts', icon: '💡' },
          ].map(t => (
            <button
              key={t.id}
              className={`explainer-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="explainer-content">
          {activeTab === 'ai' && (
            <div className="explainer-section">
              {loadingAi ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div className="typing-indicator" style={{ justifyContent: 'center', marginBottom: 16 }}>
                    <span className="typing-dot" style={{ width: 10, height: 10 }}></span>
                    <span className="typing-dot" style={{ width: 10, height: 10 }}></span>
                    <span className="typing-dot" style={{ width: 10, height: 10 }}></span>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>Analyzing your circuit with AI Engine...</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculating quantum state vector & tensor operations</div>
                </div>
              ) : aiText ? (
                <div className="card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', padding: 20 }}>
                  {renderFormattedText(aiText)}
                </div>
              ) : (
                <div className="card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', padding: 20 }}>
                  <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>🎯 Circuit Overview</h4>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                    Your circuit has <strong>{nQubits} qubit{nQubits > 1 ? 's' : ''}</strong> with <strong>{ops.filter(o => o.gate !== 'M').length} gate operation{ops.filter(o => o.gate !== 'M').length > 1 ? 's' : ''}</strong>.
                  </p>
                  <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>💡 Key Observations</h4>
                  {explanation.concepts.map((c, i) => (
                    <div key={i} style={{ marginBottom: 8, color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{
                      __html: '• ' + c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }} />
                  ))}
                  <div style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    💡 Tip: Switch to the <strong>State</strong> or <strong>Matrices</strong> tabs for exact mathematical step-by-step transformations.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'state' && (
            <div className="explainer-section">
              <h4 className="explainer-section-title">State Transformations</h4>
              <p className="explainer-section-desc">Step-by-step evolution of the quantum state in Dirac notation</p>
              <div className="state-flow">
                {explanation.transformations.map((t, i) => (
                  <div key={i} className="state-step">
                    <div className="state-step-label">
                      {i === 0 ? (
                        <span className="state-badge initial">Initial</span>
                      ) : (
                        <span className="state-badge gate">Step {i}: {t.step}</span>
                      )}
                    </div>
                    <div className="state-step-ket">{t.state}</div>
                    {i < explanation.transformations.length - 1 && (
                      <div className="state-arrow">↓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="explainer-section">
              <h4 className="explainer-section-title">Matrix Operations</h4>
              <p className="explainer-section-desc">Unitary matrices applied at each step</p>
              <div className="matrix-list">
                {explanation.matrices.map((m, i) => (
                  <div key={i} className="matrix-card">
                    <div className="matrix-card-header">
                      <span className="matrix-gate-name">{m.gate}</span>
                      <span className="matrix-target">on {m.target}</span>
                    </div>
                    <div className="matrix-desc">{m.desc}</div>
                    <div className="matrix-value">{m.matrix}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'concept' && (
            <div className="explainer-section">
              <h4 className="explainer-section-title">Concept Breakdown</h4>
              <p className="explainer-section-desc">Plain-English explanation of what this circuit does</p>
              <div className="concept-list">
                {explanation.concepts.map((c, i) => (
                  <div key={i} className="concept-card">
                    <div className="concept-icon">{i === explanation.concepts.length - 1 ? '📊' : '💡'}</div>
                    <div className="concept-text" dangerouslySetInnerHTML={{
                      __html: formatInlineMarkdown(c)
                    }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}