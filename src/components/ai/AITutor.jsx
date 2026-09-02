import { useState, useRef, useEffect } from 'react';
import { getGroqResponse } from '../../utils/aiTutor.js';
import { storage } from '../../utils/storage.js';
import { useAuth } from '../../context/AuthContext.jsx';

function formatInlineMarkdown(str) {
  if (!str) return '';
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(37,99,235,0.15);color:#38bdf8;padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.85em">$1</code>')
    .replace(/(\|[01\+−ψϕΨΦ]⟩)/g, '<span style="color:#a855f7;font-weight:600;font-family:var(--font-mono)">$1</span>');
}

function FormattedMessage({ text }) {
  if (!text) return null;

  // Split text by code blocks first
  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="formatted-ai-message" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {blocks.map((block, i) => {
        if (block.startsWith('```')) {
          const lines = block.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const lang = firstLine.match(/^[a-zA-Z0-9_-]+$/) ? firstLine : '';
          const codeContent = lang ? lines.slice(1).join('\n') : lines.join('\n');
          return (
            <div key={i} style={{ margin: '6px 0', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {lang && (
                <div style={{ background: '#1e293b', padding: '4px 10px', fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {lang.toUpperCase()}
                </div>
              )}
              <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '10px 12px', margin: 0, fontSize: '0.8rem', fontFamily: 'var(--font-mono)', overflowX: 'auto', lineHeight: 1.45 }}>
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        // Regular markdown line rendering
        const lines = block.split('\n');
        return lines.map((line, lineIdx) => {
          let trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} style={{ height: 4 }} />;

          if (trimmed.startsWith('#### ')) {
            return <h5 key={lineIdx} style={{ color: 'var(--accent)', marginTop: 8, marginBottom: 4, fontSize: '0.88rem', fontWeight: 700 }}>{trimmed.replace(/^####\s+/, '')}</h5>;
          }
          if (trimmed.startsWith('### ')) {
            return <h4 key={lineIdx} style={{ color: 'var(--accent)', marginTop: 10, marginBottom: 6, fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 4 }}>{trimmed.replace(/^###\s+/, '')}</h4>;
          }
          if (trimmed.startsWith('## ')) {
            return <h3 key={lineIdx} style={{ color: 'var(--text-primary)', marginTop: 12, marginBottom: 6, fontSize: '1rem', fontWeight: 700 }}>{trimmed.replace(/^##\s+/, '')}</h3>;
          }
          if (trimmed.startsWith('# ')) {
            return <h2 key={lineIdx} style={{ color: 'var(--text-primary)', marginTop: 14, marginBottom: 8, fontSize: '1.05rem', fontWeight: 800 }}>{trimmed.replace(/^#\s+/, '')}</h2>;
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
            const listContent = trimmed.replace(/^([-*]|\d+\.)\s+/, '');
            const parsed = formatInlineMarkdown(listContent);
            return (
              <div key={lineIdx} style={{ display: 'flex', gap: 6, marginLeft: 6, marginBottom: 4, fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span>
                <span dangerouslySetInnerHTML={{ __html: parsed }} />
              </div>
            );
          }

          if (trimmed.startsWith('> ')) {
            const quoteContent = formatInlineMarkdown(trimmed.replace(/^>\s+/, ''));
            return (
              <div key={lineIdx} style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 10, margin: '6px 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(37,99,235,0.04)', padding: '6px 10px', borderRadius: '0 6px 6px 0' }} dangerouslySetInnerHTML={{ __html: quoteContent }} />
            );
          }

          const formatted = formatInlineMarkdown(trimmed);
          return (
            <p key={lineIdx} style={{ marginBottom: 4, fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: formatted }} />
          );
        });
      })}
    </div>
  );
}

export default function AITutor({ moduleId, topicName }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: '👋 Hi! I\'m your AI quantum tutor. Ask me anything about quantum computing, request hints, or ask me to explain a concept!' }
  ]);
  const chatMessagesRef = useRef(null);
  const lastAiMsgRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll logic:
  // When AI finishes responding, scroll to the top of the AI response so the user reads from the initial line.
  // While user is typing/waiting, scroll to bottom to show prompt and typing indicator.
  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];

    if (lastMsg.role === 'ai' && !loading && lastAiMsgRef.current && chatMessagesRef.current) {
      const container = chatMessagesRef.current;
      const targetElement = lastAiMsgRef.current;
      const targetScrollTop = Math.max(0, targetElement.offsetTop - 12);
      container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', text: input };
    const updatedWithUser = [...messages, userMsg];
    setMessages(updatedWithUser);
    setInput('');
    setLoading(true);

    try {
      const aiText = await getGroqResponse(input, messages, moduleId, topicName);
      const aiMsg = { role: 'ai', text: aiText };
      const final = [...updatedWithUser, aiMsg];
      setMessages(final);
      if (user) storage.setChatHistory(user.id, final);
    } catch (err) {
      const errorMsg = { role: 'ai', text: '⚠️ Something went wrong. Please try again.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return (
    <button className="chat-toggle" onClick={() => setOpen(true)} title="Open AI Tutor">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <path d="M12 7v4M10 9h4" strokeWidth="1.8"></path>
      </svg>
    </button>
  );

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>AI Quantum Tutor</span>
            <span style={{
              fontSize: '0.6rem', fontWeight: 600, padding: '2px 6px',
              background: 'rgba(37, 99, 235, 0.1)', color: 'var(--accent)',
              borderRadius: 8
            }}>AI TUTOR</span>
          </div>
          {moduleId && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Module {moduleId}{topicName ? ` · ${topicName}` : ''}</div>}
        </div>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setOpen(false)}>✕</button>
      </div>
      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((m, i) => (
          <div
            key={i}
            ref={i === messages.length - 1 && m.role === 'ai' ? lastAiMsgRef : null}
            className={`chat-msg ${m.role === 'user' ? 'user' : 'ai'}`}
          >
            {m.role === 'user' ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
            ) : (
              <FormattedMessage text={m.text} />
            )}
          </div>
        ))}
        {loading && (
          <div className="chat-msg ai" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="typing-indicator">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input
          className="form-input"
          placeholder="Ask anything quantum..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          disabled={loading}
          style={{ fontSize: '0.85rem', padding: '8px 12px' }}
        />
        <button className="btn btn-primary btn-sm" onClick={send} disabled={loading}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
