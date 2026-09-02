import { useRef, useEffect, useState, useCallback } from 'react';

// Interactive 3D Bloch Sphere rendered with Canvas 2D
export default function BlochSphere({ coords = { x: 0, y: 0, z: 1 }, size = 220, label = '' }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState({ azimuth: -0.5, elevation: 0.45 });
  const dragRef = useRef(null);
  const animRef = useRef({ x: 0, y: 0, z: 1 });
  const frameRef = useRef(null);

  // Smoothly animate coords
  useEffect(() => {
    const target = coords;
    let raf;
    const animate = () => {
      const cur = animRef.current;
      const dx = target.x - cur.x, dy = target.y - cur.y, dz = target.z - cur.z;
      if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001 || Math.abs(dz) > 0.001) {
        animRef.current = { x: cur.x + dx * 0.12, y: cur.y + dy * 0.12, z: cur.z + dz * 0.12 };
        raf = requestAnimationFrame(animate);
      } else {
        animRef.current = { ...target };
      }
      draw();
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [coords, rotation]);

  // Project 3D → 2D with rotation
  const project = useCallback((x, y, z) => {
    const { azimuth, elevation } = rotation;
    const ca = Math.cos(azimuth), sa = Math.sin(azimuth);
    const ce = Math.cos(elevation), se = Math.sin(elevation);
    const x1 = x * ca - y * sa;
    const y1 = x * sa + y * ca;
    const y2 = y1 * ce - z * se;
    const z2 = y1 * se + z * ce;
    return { px: x1, py: -y2, depth: z2 };
  }, [rotation]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.34;

    ctx.clearRect(0, 0, w, h);

    // Background glow
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
    bgGrad.addColorStop(0, 'rgba(37, 99, 235, 0.04)');
    bgGrad.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw sphere wireframe circles
    const drawCircle3D = (axis, color, dash = []) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash(dash);
      const steps = 64;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        let x, y, z;
        if (axis === 'xy') { x = Math.cos(t); y = Math.sin(t); z = 0; }
        else if (axis === 'xz') { x = Math.cos(t); y = 0; z = Math.sin(t); }
        else { x = 0; y = Math.cos(t); z = Math.sin(t); }
        const p = project(x, y, z);
        const sx = cx + p.px * R, sy = cy + p.py * R;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawCircle3D('xy', 'rgba(100,116,139,0.25)', [3, 3]);
    drawCircle3D('xz', 'rgba(100,116,139,0.2)', [3, 3]);
    drawCircle3D('yz', 'rgba(100,116,139,0.2)', [3, 3]);

    // Axes
    const axes = [
      { dir: [1, 0, 0], label: '|+⟩', color: '#ef4444' },
      { dir: [-1, 0, 0], label: '|−⟩', color: '#ef4444' },
      { dir: [0, 1, 0], label: '|+i⟩', color: '#22c55e' },
      { dir: [0, -1, 0], label: '|−i⟩', color: '#22c55e' },
      { dir: [0, 0, 1], label: '|0⟩', color: '#3b82f6' },
      { dir: [0, 0, -1], label: '|1⟩', color: '#3b82f6' },
    ];

    for (const a of axes) {
      const p = project(...a.dir);
      const sx = cx + p.px * R, sy = cy + p.py * R;
      // Axis line
      ctx.beginPath();
      ctx.strokeStyle = `${a.color}40`;
      ctx.lineWidth = 1;
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      // Axis label
      const lp = project(a.dir[0] * 1.22, a.dir[1] * 1.22, a.dir[2] * 1.22);
      ctx.fillStyle = a.color;
      ctx.font = `600 ${Math.round(size * 0.05)}px 'JetBrains Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.label, cx + lp.px * R, cy + lp.py * R);
    }

    // State vector arrow
    const sv = animRef.current;
    const sp = project(sv.x, sv.y, sv.z);
    const sx = cx + sp.px * R, sy = cy + sp.py * R;

    // Glow trail
    const trailGrad = ctx.createLinearGradient(cx, cy, sx, sy);
    trailGrad.addColorStop(0, 'rgba(124, 77, 255, 0.05)');
    trailGrad.addColorStop(1, 'rgba(124, 77, 255, 0.4)');
    ctx.beginPath();
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 3;
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // Arrow
    ctx.beginPath();
    ctx.strokeStyle = '#7c4dff';
    ctx.lineWidth = 2.5;
    ctx.moveTo(cx, cy);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(sy - cy, sx - cx);
    const headLen = 10;
    ctx.beginPath();
    ctx.fillStyle = '#7c4dff';
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - headLen * Math.cos(angle - 0.4), sy - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(sx - headLen * Math.cos(angle + 0.4), sy - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    // Dot at tip
    ctx.beginPath();
    ctx.fillStyle = '#7c4dff';
    ctx.shadowColor = '#7c4dff';
    ctx.shadowBlur = 12;
    ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center dot
    ctx.beginPath();
    ctx.fillStyle = 'rgba(100,116,139,0.3)';
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }, [rotation, size, project]);

  useEffect(() => { draw(); }, [draw]);

  // Mouse rotation
  const onMouseDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY, az: rotation.azimuth, el: rotation.elevation };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setRotation({
      azimuth: dragRef.current.az + dx * 0.01,
      elevation: Math.max(-1.4, Math.min(1.4, dragRef.current.el + dy * 0.01)),
    });
  };
  const onMouseUp = () => { dragRef.current = null; };

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  return (
    <div className="bloch-sphere-container">
      {label && <div className="bloch-sphere-label">{label}</div>}
      <canvas
        ref={canvasRef}
        width={size * dpr}
        height={size * dpr}
        style={{ width: size, height: size, cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />
      <div className="bloch-sphere-hint">Drag to rotate</div>
    </div>
  );
}
