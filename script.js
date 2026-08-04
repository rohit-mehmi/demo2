/* ============================================================
   EMBER — plain JS rebuild
   Sections: cursor, section-scroller, scene-layer + 3D objects,
   equalizer bars, marquee content.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- helpers ---------------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ramp = (v, a, b) => clamp((v - a) / (b - a));
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const el = (tag, cls, style) => {
    const n = document.createElement("div");
    if (tag) n.dataset.tag = tag;
    if (cls) n.className = cls;
    if (style) Object.assign(n.style, style);
    return n;
  };

  /* ================= CURSOR ================= */
  (function cursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const core = document.getElementById("cursorCore");
    const halo = document.getElementById("cursorHalo");
    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const h = { ...target };
    let hot = false;

    window.addEventListener(
      "pointermove",
      (e) => {
        target.x = e.clientX;
        target.y = e.clientY;
        const node = document.elementFromPoint(e.clientX, e.clientY);
        hot = !!(node && node.closest("[data-magnetic]"));
      },
      { passive: true }
    );

    function tick() {
      h.x += (target.x - h.x) * 0.14;
      h.y += (target.y - h.y) * 0.14;
      if (core) core.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
      if (halo) {
        halo.style.transform = `translate3d(${h.x}px, ${h.y}px, 0) translate(-50%, -50%) scale(${hot ? 2.4 : 1})`;
        halo.style.opacity = hot ? "1" : "0.55";
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  /* ================= EQUALIZER BARS ================= */
  (function equalizer() {
    const wrap = document.getElementById("equalizer");
    if (!wrap) return;
    for (let i = 0; i < 22; i++) {
      const bar = document.createElement("span");
      bar.style.height = `${28 + ((i * 37) % 40)}px`;
      bar.style.animation = `bar-breathe ${1.4 + (i % 5) * 0.35}s ease-in-out ${i * 0.06}s infinite`;
      wrap.appendChild(bar);
    }
  })();

  /* ================= MARQUEE CONTENT ================= */
  (function marquee() {
    const track = document.getElementById("marqueeTrack");
    if (!track) return;
    const words = ["SEO audit", "Backlinks", "Web design", "Social media", "Analytics", "Growth"];
    for (let r = 0; r < 2; r++) {
      const group = document.createElement("span");
      group.className = "group";
      words.forEach((w) => {
        const item = document.createElement("span");
        item.className = "marquee-item";
        item.textContent = w;
        const dot = document.createElement("span");
        dot.className = "marquee-dot";
        item.appendChild(dot);
        group.appendChild(item);
      });
      track.appendChild(group);
    }
  })();

  /* ================= SECTION SCROLLER ================= */
  (function sectionScroller() {
    const sections = () => Array.from(document.querySelectorAll("main section"));
    let animating = false;
    let raf = 0;
    let index = Math.round(scrollY / (innerHeight || 1));
    const DURATION = 1100;
    const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

    function go(dir) {
      const list = sections();
      if (!list.length) return;
      const target = Math.min(list.length - 1, Math.max(0, index + dir));
      const top = list[target] ? list[target].offsetTop : target * innerHeight;
      if (Math.abs(top - scrollY) < 4) {
        index = target;
        return;
      }
      index = target;
      animating = true;
      cancelAnimationFrame(raf);
      const from = scrollY;
      const dist = top - from;
      const start = performance.now();
      function step(now) {
        const p = Math.min(1, (now - start) / DURATION);
        scrollTo(0, from + dist * ease(p));
        if (p < 1) raf = requestAnimationFrame(step);
        else animating = false;
      }
      raf = requestAnimationFrame(step);
    }

    window.addEventListener(
      "wheel",
      (e) => {
        if (Math.abs(e.deltaY) < 4) return;
        e.preventDefault();
        if (animating) return;
        go(e.deltaY > 0 ? 1 : -1);
      },
      { passive: false }
    );

    window.addEventListener("keydown", (e) => {
      const next = ["ArrowDown", "PageDown", " "].includes(e.key);
      const prev = ["ArrowUp", "PageUp"].includes(e.key);
      if (!next && !prev) return;
      e.preventDefault();
      if (animating) return;
      go(next ? 1 : -1);
    });

    let startY = 0;
    window.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; }, { passive: true });
    window.addEventListener("touchmove", (e) => { e.preventDefault(); }, { passive: false });
    window.addEventListener("touchend", (e) => {
      const dy = startY - (e.changedTouches[0] ? e.changedTouches[0].clientY : startY);
      if (Math.abs(dy) < 40 || animating) return;
      go(dy > 0 ? 1 : -1);
    });
  })();

  /* ================= 3D OBJECTS ================= */
  /* Each factory builds fixed DOM once and returns update(spin). */

  function ringEl(w, h, extraStyle) {
    const r = el(null, "ring", { width: w + "px", height: h + "px" });
    if (extraStyle) Object.assign(r.style, extraStyle);
    return r;
  }

  // 03 — Backlinks: link web
  function makeLinkWeb() {
    const root = el(null, "preserve3d", { position: "relative", width: "230px", height: "230px", display: "grid", placeItems: "center" });
    const nodes = Array.from({ length: 9 }).map((_, i) => ({
      ry: (360 / 9) * i,
      rx: -46 + ((i * 37) % 92),
      d: 92 + ((i * 23) % 34),
    }));
    const nodeWrappers = nodes.map((n) => {
      const wrap = el(null, "preserve3d", { position: "absolute", display: "grid", placeItems: "center" });
      const bar = el(null, null, {
        position: "absolute", left: "50%", top: "50%", borderRadius: "999px",
        background: "linear-gradient(90deg, var(--ember-deep), var(--ember-glow))",
        transformOrigin: "0% 50%", width: n.d + "px", height: "2px", opacity: "0.5", transform: "translateY(-1px)",
      });
      const node = el(null, null, {
        position: "absolute", display: "grid", placeItems: "center", borderRadius: "50%",
        border: "2px solid var(--ember)", width: "26px", height: "26px",
        background: "color-mix(in oklab, var(--ember) 12%, transparent)", fontSize: "9px", color: "var(--ember-deep)",
      });
      node.textContent = "↗";
      wrap.appendChild(bar);
      wrap.appendChild(node);
      wrap.style.transform = `rotateY(${n.ry}deg) rotateX(${n.rx}deg)`;
      root.appendChild(wrap);
      return { wrap, node, n };
    });
    const core = el(null, null, {
      position: "absolute", display: "grid", placeItems: "center", borderRadius: "50%",
      width: "54px", height: "54px", background: "linear-gradient(135deg, var(--ember-glow), var(--ember-deep))",
      boxShadow: "0 0 46px 8px color-mix(in oklab, var(--ember) 45%, transparent)",
      color: "#fff", fontSize: "10px", letterSpacing: "0.2em",
    });
    core.textContent = "DA";
    root.appendChild(core);

    return {
      root,
      update(spin) {
        root.style.transform = `rotateX(-14deg) rotateY(${spin * 0.8}deg)`;
        nodeWrappers.forEach(({ node, n }) => {
          node.style.transform = `translateX(${n.d}px) translateX(13px) rotateX(${-n.rx}deg) rotateY(${-n.ry - spin * 0.8}deg)`;
        });
      },
    };
  }

  // 04 — Web design: panel stack
  function makePanelStack() {
    const root = el(null, "preserve3d", { position: "relative", width: "250px", height: "180px", display: "grid", placeItems: "center" });
    const layers = [0, 1, 2, 3].map((l) => {
      const layer = el(null, null, {
        position: "absolute", borderRadius: "1rem",
        width: 240 - l * 26 + "px", height: 168 - l * 18 + "px",
        border: "1.5px solid color-mix(in oklab, var(--ember) 80%, transparent)",
        background: "linear-gradient(135deg, color-mix(in oklab, var(--ember) 12%, transparent), transparent)",
        boxShadow: "0 0 30px -12px color-mix(in oklab, var(--ember) 60%, transparent)",
      });
      if (l === 0) {
        layer.innerHTML =
          '<div style="display:flex;flex-direction:column;gap:8px;padding:16px;height:100%">' +
          '<div style="height:12px;width:64px;border-radius:999px;background:color-mix(in oklab, var(--ember) 70%, transparent)"></div>' +
          '<div style="height:8px;width:128px;border-radius:999px;background:color-mix(in oklab, var(--ember) 40%, transparent)"></div>' +
          '<div style="margin-top:auto;display:flex;gap:8px">' +
          '<div style="height:32px;flex:1;border-radius:8px;border:1px solid color-mix(in oklab, var(--ember) 50%, transparent)"></div>' +
          '<div style="height:32px;flex:1;border-radius:8px;border:1px solid color-mix(in oklab, var(--ember) 50%, transparent)"></div>' +
          '<div style="height:32px;flex:1;border-radius:8px;border:1px solid color-mix(in oklab, var(--ember) 50%, transparent)"></div>' +
          "</div></div>";
      }
      if (l === 3) {
        layer.innerHTML = '<div style="display:grid;height:100%;place-items:center;font-size:9px;letter-spacing:0.32em;color:var(--ember-deep)">UI</div>';
      }
      root.appendChild(layer);
      return { layer, l };
    });
    return {
      root,
      update(spin) {
        root.style.transform = `rotateX(52deg) rotateZ(${-28 + Math.sin(spin / 60) * 8}deg)`;
        layers.forEach(({ layer, l }) => {
          layer.style.transform = `translateZ(${l * 44 + Math.sin(spin / 40 + l) * 8}px)`;
        });
      },
    };
  }

  // 05 — SMO: social orbit
  function makeSocialOrbit() {
    const root = el(null, "preserve3d", { position: "relative", width: "240px", height: "240px", display: "grid", placeItems: "center" });
    root.appendChild(ringEl(240, 240, { transform: "rotateX(74deg)" }));
    root.appendChild(ringEl(170, 170, { opacity: "0.6", transform: "rotateX(74deg) rotateY(46deg)" }));
    const icons = ["♥", "✦", "▶", "✉", "@", "↻"];
    const iconEls = icons.map((ic, i) => {
      const wrap = el(null, "preserve3d", { position: "absolute" });
      const box = el(null, null, {
        display: "grid", placeItems: "center", borderRadius: "1rem", width: "44px", height: "44px",
        border: "1.5px solid color-mix(in oklab, var(--ember) 75%, transparent)",
        background: "linear-gradient(135deg, color-mix(in oklab, var(--ember) 16%, transparent), transparent)",
        fontSize: "16px", color: "var(--ember-deep)",
      });
      box.textContent = ic;
      wrap.appendChild(box);
      root.appendChild(wrap);
      return { wrap, box, i };
    });
    const core = el(null, null, {
      position: "absolute", height: "28px", width: "28px", borderRadius: "50%", background: "var(--ember)",
      boxShadow: "0 0 48px 10px color-mix(in oklab, var(--ember) 55%, transparent)",
      animation: "pulse-ring 2.6s ease-in-out infinite",
    });
    root.appendChild(core);
    return {
      root,
      update(spin) {
        root.style.transform = `rotateX(-18deg) rotateY(${spin * 0.6}deg)`;
        iconEls.forEach(({ wrap, box, i }) => {
          const a = (360 / icons.length) * i + spin * 0.9;
          const r = i % 2 ? 85 : 118;
          wrap.style.transform = `rotateY(${a}deg) translateZ(${r}px)`;
          box.style.transform = `rotateY(${-a - spin * 0.6}deg) translateY(${Math.sin(spin / 30 + i) * 10}px)`;
        });
      },
    };
  }

  // 06 — Analytics: data bars
  function makeDataBars() {
    const root = el(null, "preserve3d", { position: "relative", width: "240px", height: "200px", display: "grid", placeItems: "center" });
    const grid = el(null, null, {
      position: "absolute", borderRadius: "0.75rem", width: "230px", height: "230px",
      border: "1.5px solid color-mix(in oklab, var(--ember) 45%, transparent)",
      backgroundImage:
        "linear-gradient(color-mix(in oklab, var(--ember) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--ember) 22%, transparent) 1px, transparent 1px)",
      backgroundSize: "26px 26px",
    });
    root.appendChild(grid);
    const bars = Array.from({ length: 9 }).map((_, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const wrap = el(null, "preserve3d", { position: "absolute", transform: `translate3d(${(col - 1) * 62}px, ${(row - 1) * 62}px, 0)` });
      const top = el(null, null, { borderRadius: "6px", width: "26px", height: "26px", background: "linear-gradient(135deg, var(--ember-glow), var(--ember-deep))" });
      const side = el(null, null, {
        position: "absolute", left: "0", top: "0", borderRadius: "2px", width: "26px",
        transformOrigin: "50% 0%", transform: "rotateX(90deg)",
        background: "linear-gradient(180deg, color-mix(in oklab, var(--ember) 70%, transparent), color-mix(in oklab, var(--ember) 12%, transparent))",
      });
      wrap.appendChild(top);
      wrap.appendChild(side);
      root.appendChild(wrap);
      return { top, side, i };
    });
    return {
      root,
      update(spin) {
        root.style.transform = `rotateX(58deg) rotateZ(${spin * 0.5}deg)`;
        bars.forEach(({ top, side, i }) => {
          const h = 34 + Math.abs(Math.sin(spin / 55 + i * 0.8)) * 76;
          top.style.transform = `translateZ(${h / 2}px)`;
          top.style.boxShadow = `0 0 ${h / 3}px color-mix(in oklab, var(--ember) 55%, transparent)`;
          side.style.height = h + "px";
        });
      },
    };
  }

  // 07 — Growth: ascending helix
  function makeGrowthArrow() {
    const root = el(null, "preserve3d", { position: "relative", width: "220px", height: "240px", display: "grid", placeItems: "center" });
    const steps = Array.from({ length: 10 }).map((_, i) => {
      const wrap = el(null, "preserve3d", { position: "absolute", transform: `rotateY(${i * 34}deg) translateY(${90 - i * 20}px)` });
      const bar = el(null, null, {
        borderRadius: "8px", width: 74 - i * 3 + "px", height: "10px", transform: "translateZ(56px)",
        background: "linear-gradient(90deg, var(--ember-deep), var(--ember-glow))",
        opacity: String(0.4 + i * 0.06),
        boxShadow: "0 0 22px -6px color-mix(in oklab, var(--ember) 70%, transparent)",
      });
      wrap.appendChild(bar);
      root.appendChild(wrap);
      return wrap;
    });
    const arrow = el(null, null, {
      position: "absolute", width: "0", height: "0",
      borderLeft: "16px solid transparent", borderRight: "16px solid transparent",
      borderBottom: "30px solid var(--ember)",
      filter: "drop-shadow(0 0 18px color-mix(in oklab, var(--ember) 65%, transparent))",
    });
    root.appendChild(arrow);
    const ring = ringEl(160, 160, { opacity: "0.5", transform: "rotateX(76deg) translateZ(-110px)" });
    root.appendChild(ring);
    return {
      root,
      update(spin) {
        root.style.transform = `rotateX(-12deg) rotateY(${spin * 0.7}deg)`;
        arrow.style.transform = `translateY(-118px) translateZ(20px) rotateY(${-spin * 0.7}deg)`;
      },
    };
  }

  // 01/02 — mascot videos (background removed via mix-blend-mode: multiply)
  function makeMascotVideo(webmSrc, mp4Src, height) {
    const root = el(null, "preserve3d", { position: "relative", width: "320px", height: "320px", display: "grid", placeItems: "center" });
    const r1 = ringEl(320, 320, { transform: "rotateX(72deg)" });
    const r2 = ringEl(268, 268, { opacity: "0.6", transform: "rotateX(72deg)" });
    root.appendChild(r1);
    root.appendChild(r2);
    const video = document.createElement("video");
    video.autoplay = true; video.loop = true; video.muted = true; video.playsInline = true; video.preload = "auto";
    Object.assign(video.style, { position: "relative", width: "280px", height: height + "px", objectFit: "contain", mixBlendMode: "multiply" });
    if (webmSrc) { const s = document.createElement("source"); s.src = webmSrc; s.type = "video/webm"; video.appendChild(s); }
    if (mp4Src) { const s = document.createElement("source"); s.src = mp4Src; s.type = "video/mp4"; video.appendChild(s); }
    root.appendChild(video);
    return {
      root,
      update(spin) {
        root.style.transform = `rotateY(${Math.sin((spin * Math.PI) / 180) * 9}deg)`;
        r1.style.transform = `rotateX(72deg) rotateZ(${spin}deg)`;
        r2.style.transform = `rotateX(72deg) rotateZ(${-spin * 0.7}deg)`;
      },
    };
  }

  /* ================= SCENE LAYER (scroll-driven stage) ================= */
  (function sceneLayer() {
    const stage = document.getElementById("stage3d");
    if (!stage) return;

    // point to /assets/<file> — drop your exported video files there
    const heroVideo = makeMascotVideo("assets/hero-mascot.webm", "assets/hero-mascot.mp4", 312);
    const seoVideo = makeMascotVideo("assets/seo-mascot.webm", "assets/seo-mascot.mp4", 360);

    const SCENES = [
      { obj: heroVideo, x: 72, y: 54, s: 1, from: "up" },
      { obj: seoVideo, x: 26, y: 50, s: 0.9, from: "left" },
      { obj: makeLinkWeb(), x: 74, y: 50, s: 0.92, from: "right" },
      { obj: makePanelStack(), x: 26, y: 50, s: 0.9, from: "left" },
      { obj: makeSocialOrbit(), x: 74, y: 50, s: 0.94, from: "right" },
      { obj: makeDataBars(), x: 26, y: 50, s: 0.9, from: "left" },
      { obj: makeGrowthArrow(), x: 74, y: 50, s: 0.92, from: "right" },
      { obj: null, x: 50, y: 24, s: 0.82, from: "down" },
    ];

    const OFFSETS = { up: [0, 48], down: [0, -48], left: [-64, 0], right: [64, 0] };

    const wrappers = SCENES.map((scene) => {
      if (!scene.obj) return null;
      const wrap = el(null, "scene-item", { left: scene.x + "%", top: scene.y + "%", willChange: "transform, opacity" });
      const glow = el(null, "scene-glow");
      const floater = el(null, "scene-float");
      floater.appendChild(scene.obj.root);
      wrap.appendChild(glow);
      wrap.appendChild(floater);
      stage.appendChild(wrap);
      return wrap;
    });

    let smooth = scrollY / (innerHeight || 1);
    let last = 0;

    function loop() {
      const vh = innerHeight || 1;
      const target = scrollY / vh;
      smooth += (target - smooth) * 0.18;
      const t = smooth;
      const spin = t * 165;

      SCENES.forEach((scene, i) => {
        if (!scene.obj) return;
        const wrap = wrappers[i];
        const enter = easeOut(ramp(t, i - 0.42, i - 0.24));
        const exit = easeOut(ramp(t, i + 0.24, i + 0.42));
        const vis = enter * (1 - exit);
        if (vis < 0.01) {
          wrap.style.opacity = "0";
          return;
        }
        const [ox, oy] = OFFSETS[scene.from];
        const away = 1 - enter + exit;
        wrap.style.opacity = String(vis);
        wrap.style.transform = `translate3d(calc(-50% + ${ox * away}px), calc(-50% + ${oy * away}px), 0) scale(${scene.s * (0.96 + vis * 0.04)})`;
        scene.obj.update(spin);
      });

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();
})();
