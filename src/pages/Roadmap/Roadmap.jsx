import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProgress } from '../../context/ProgressContext.jsx';
import { MODULES, MODULE_CATEGORIES } from '../../data/modules.js';
import { generateRoadmap } from '../../utils/adaptive.js';
import AITutor from '../../components/ai/AITutor.jsx';

// Layout calculation for node graph
function computeLayout(modules, roadmapModuleIds) {
  const tiers = {};
  for (const cat of MODULE_CATEGORIES) tiers[cat] = [];
  for (const id of roadmapModuleIds) {
    const mod = MODULES.find(m => m.id === id);
    if (mod) tiers[mod.category].push(mod);
  }

  const nodes = [];
  const edges = [];
  const tierY = {};
  let y = 0;
  const tierGap = 160;
  const nodeW = 200, nodeH = 68;

  for (const cat of MODULE_CATEGORIES) {
    const mods = tiers[cat];
    if (mods.length === 0) continue;
    tierY[cat] = y;
    const totalWidth = mods.length * (nodeW + 24) - 24;
    const startX = Math.max(0, (900 - totalWidth) / 2);

    mods.forEach((mod, i) => {
      const x = startX + i * (nodeW + 24);
      nodes.push({ id: mod.id, x, y: y + 32, w: nodeW, h: nodeH, mod, cat });
    });
    y += tierGap;
  }

  // Compute edges from prerequisites
  for (const node of nodes) {
    for (const prereqId of node.mod.prereqs) {
      const prereqNode = nodes.find(n => n.id === prereqId);
      if (prereqNode) {
        edges.push({
          from: prereqNode,
          to: node,
          fromId: prereqId,
          toId: node.id,
        });
      }
    }
  }

  return { nodes, edges, totalH: y + 60 };
}

const TIER_COLORS = {
  Foundations: '#3b82f6',
  Intermediate: '#f59e0b',
  Advanced: '#ef4444',
  Expert: '#8b5cf6',
};

