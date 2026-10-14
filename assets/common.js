// Shared helpers: nav, formatting, sector metadata, tiny SVG charts with hover tooltips.
(function () {
  // Seven land-use sectors; order is the display order everywhere. "family" groups them for compact summaries.
  const SECTORS = {
    "Palm Oil": { key: "palm", code: "P", label: "Palm oil", family: "Plantations" },
    "Pulp & Paper": { key: "pulp", code: "W", label: "Pulp & paper", family: "Plantations" },
    "Agriculture & Plantations": { key: "agri", code: "A", label: "Agriculture", family: "Plantations" },
    "Logging": { key: "log", code: "L", label: "Logging", family: "Logging" },
    "Coal Mining": { key: "coal", code: "C", label: "Coal", family: "Mining & quarrying" },
    "Metal Mining": { key: "metal", code: "M", label: "Metal mining", family: "Mining & quarrying" },
    "Quarrying": { key: "quarry", code: "Q", label: "Quarrying", family: "Mining & quarrying" },
  };
  const SECTOR_LIST = Object.keys(SECTORS);
  const CODE2SECTOR = Object.fromEntries(SECTOR_LIST.map((s) => [SECTORS[s].code, s]));
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const sectorColor = (s) => css("--" + SECTORS[s].key);

  const fmt = {
    n: (v) => (v == null || v === "" || isNaN(v) ? "–" : Math.round(v).toLocaleString("en-US")),
    usd: (v) => (v == null ? "–" : "$" + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(2) + "bn" : Math.round(v).toLocaleString("en-US") + "m")),
    ha: (v) => (v == null || v === 0 ? "–" : v >= 1e6 ? (v / 1e6).toFixed(2) + "M ha" : v >= 1e4 ? Math.round(v / 1000).toLocaleString("en-US") + "k ha" : Math.round(v).toLocaleString("en-US") + " ha"),
    short: (v) => (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? Math.round(v / 1e3) + "k" : String(Math.round(v))),
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Embedded mode: the page runs inside the single-file shell (an iframe whose parent defines LW_SHELL).
  const SHELL = (() => { try { return window.parent !== window && window.parent.LW_SHELL; } catch (e) { return null; } })();
  const go = (url) => (SHELL ? SHELL.route(url) : (location.href = url));
  const params = () => new URLSearchParams(SHELL ? SHELL.query(document.documentElement.dataset.page) : location.search);
  const setQuery = (q) => (SHELL ? SHELL.setQuery(document.documentElement.dataset.page, q) : history.replaceState(null, "", q));
  if (SHELL) document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest("a[href]");
    if (a && /^(index|companies|groups|map|forest|fires)\.html/.test(a.getAttribute("href"))) { e.preventDefault(); go(a.getAttribute("href")); }
  });

  function nav(active) {
    document.documentElement.dataset.page = active.replace(".html", "");
    if (SHELL) return;
    const pages = [["index.html", "Overview"], ["companies.html", "Companies"], ["groups.html", "Conglomerates"], ["map.html", "Map"], ["forest.html", "Forest change"], ["fires.html", "Fires & haze"]];
    const s = window.SNAPSHOT || {};
    const el = document.createElement("header");
    el.className = "nav";
    el.innerHTML = `<div class="brand"><span class="brand-mark" aria-hidden="true"></span>Indonesia Land Watch</div>
      <nav>${pages.map(([h, t]) => `<a href="${h}"${h === active ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
      <span class="stamp">Fires ${s.fire_start || ""} → ${s.fire_end || ""} · built ${s.built || ""}</span>`;
    document.body.prepend(el);
  }

  // tooltip
  let tipEl;
  function tip(html, ev) {
    if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "tip"; document.body.appendChild(tipEl); }
    if (!html) { tipEl.style.display = "none"; return; }
    tipEl.innerHTML = html; tipEl.style.display = "block";
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
    if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
    tipEl.style.left = x + "px"; tipEl.style.top = y + "px";
  }
  function bindTips(root) {
    root.querySelectorAll("[data-tip]").forEach((n) => {
      n.addEventListener("mousemove", (e) => tip(n.getAttribute("data-tip"), e));
      n.addEventListener("mouseleave", () => tip(null));
    });
  }

  const NS = "http://www.w3.org/2000/svg";
  // Horizontal bars. items: [{label, value, color, tip, href, sub}]
  function hbar(el, items, { valueFmt = fmt.n, labelW = 190, rowH = 26, max } = {}) {
    const W = Math.max(el.clientWidth, 320);
    const lw = Math.min(labelW, W * 0.42), vw = 70, bw = W - lw - vw - 8;
    const mx = max || Math.max(...items.map((d) => d.value), 1);
    const H = items.length * rowH + 4;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
    items.forEach((d, i) => {
      const y = i * rowH + 3, w = Math.max(2, (d.value / mx) * bw);
      const lab = d.label.length > 30 ? d.label.slice(0, 29) + "…" : d.label;
      s += `<g data-tip="${esc(d.tip || `<b>${esc(d.label)}</b><br>${valueFmt(d.value)}`)}" ${d.href ? `style="cursor:pointer" data-href="${esc(d.href)}"` : ""}>
        <rect x="0" y="${y - 2}" width="${W}" height="${rowH}" fill="transparent"/>
        <text x="${lw - 8}" y="${y + rowH / 2}" text-anchor="end" dominant-baseline="middle">${esc(lab)}</text>
        <rect x="${lw}" y="${y + 4}" width="${w}" height="${rowH - 12}" rx="3" fill="${d.color}"/>
        <text class="val" x="${lw + w + 6}" y="${y + rowH / 2}" dominant-baseline="middle">${valueFmt(d.value)}</text></g>`;
    });
    el.innerHTML = s + "</svg>";
    bindTips(el);
    el.querySelectorAll("[data-href]").forEach((n) => n.addEventListener("click", () => LW.go(n.getAttribute("data-href"))));
  }

  // Stacked columns. cats: x labels; series: [{name, color, values[]}]
  function stacked(el, cats, series, { h = 240, valueFmt = fmt.n } = {}) {
    const W = Math.max(el.clientWidth, 320), pl = 46, pr = 8, pt = 10, pb = 26;
    const totals = cats.map((_, i) => series.reduce((a, s) => a + s.values[i], 0));
    const mx = niceMax(Math.max(...totals, 1));
    const cw = (W - pl - pr) / cats.length, bw = Math.min(46, cw * 0.62);
    const y = (v) => pt + (h - pt - pb) * (1 - v / mx);
    let s = `<svg viewBox="0 0 ${W} ${h}" role="img"><g class="grid axis">`;
    for (let k = 0; k <= 4; k++) {
      const v = (mx * k) / 4;
      s += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 6}" y="${y(v)}" text-anchor="end" dominant-baseline="middle">${fmt.short(v)}</text>`;
    }
    s += `</g>`;
    cats.forEach((c, i) => {
      const x = pl + i * cw + (cw - bw) / 2;
      let acc = 0;
      const tipHtml = `<b>${esc(c)}</b><br>` + series.map((sr) => `${esc(sr.name)}: ${valueFmt(sr.values[i])}`).join("<br>") + `<br>Total: ${valueFmt(totals[i])}`;
      s += `<g data-tip="${esc(tipHtml)}"><rect x="${pl + i * cw}" y="${pt}" width="${cw}" height="${h - pt - pb}" fill="transparent"/>`;
      series.forEach((sr, si) => {
        const v = sr.values[i]; if (!v) return;
        const y0 = y(acc), y1 = y(acc + v); acc += v;
        const top = si === series.length - 1 || series.slice(si + 1).every((q) => !q.values[i]);
        s += `<rect x="${x}" y="${y1 + (top ? 0 : 1)}" width="${bw}" height="${Math.max(0, y0 - y1 - 1)}" fill="${sr.color}" ${top ? 'rx="3"' : ""}/>`;
      });
      s += `<text class="axis" x="${x + bw / 2}" y="${h - 8}" text-anchor="middle" style="fill:var(--muted);font-size:11px">${esc(c)}</text></g>`;
    });
    el.innerHTML = s + "</svg>";
    bindTips(el);
  }
  function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); const m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }

  // US EPA PM2.5 (2024 breakpoints) categories with the standard AQI colours
  const PM = [
    [9, "Good", "#00b050"], [35.4, "Moderate", "#e6c700"], [55.4, "Unhealthy (sensitive)", "#ff7e00"],
    [125.4, "Unhealthy", "#e8212b"], [225.4, "Very unhealthy", "#8f3f97"], [Infinity, "Hazardous", "#7e0023"],
  ];
  const pmCat = (v) => PM.find((p) => v <= p[0]);

  // Sector filter buttons ("All" + each sector present in the data); calls onChange(sectorName or "")
  function sectorSeg(el, onChange) {
    const present = new Set((window.COMPANIES || []).map((c) => c.sector));
    el.innerHTML = `<button id="${el.id}-all" data-s="" aria-pressed="true">All</button>` +
      SECTOR_LIST.filter((s) => present.has(s)).map((s) => `<button id="${el.id}-${SECTORS[s].key}" data-s="${esc(s)}" aria-pressed="false"><span class="dot ${SECTORS[s].key}"></span> ${SECTORS[s].label}</button>`).join("");
    el.querySelectorAll("button").forEach((b) => (b.onclick = () => {
      el.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b)); onChange(b.dataset.s);
    }));
  }

  // re-render charts on resize / theme change
  const renderers = [];
  function onRender(fn) { renderers.push(fn); fn(); }
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => renderers.forEach((f) => f()), 150); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => renderers.forEach((f) => f()));

  window.LW = { go, params, setQuery, sectorSeg, SECTOR_LIST, SECTORS, CODE2SECTOR, sectorColor, css, fmt, esc, nav, tip, bindTips, hbar, stacked, PM, pmCat, onRender };
})();
