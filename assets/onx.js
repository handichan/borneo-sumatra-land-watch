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
    { id: "karhutla", href: "social.html", name: "Karhutla", kicker: "Forest & land fires", c: "--fire", eng: 4909287,
      spark: [0,0,0,0,0,0,0,0,0,721,73,0,0,6,0,0,1197,0,282220,488869,94680,25105,80853,31105,1991,34136,219621,201,38440,121405,13935,173644,30165,42120,99785,160999,835,69,84,8785,18738,7335,92149,5381,13875,29818,65454,16390,6212,141754,131929,206157,70,32,129,437,20,0,15428,5908,31,0,0,0,0,6,67,0,13029,82438,3973,83790,60097,44572,197731,373179,613742,241104,298050,142061,47157] },
    { id: "mbg", href: "x-mbg.html", name: "MBG", kicker: "Free school meals", c: "--quarry", eng: 2789877,
      spark: [86611,144762,47538,127816,166430,40244,44436,237095,270130,101848,69106,117093,38401,29744,250184,5102,164235,31895,43293,6360,94271,144543,8451,170043,19363,9922,70488,47599,42029,36058,16970,20315,10009,44721,30289,2483] },
    { id: "kopdes", href: "x-kopdes.html", name: "Kopdes / KDMP", kicker: "Village cooperatives", c: "--palm", eng: 561907,
      spark: [1208,19060,49326,409,12,612,125,1185,2308,137,883,641,2454,2557,1860,138,5795,24137,4303,1112,0,533,989,27268,4,25,88899,40571,48881,51530,44833,61287,29880,21050,27707,188] },
    { id: "bbm", href: "x-bbm.html", name: "Krisis BBM", kicker: "Fuel shortages", c: "--coal", eng: 1230458,
      spark: [49368,100540,75,119,629,19,13255,535,153432,24730,4746,9,1103,1032,33249,0,47646,0,0,0,25,64,119,202,241,3706,1,9642,70188,33578,229065,145750,71748,133586,101660,396] },
    { id: "pasar", href: "x-pasar.html", name: "MSCI & IHSG", kicker: "Markets & rupiah", c: "--pulp", eng: 1018160,
      spark: [84,794,385,2998,22,16,1598,1564,157,58,171,93871,8,232,1099,247,0,199,169,156,64849,682,0,286,11,1104,543,15798,2049,757,16480,389031,179252,123970,118079,1441] },
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
