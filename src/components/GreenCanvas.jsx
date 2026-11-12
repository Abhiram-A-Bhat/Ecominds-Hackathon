import React, { useEffect, useRef } from 'react';

// ─── Guardian Campus Living Bioluminescent Cyber-Canopy ──────────────────────────────
// High-performance interactive background canvas:
//   • Dynamic organic spore & firefly nodes drifting with fluid Brownian motion
//   • Bioluminescent botanical synapses connecting proximate nodes
//   • Pulsing energy packets traveling across node links (campus IoT telemetry)
//   • Interactive mouse gravity & luminescent wake
//   • Click-triggered chlorophyll energy ripples
//   • Deep ambient breathing aurora gradients

const rand = (min, max) => Math.random() * (max - min) + min;

export function GreenCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId = null;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    const mouse = { x: -1000, y: -1000, active: false, radius: 140 };

    // Ripples spawned by clicks
    const ripples = [];

    // Telemetry energy packets moving along node connections
    const energyPulses = [];

    // Tree Growth & Biological Simulation
    let treeBirthTime = performance.now();
    let celebrationSurge = 0; // Spikes to 1 on eco-celebration event and decays

    // Generates a recursive fractal tree structure
    function buildTree(startX, startY, trunkLength, trunkAngle, maxDepth = 6) {
      const branches = [];
      const leaves = [];
      let idCounter = 0;

      function createBranch(x, y, length, angle, depth, startThreshold) {
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        const duration = 0.14 + (depth * 0.02);
        const endThreshold = Math.min(0.96, startThreshold + duration);

        const branch = {
          id: idCounter++,
          x,
          y,
          endX,
          endY,
          length,
          angle,
          depth,
          thickness: Math.max(1.2, (maxDepth - depth + 1) * 2.2),
          startThreshold,
          endThreshold,
        };
        branches.push(branch);

        if (depth < maxDepth) {
          const subCount = depth === 0 ? 3 : (Math.random() > 0.35 ? 2 : 3);
          const angleSpread = 0.44 - depth * 0.035;
          const lengthMult = 0.73 + (Math.random() * 0.08 - 0.04);

          for (let i = 0; i < subCount; i++) {
            const offsetAngle = (i - (subCount - 1) / 2) * angleSpread + (Math.random() - 0.5) * 0.12;
            createBranch(
              endX,
              endY,
              length * lengthMult,
              angle + offsetAngle,
              depth + 1,
              endThreshold
            );
          }
        } else {
          // Foliage & bioluminescent blossoms at branch terminations
          const clusterCount = 5;
          for (let l = 0; l < clusterCount; l++) {
            leaves.push({
              x: endX + (Math.random() - 0.5) * 32,
              y: endY + (Math.random() - 0.5) * 32,
              baseRadius: rand(2.2, 5.0),
              hue: rand(135, 172),
              isBlossom: Math.random() < 0.25, // 25% are vibrant flowers
              blossomHue: rand(315, 345),
              bloomThreshold: Math.min(0.99, endThreshold + rand(0, 0.03)),
              swayOffset: rand(0, Math.PI * 2),
              swaySpeed: rand(0.001, 0.0022)
            });
          }
        }
      }

      createBranch(startX, startY, trunkLength, trunkAngle, 0, 0.02);
      return { branches, leaves };
    }

    // Initialize Tree anchored at bottom-left corner
    let tree = buildTree(
      Math.max(80, width * 0.14),
      height + 10,
      Math.min(180, height * 0.25),
      -Math.PI / 2 + 0.08,
      5
    );

    // Drifting canopy spores from the tree
    const treeDrifters = [];
    const spawnTreeDrifter = () => {
      if (tree.leaves.length === 0 || treeDrifters.length >= 25) return;
      const leaf = tree.leaves[Math.floor(Math.random() * tree.leaves.length)];
      treeDrifters.push({
        x: leaf.x,
        y: leaf.y,
        vx: rand(0.2, 0.7),
        vy: rand(-0.6, -0.2),
        alpha: rand(0.4, 0.8),
        size: rand(1.5, 3.2),
        hue: leaf.isBlossom ? leaf.blossomHue : leaf.hue,
        life: 0,
        maxLife: rand(180, 360)
      });
    };

    // Listen for eco-celebration events across the platform to surge sap & bloom!
    const handleEcoCelebrationEvent = (e) => {
      celebrationSurge = 1.0;
      // Spawn burst of celebration drifters from the tree
      for (let k = 0; k < 12; k++) {
        spawnTreeDrifter();
      }
      // Trigger a ripple at tree base
      ripples.push({
        x: Math.max(80, width * 0.14),
        y: height - 10,
        r: 10,
        maxR: 260,
        alpha: 0.8,
        hue: 155
      });
    };

    window.addEventListener('eco-celebration', handleEcoCelebrationEvent);

    // Particle nodes
    class EcoNode {
      constructor(w, h) {
        this.reset(w, h);
        this.x = rand(0, w);
        this.y = rand(0, h);
      }

      reset(w, h) {
        this.x = rand(0, w);
        this.y = rand(0, h);
        this.baseRadius = rand(1.2, 2.8);
        this.radius = this.baseRadius;
        this.vx = rand(-0.35, 0.35);
        this.vy = rand(-0.4, 0.2);
        this.alpha = rand(0.3, 0.85);
        this.hue = rand(145, 175); // Emerald green to cyan teal
        this.pulseSpeed = rand(0.015, 0.04);
        this.pulseOffset = rand(0, Math.PI * 2);
      }

      update(w, h, time) {
        // Natural organic sine drift
        this.x += this.vx + Math.sin(time * 0.001 + this.pulseOffset) * 0.15;
        this.y += this.vy + Math.cos(time * 0.001 + this.pulseOffset) * 0.12;

        // Mouse gentle interaction
        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist < mouse.radius && dist > 1) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Gentle organic push/orbit
            this.x -= (dx / dist) * force * 1.8;
            this.y -= (dy / dist) * force * 1.8;
          }
        }

        // Screen boundary wrap
        if (this.x < -20) this.x = w + 20;
        if (this.x > w + 20) this.x = -20;
        if (this.y < -20) this.y = h + 20;
        if (this.y > h + 20) this.y = -20;

        // Breathing pulsation
        this.radius = this.baseRadius + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.6;
      }

      draw(c) {
        // Soft glowing halo
        c.beginPath();
        c.arc(this.x, this.y, this.radius * 2.8, 0, Math.PI * 2);
        c.fillStyle = `hsla(${this.hue}, 80%, 55%, ${this.alpha * 0.12})`;
        c.fill();

        // Core spore dot
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = `hsla(${this.hue}, 85%, 65%, ${this.alpha})`;
        c.fill();
      }
    }

    const NODE_COUNT = Math.min(80, Math.floor((width * height) / 16000));
    const nodes = Array.from({ length: NODE_COUNT }, () => new EcoNode(width, height));

    // Handle mouse move
    const handlePointerMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handlePointerLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    // Handle click ripple
    const handleClick = (e) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        r: 5,
        maxR: 160,
        alpha: 0.5,
        hue: rand(145, 170)
      });
    };

    // Handle resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const count = Math.min(80, Math.floor((width * height) / 16000));
      nodes.length = 0;
      for (let i = 0; i < count; i++) {
        nodes.push(new EcoNode(width, height));
      }
      // Rebuild tree on resize
      tree = buildTree(
        Math.max(80, width * 0.14),
        height + 10,
        Math.min(180, height * 0.25),
        -Math.PI / 2 + 0.08,
        5
      );
      treeBirthTime = performance.now();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('click', handleClick);
    window.addEventListener('resize', handleResize);

    // Periodically spawn energy pulses along lines
    let lastPulseTime = 0;
    let lastDrifterTime = 0;

    let startTime = performance.now();

    function render(currentTime) {
      const elapsed = currentTime - startTime;

      ctx.clearRect(0, 0, width, height);

      // Decay celebration surge
      if (celebrationSurge > 0.01) {
        celebrationSurge *= 0.985;
      } else {
        celebrationSurge = 0;
      }

      // Periodically spawn floating tree canopy drifters
      if (currentTime - lastDrifterTime > 800) {
        lastDrifterTime = currentTime;
        spawnTreeDrifter();
      }

      // 1. Draw subtle ambient breathing auroras in the corners
      const auraPulse = Math.sin(elapsed * 0.0006) * 0.05 + 0.08 + (celebrationSurge * 0.08);
      
      // Top-right emerald ambient glow
      const grad1 = ctx.createRadialGradient(width * 0.85, height * 0.15, 10, width * 0.85, height * 0.15, width * 0.45);
      grad1.addColorStop(0, `rgba(16, 185, 129, ${auraPulse * 0.8})`);
      grad1.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Bottom-left cyan ambient glow
      const grad2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 10, width * 0.15, height * 0.85, width * 0.45);
      grad2.addColorStop(0, `rgba(6, 182, 212, ${auraPulse * 0.6})`);
      grad2.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Top-left subtle purple glow
      const grad3 = ctx.createRadialGradient(width * 0.1, height * 0.1, 10, width * 0.1, height * 0.1, width * 0.35);
      grad3.addColorStop(0, `rgba(147, 51, 234, ${auraPulse * 0.4})`);
      grad3.addColorStop(1, 'rgba(147, 51, 234, 0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      // Mouse soft luminescent halo
      if (mouse.active) {
        const mouseGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
        mouseGrad.addColorStop(0, 'rgba(52, 211, 153, 0.08)');
        mouseGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');
        ctx.fillStyle = mouseGrad;
        ctx.fillRect(mouse.x - 180, mouse.y - 180, 360, 360);
      }

      // ─── 1.5 PROCEDURAL LIVING BOTANICAL TREE OF LIFE ───────────────────────
      // Calculate growth progress (emerges and unfolds over 4.2 seconds)
      const treeAge = currentTime - treeBirthTime;
      const rawGrowth = Math.min(1, Math.max(0, treeAge / 4200));
      // Ease-out cubic for smooth natural expansion
      const treeGrowth = 1 - Math.pow(1 - rawGrowth, 3);

      // Wind sway dynamics
      const globalWind = Math.sin(elapsed * 0.0012) * 4;

      // Draw Tree Branches
      ctx.save();
      for (let i = 0; i < tree.branches.length; i++) {
        const b = tree.branches[i];
        if (treeGrowth < b.startThreshold) continue;

        // Growth factor for this individual branch [0 .. 1]
        const branchProgress = Math.min(1, (treeGrowth - b.startThreshold) / (b.endThreshold - b.startThreshold));
        
        // Dynamic wind sway applied to branch endpoints based on depth
        const depthSway = Math.sin(elapsed * 0.0015 + b.depth * 0.6) * (b.depth * 1.5) + globalWind * (b.depth / 6);
        const curEndX = b.x + (b.endX + depthSway - b.x) * branchProgress;
        const curEndY = b.y + (b.endY - b.y) * branchProgress;

        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(curEndX, curEndY);

        // Sap energy surge lighting
        const branchGlow = celebrationSurge * 0.5;
        const alpha = Math.min(0.85, 0.25 + (b.depth / 7) * 0.35 + branchGlow);
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
        ctx.lineWidth = Math.max(1, b.thickness * (1 - (b.depth / 8)));
        ctx.lineCap = 'round';
        ctx.stroke();

        // Sap pulse moving through the tree during celebration
        if (celebrationSurge > 0.1 && Math.random() < 0.08) {
          ctx.beginPath();
          ctx.arc(curEndX, curEndY, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#fef08a';
          ctx.fill();
        }
      }

      // Draw Tree Foliage & Radiant Blossoms
      for (let i = 0; i < tree.leaves.length; i++) {
        const leaf = tree.leaves[i];
        if (treeGrowth < leaf.bloomThreshold) continue;

        const leafBloom = Math.min(1, (treeGrowth - leaf.bloomThreshold) * 12);
        const sway = Math.sin(elapsed * leaf.swaySpeed + leaf.swayOffset) * 3 + globalWind;
        const lx = leaf.x + sway;
        const ly = leaf.y;
        const rad = leaf.baseRadius * leafBloom * (1 + celebrationSurge * 0.4);

        // Ambient glow halo
        ctx.beginPath();
        ctx.arc(lx, ly, rad * 2.2, 0, Math.PI * 2);
        if (leaf.isBlossom) {
          ctx.fillStyle = `hsla(${leaf.blossomHue}, 90%, 65%, ${0.25 * leafBloom})`;
        } else {
          ctx.fillStyle = `hsla(${leaf.hue}, 85%, 55%, ${0.2 * leafBloom})`;
        }
        ctx.fill();

        // Core leaf or flower bud
        ctx.beginPath();
        ctx.arc(lx, ly, rad, 0, Math.PI * 2);
        if (leaf.isBlossom) {
          ctx.fillStyle = `hsla(${leaf.blossomHue}, 95%, 72%, ${0.85 * leafBloom})`;
        } else {
          ctx.fillStyle = `hsla(${leaf.hue}, 90%, 65%, ${0.8 * leafBloom})`;
        }
        ctx.fill();
      }

      // Draw Drifting Canopy Spores
      for (let i = treeDrifters.length - 1; i >= 0; i--) {
        const d = treeDrifters[i];
        d.life++;
        d.x += d.vx + Math.sin(elapsed * 0.002 + d.life) * 0.3;
        d.y += d.vy;
        const progress = d.life / d.maxLife;

        if (progress >= 1 || d.y < -20 || d.x > width + 20) {
          treeDrifters.splice(i, 1);
          continue;
        }

        const driftAlpha = (1 - progress) * d.alpha;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${d.hue}, 85%, 65%, ${driftAlpha})`;
        ctx.fill();
      }
      ctx.restore();

      // 2. Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].update(width, height, elapsed);
        nodes[i].draw(ctx);
      }

      // 3. Draw proximity botanical synapses & collect candidate paths
      const maxConnectDist = 115;
      const candidateLinks = [];

      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < maxConnectDist) {
            const opacity = (1 - dist / maxConnectDist) * 0.22;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${opacity})`;
            ctx.lineWidth = (1 - dist / maxConnectDist) * 1.2;
            ctx.stroke();

            if (dist < 80) {
              candidateLinks.push({ from: n1, to: n2 });
            }
          }
        }
      }

      // 4. Periodically spawn energy telemetry packets
      if (currentTime - lastPulseTime > 1200 && candidateLinks.length > 0) {
        lastPulseTime = currentTime;
        const link = candidateLinks[Math.floor(Math.random() * candidateLinks.length)];
        energyPulses.push({
          from: link.from,
          to: link.to,
          progress: 0,
          speed: rand(0.015, 0.035),
          hue: rand(140, 180)
        });
      }

      // Update & draw energy pulses
      for (let i = energyPulses.length - 1; i >= 0; i--) {
        const p = energyPulses[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          energyPulses.splice(i, 1);
          continue;
        }

        const px = p.from.x + (p.to.x - p.from.x) * p.progress;
        const py = p.from.y + (p.to.y - p.from.y) * p.progress;

        const pulseGlow = ctx.createRadialGradient(px, py, 0, px, py, 8);
        pulseGlow.addColorStop(0, `hsla(${p.hue}, 90%, 65%, 0.8)`);
        pulseGlow.addColorStop(1, `hsla(${p.hue}, 90%, 65%, 0)`);
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = pulseGlow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      // 5. Update & draw click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += 2.5;
        r.alpha *= 0.96;

        if (r.r >= r.maxR || r.alpha <= 0.01) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${r.hue}, 85%, 60%, ${r.alpha})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('eco-celebration', handleEcoCelebrationEvent);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      {/* Background ambient video: Sprouting tree in campus */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.32,
          filter: 'brightness(0.60) contrast(1.15) saturate(1.1)',
        }}
      >
        <source src="/background-tree.mp4" type="video/mp4" />
      </video>

      {/* Bioluminescent canvas layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 0,
          opacity: 0.65,
        }}
      />
    </>
  );
}
