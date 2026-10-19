// On X: topic switcher shared by social.html and x-*.html, plus the renderer for the short topic pages.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const short = (v) => (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e3 ? Math.round(v / 1e3) + "k" : String(v));
  const xurl = (id) => "https://x.com/i/status/" + id;
  const START = Date.UTC(2026, 8, 15); // daily series start: 15 Sep 2026
  const day = (i) => new Date(START + i * 864e5);
  const dfmt = (d) => d.getUTCDate() + " " + "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")[d.getUTCMonth()];

  // Sparklines are engagement by day, as collected; karhutla from x_stats.py, the others from x_topics_stats.py.
  const TOPICS = [
    { id: "karhutla", href: "social.html", name: "Karhutla", kicker: "Forest & land fires", c: "--fire", eng: 3874461,
      spark: [72,0,0,0,0,0,17,0,0,721,96,83,0,0,0,6,1190,0,171285,220845,98553,19268,97276,3292,462,29189,155367,199,1241,74268,2156,17632,14,28417,19671,206773,2353,47,142,8829,18699,210,87834,287,118,24061,37,158,141,53,94366,265087,83,13001,132,26,0,0,23,5909,0,0,21,0,0,25,61,0,0,172467,56422,83514,249795,216713,158968,188820,479263,342873,236060,19770] },
    { id: "mbg", href: "x-mbg.html", name: "MBG", kicker: "Free school meals", c: "--quarry", eng: 2535834,
      spark: [84543,49620,32830,126941,165679,26947,44449,237033,266417,101300,18794,116808,38405,29748,250200,5104,164029,31901,18270,5626,94202,144542,4405,170091,18665,8564,70486,47380,41972,35869,16687,15659,9853,41447,1368] },
    { id: "kopdes", href: "x-kopdes.html", name: "Kopdes / KDMP", kicker: "Village cooperatives", c: "--palm", eng: 538046,
      spark: [1208,19033,49329,409,12,612,125,680,2309,59,677,643,1948,2557,1859,138,5797,24140,4303,375,0,533,271,27269,4,12,88899,40575,48677,51107,44801,61115,29804,20352,8414] },
    { id: "bbm", href: "x-bbm.html", name: "Krisis BBM", kicker: "Fuel shortages", c: "--coal", eng: 1121938,
      spark: [48189,100540,75,119,630,19,13252,32,153430,24730,4748,0,1104,0,28970,0,47535,0,0,0,25,64,119,202,234,3460,1,9621,68743,33378,226656,128104,70916,92882,64160] },
    { id: "pasar", href: "x-pasar.html", name: "MSCI & IHSG", kicker: "Markets & rupiah", c: "--pulp", eng: 826067,
      spark: [84,794,385,2997,22,16,1598,1564,29,58,171,93896,8,232,1062,203,0,119,169,156,64864,0,0,208,11,1104,28,15784,2022,752,13804,386933,173267,27393,36334] },
  ];

  function spark(vals) {
    const W = 160, H = 26, m = Math.max(...vals) || 1, n = vals.length - 1;
    const pts = vals.map((v, i) => [(i / n) * W, H - 2 - (v / m) * (H - 4)]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join("");
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${line}L${W},${H}L0,${H}Z" fill="var(--c)" opacity=".18"/><path d="${line}" fill="none" stroke="var(--c)" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
  }

  function subnav(active) {
    const el = document.createElement("nav");
    el.className = "xsub";
    el.setAttribute("aria-label", "On X topics");
    el.innerHTML = TOPICS.map((t) => `<a href="${t.href}" style="--c:var(${t.c})"${t.id === active ? ' aria-current="page"' : ""}>
      <span class="t">${t.name}</span><span class="v">${short(t.eng)}</span><span class="k">${t.kicker}</span>${spark(t.spark)}</a>`).join("");
    const main = document.querySelector("main.social");
    main.prepend(el);
    main.dataset.topic = active;
    const cur = el.querySelector('[aria-current="page"]');
    if (cur && cur.scrollIntoView && el.scrollWidth > el.clientWidth) el.scrollLeft = cur.offsetLeft - 16;
  }

  // start: first day of the series as "YYYY-MM-DD" (default 15 Sep 2026); notes: [{i, t}] by day index.
  function area(el, series, notes, start) {
    const base = start ? Date.parse(start + "T00:00:00Z") : START, day = (i) => new Date(base + i * 864e5);
    const W = 760, H = 260, L = 50, R = 14, T = 30, B = 30, n = series.length - 1;
    const max = Math.max(...series), step = Math.pow(10, Math.floor(Math.log10(max || 1)));
    const top = Math.ceil(max / step / 2) * step * 2 || 1;
    const x = (i) => L + (i / n) * (W - L - R), y = (v) => T + (H - T - B) * (1 - v / top);
    let h = "";
    for (let k = 0; k <= 4; k++) { const v = (top / 4) * k; h += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text class="tk" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${short(v)}</text>`; }
    series.forEach((_, i) => { const d = day(i); if (d.getUTCDay() === 1) h += `<text class="tk" x="${x(i)}" y="${H - 8}" text-anchor="middle">${dfmt(d)}</text>`; });
    const line = series.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + "," + y(v).toFixed(1)).join("");
    h += `<path class="ar" d="${line}L${x(n)},${y(0)}L${x(0)},${y(0)}Z"/><path class="ln" d="${line}"/>`;
    (notes || []).forEach((nt, j) => { const cx = x(nt.i), cy = y(series[nt.i]);
      h += `<circle class="pk" cx="${cx}" cy="${cy}" r="4"/><circle cx="${cx}" cy="${Math.max(cy - 18, 12)}" r="9" fill="var(--ink)"/><text x="${cx}" y="${Math.max(cy - 18, 12) + 4}" text-anchor="middle" style="fill:var(--surface);font:600 11px var(--font-data)">${j + 1}</text>`; });
    const cw = (W - L - R) / n;
    series.forEach((v, i) => { h += `<rect class="hov" data-i="${i}" x="${x(i) - cw / 2}" y="${T}" width="${cw}" height="${H - T - B}"/>`; });
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily engagement, ${dfmt(day(0))} to ${dfmt(day(n))} 2026">${h}</svg>`;
    if (window.LW && LW.tip) {
      el.addEventListener("mousemove", (e) => { const r = e.target.closest && e.target.closest(".hov"); if (!r) return LW.tip(null);
        const i = +r.dataset.i; LW.tip(`<b>${dfmt(day(i))}</b><br>${series[i].toLocaleString("en-US")} engagement`, e); });
      el.addEventListener("mouseleave", () => LW.tip(null));
    }
  }

  function render(D) {
    const root = document.getElementById("x-root");
    const maxPost = Math.max(...D.posts.map((p) => p.likes));
    const topMax = Math.max(...D.themes.map((t) => t[1]));
    const names = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
    root.innerHTML = `
    <section class="x-hero">
      <div class="intro">
        <span class="eyebrow tc">On X · ${esc(D.kicker)} · ${dfmt(day(0))} – ${dfmt(day(D.series.length - 1))} 2026</span>
        <h1>${esc(D.title)}</h1>
        <p class="lede">${esc(D.lede)}</p>
      </div>
      <div class="stats">${D.kpis.map((k) => `<div><b>${esc(k[0])}</b><span>${esc(k[1])}</span></div>`).join("")}</div>
    </section>
    <section>
      <span class="eyebrow">What stands out</span>
      <div class="cards">${D.findings.map((f) => `<article class="card"><h3>${esc(f[0])}</h3><p>${esc(f[1])}</p></article>`).join("")}</div>
    </section>
    <section>
      <span class="eyebrow">Daily engagement</span>
      <div class="chart area" id="x-area"></div>
      <ol class="wk-key">${D.notes.map((n, j) => `<li><b>${j + 1}</b> ${dfmt(day(n.i))}: ${esc(n.t)}</li>`).join("")}</ol>
      <p class="legend">Engagement = likes + 2 × reposts + replies + quotes, by day of posting. Hover a day for its total.</p>
    </section>
    <section class="split">
      <div class="box"><h3>Share of engagement by theme</h3>
        ${D.themes.map(([l, s, n]) => `<div class="trow"><span class="lbl">${esc(l)} <span class="muted">· ${n} posts</span></span><span class="num">${s.toFixed(0)}%</span><span class="track"><span class="fill" style="width:${(s / topMax) * 100}%"></span></span></div>`).join("")}
        <p class="note">Keyword match on post text; a post can match several themes.</p></div>
      <div class="box"><h3>Posts that also mention…</h3>
        <div class="xlinks">${Object.entries(D.co).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<a href="${names[k].href}" style="--c:var(${names[k].c})"><b>${names[k].name}</b><span class="track"><i style="width:${Math.min(100, v * 3)}%"></i></span><span class="num">${v}%</span></a>`).join("")}</div>
        <p class="note">Share of this topic's posts that name another topic. People often list several crises in one post.</p>
        <h3>Top hashtags</h3>
        <div class="tags">${D.tags.map((t) => `<span class="tag">${esc(t[0])} <em>${t[1]}</em></span>`).join("")}</div></div>
    </section>
    <section>
      <span class="eyebrow">Posts that shaped it</span>
      <div class="posts">${D.posts.map((p) => `<div class="post"><div class="who"><span>@${esc(p.u)}</span><span>${esc(p.d)} · ${short(p.likes)} likes</span></div>
        <div class="meter" aria-hidden="true"><i style="width:${Math.max(4, (p.likes / maxPost) * 100)}%"></i></div>
        <p>${esc(p.t)}</p><a href="${xurl(p.id)}" target="_blank" rel="noopener">View post</a></div>`).join("")}</div>
    </section>
    <section class="split">
      <div class="box"><h3>What to watch</h3><ul class="watch">${D.watch.map((w) => `<li><span>${esc(w)}</span></li>`).join("")}</ul></div>
      <div class="box"><h3>About this page</h3><p class="note">${esc(D.method)} Figures in posts are claims, not checked against official sources. Quotes are paraphrased; follow the links for full text.</p></div>
    </section>
    <footer>Compiled ${esc(D.compiled)} from X posts via TwitterAPI.io. Part of the On X section of Indonesia Land Watch.</footer>`;
    area(document.getElementById("x-area"), D.series, D.notes);
  }

  window.ONX = { TOPICS, subnav, render, area };
})();
