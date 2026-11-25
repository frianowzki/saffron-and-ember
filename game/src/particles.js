// Kitchen particle effects: rising steam curls, sizzle sparks, chop confetti, flour puffs, and score popups.

export function createParticleSystem() {
  return {
    particles: [],
    popups: [],
    shakeTime: 0,
    shakePower: 0,
  };
}

export function triggerShake(sys, power = 4, duration = 0.14) {
  sys.shakePower = Math.max(sys.shakePower, power);
  sys.shakeTime = Math.max(sys.shakeTime, duration);
}

export function addSteam(sys, x, y, tint = 'rgba(255, 250, 240, 0.45)') {
  sys.particles.push({
    kind: 'steam',
    x: x + (Math.random() - 0.5) * 18,
    y: y + (Math.random() - 0.5) * 8,
    vx: (Math.random() - 0.5) * 14,
    vy: -22 - Math.random() * 18,
    size: 6 + Math.random() * 7,
    life: 0.9 + Math.random() * 0.6,
    maxLife: 1.5,
    color: tint,
  });
}

export function addSizzleSparks(sys, x, y, count = 4) {
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
    const speed = 35 + Math.random() * 55;
    sys.particles.push({
      kind: 'spark',
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.2 + Math.random() * 2.4,
      life: 0.28 + Math.random() * 0.25,
      maxLife: 0.53,
      color: Math.random() > 0.4 ? '#ffbe42' : '#ff6b2b',
    });
  }
}

export function addChopBurst(sys, x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    sys.particles.push({
      kind: 'chip',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      size: 3 + Math.random() * 3.5,
      life: 0.32 + Math.random() * 0.24,
      maxLife: 0.56,
      color,
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 12,
    });
  }
}

export function addFlourPuff(sys, x, y) {
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 25 + Math.random() * 45;
    sys.particles.push({
      kind: 'steam',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      life: 0.32 + Math.random() * 0.18,
      maxLife: 0.5,
      color: 'rgba(255, 248, 232, 0.55)',
    });
  }
}

export function addServeCelebration(sys, x, y) {
  const colors = ['#f2b705', '#ff7b3b', '#52b86d', '#fff3cc'];
  for (let i = 0; i < 16; i++) {
    const angle = -Math.PI * 0.1 - Math.random() * Math.PI * 0.8;
    const speed = 70 + Math.random() * 110;
    sys.particles.push({
      kind: 'chip',
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      size: 3.5 + Math.random() * 3.5,
      life: 0.55 + Math.random() * 0.35,
      maxLife: 0.9,
      color: colors[i % colors.length],
      rot: Math.random() * Math.PI,
      vrot: (Math.random() - 0.5) * 14,
    });
  }
}

export function addFloatingText(sys, x, y, text, color = '#ffe066', size = 18) {
  sys.popups.push({
    x,
    y,
    vy: -44,
    text,
    color,
    size,
    life: 1.25,
    maxLife: 1.25,
  });
}

export function updateParticles(sys, dt) {
  if (sys.shakeTime > 0) {
    sys.shakeTime = Math.max(0, sys.shakeTime - dt);
    if (sys.shakeTime === 0) sys.shakePower = 0;
  }

  for (let i = sys.particles.length - 1; i >= 0; i--) {
    const p = sys.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      sys.particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'chip') {
      p.vy += 220 * dt;
      p.rot += p.vrot * dt;
    } else if (p.kind === 'steam') {
      p.size += dt * 9;
      p.vx += Math.sin(p.life * 6) * 8 * dt;
    }
  }

  for (let i = sys.popups.length - 1; i >= 0; i--) {
    const t = sys.popups[i];
    t.life -= dt;
    if (t.life <= 0) {
      sys.popups.splice(i, 1);
      continue;
    }
    t.y += t.vy * dt;
    t.vy *= 0.95;
  }
}

export function renderParticles(ctx, sys) {
  for (const p of sys.particles) {
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.kind === 'steam') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'spark') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size * 0.6, -p.size * 0.4, p.size * 1.2, p.size * 0.8);
    }
    ctx.restore();
  }

  for (const t of sys.popups) {
    const alpha = Math.max(0, Math.min(1, t.life / (t.maxLife * 0.6)));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${t.size}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(24, 15, 10, 0.88)';
    ctx.strokeText(t.text, t.x, t.y);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  }
}