export default function Roadmap() {
  const { user } = useAuth();
  const { progress, skills } = useProgress();
  const nav = useNavigate();
  const svgRef = useRef(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  const roadmap = skills && progress ? generateRoadmap(skills, user?.goal || '', progress.completedModules || []) : { type: 'full', modules: MODULES.map(m => m.id) };

  const layout = useMemo(() => computeLayout(MODULES, roadmap.modules), [roadmap.modules]);

  const getNodeStatus = (id) => {
    if (progress?.completedModules?.includes(id)) return 'completed';
    if (progress?.currentModule === id) return 'current';
    if (roadmap.modules[0] === id) return 'current';
    return 'recommended';
  };

  // Pan handlers
  const onMouseDown = (e) => {
    if (e.target.closest('.roadmap-graph-node')) return;
    setDragging({ startX: e.clientX - pan.x, startY: e.clientY - pan.y });
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragging.startX, y: e.clientY - dragging.startY });
  };
  const onMouseUp = () => setDragging(null);

  // SVG curve path between nodes
  const edgePath = (from, to) => {
    const x1 = from.x + from.w / 2;
    const y1 = from.y + from.h;
    const x2 = to.x + to.w / 2;
    const y2 = to.y;
    const cy1 = y1 + (y2 - y1) * 0.4;
    const cy2 = y2 - (y2 - y1) * 0.4;
    return `M${x1},${y1} C${x1},${cy1} ${x2},${cy2} ${x2},${y2}`;
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1 className="page-title">🗺️ My Learning Roadmap</h1>
        <p className="page-subtitle">
          {roadmap.isBeginner
            ? '📚 Full 24-module path — start from the foundations'
            : `🎯 Personalized path based on your knowledge (${roadmap.modules.length} modules recommended)`}
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        {MODULE_CATEGORIES.map(cat => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: TIER_COLORS[cat] }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{cat}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>✅ Completed</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>▶ Current</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>○ Recommended</span>
        </div>
      </div>

      {!roadmap.isBeginner && roadmap.weakSkills?.length > 0 && (
        <div className="card" style={{ marginBottom: 24, background: 'rgba(255,171,64,0.05)', borderColor: 'rgba(255,171,64,0.2)' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--warning)' }}>⚠ Focus Areas</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
            Your roadmap prioritizes modules that strengthen your weak areas:
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {roadmap.weakSkills.map(s => <span key={s} className="tag tag-warning">{s}</span>)}
          </div>
        </div>
      )}

      {/* Interactive Node Graph */}
      <div
        className="roadmap-graph-container"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height={layout.totalH + 40}
          viewBox={`${-pan.x} ${-pan.y} 920 ${layout.totalH + 40}`}
          style={{ overflow: 'visible' }}
        >
          {/* Tier labels */}
          {MODULE_CATEGORIES.map(cat => {
            const nodesInTier = layout.nodes.filter(n => n.cat === cat);
            if (nodesInTier.length === 0) return null;
            const topY = nodesInTier[0].y;
            return (
              <text key={cat} x={10} y={topY - 8} fill={TIER_COLORS[cat]} fontSize="11" fontWeight="700" fontFamily="var(--font-main)" textAnchor="start">
                {cat.toUpperCase()}
              </text>
            );
          })}

          {/* Edges */}
          {layout.edges.map((edge, i) => {
            const fromStatus = getNodeStatus(edge.fromId);
            const toStatus = getNodeStatus(edge.toId);
            const isActive = fromStatus === 'completed';
            return (
              <path
                key={i}
                d={edgePath(edge.from, edge.to)}
                fill="none"
                stroke={isActive ? TIER_COLORS[edge.to.cat] || '#3b82f6' : '#cbd5e1'}
                strokeWidth={isActive ? 2.5 : 1.5}
                strokeDasharray={isActive ? '' : '6,4'}
                opacity={isActive ? 0.8 : 0.4}
                markerEnd={isActive ? '' : ''}
              />
            );
          })}

          {/* Nodes */}
          {layout.nodes.map(node => {
            const status = getNodeStatus(node.id);
            const isHovered = hoveredNode === node.id;
            const tierColor = TIER_COLORS[node.cat] || '#3b82f6';
            return (
              <g key={node.id} className="roadmap-graph-node"
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => nav(`/modules/${node.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {/* Node background */}
                <rect
                  x={node.x} y={node.y} width={node.w} height={node.h}
                  rx={8} ry={8}
                  fill={status === 'completed' ? '#f0fdf4' : status === 'current' ? '#eff6ff' : '#ffffff'}
                  stroke={status === 'completed' ? '#059669' : status === 'current' ? tierColor : '#e2e8f0'}
                  strokeWidth={status === 'current' ? 2 : isHovered ? 2 : 1}
                  filter={isHovered ? 'url(#shadow)' : ''}
                />
                {/* Top color bar */}
                <rect x={node.x} y={node.y} width={node.w} height={3} rx={8} fill={tierColor} />
                {/* Module number */}
                <text x={node.x + 10} y={node.y + 20} fill={tierColor} fontSize="10" fontWeight="700" fontFamily="var(--font-main)">
                  M{node.id}
                </text>
                {/* Status icon */}
                <text x={node.x + node.w - 20} y={node.y + 20} fontSize="12" textAnchor="end">
                  {status === 'completed' ? '✅' : status === 'current' ? '▶' : '○'}
                </text>
                {/* Title (truncated) */}
                <text x={node.x + 10} y={node.y + 40} fill="#0f172a" fontSize="11" fontWeight="600" fontFamily="var(--font-main)">
                  {node.mod.title.length > 24 ? node.mod.title.slice(0, 22) + '…' : node.mod.title}
                </text>
                {/* Category */}
                <text x={node.x + 10} y={node.y + 56} fill="#64748b" fontSize="9" fontFamily="var(--font-main)">
                  {node.cat}
                </text>
              </g>
            );
          })}

          {/* Shadow filter */}
          <defs>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#00000015" />
            </filter>
          </defs>
        </svg>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button className="btn btn-primary" onClick={() => nav('/modules')}>Browse All Modules</button>
      </div>
      <AITutor />
    </div>
  );
}
