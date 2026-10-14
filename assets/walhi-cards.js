// Cards built from WALHI's Oct 2026 report "Siapa di Balik Api?" (data/walhi.js). Each renderer fills one element.
(function () {
  const W = window.WALHI;
  if (!W) return;
  const { fmt, esc } = LW;
  const CO = Object.fromEntries((window.COMPANIES || []).map((c) => [c.id, c]));
  const S = W.stats;
  const $ = (id) => document.getElementById(id);
  const kpi = ([v, l, s, a]) => `<div class="kpi${a ? " alert" : ""}"><span class="v">${v}</span><span class="l">${l}</span><span class="s">${s}</span></div>`;
  const STC = { "consistent": "ok", "new from WALHI": "new", "dataset adds owner": "add", "differs": "diff", "unattributed in both": "none", "not in mapped licences": "none" };

  const R = {
    season(id) {
      $(id).innerHTML = [
        [fmt.n(S.hotspots_jan_sep_2026), "Hotspots, Jan–Sep 2026", "high confidence (≥80%)", true],
        [fmt.n(S.hotspots_in_concessions_jan_7sep), "Inside company licences", `${S.palm_companies_with_hotspots} palm + ${S.pbph_companies_with_hotspots} forestry firms, to 7 Sep`],
        [fmt.n(S.kalbar_hotspots), "West Kalimantan", `Central Kalimantan ${fmt.n(S.kalteng_hotspots)}`],
        [fmt.n(S.merauke_psn_hotspots), "Merauke PSN estate", `${S.merauke_state_cluster_hotspots} in state-run clusters`, true],
      ].map(kpi).join("");
    },
    provinces(id) {
      $(id).innerHTML = `<ol style="margin:0;padding-left:20px;display:grid;gap:3px;font-size:.9rem">${S.province_rank.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>
        <p class="note">Repeat burners WALHI had already reported to the environment ministry in 2023: ${S.repeat_offenders_reported_2023.map(esc).join(", ")}.</p>`;
    },
    merauke(id) {
      LW.hbar($(id), W.merauke.map((r) => ({ label: r.name.replace(/^PT /, ""), value: r.hotspots,
        color: r.type === "PSN Food Estate" ? LW.css("--muted") : (r.group === "Wilmar" ? "#2a78d6" : "#eb6834"),
        tip: `<b>${esc(r.name)}</b><br>${esc(r.group)} · ${r.type}<br>${r.hotspots} hotspots` })), { labelW: 200 });
    },
    pep(id) {
      $(id).innerHTML = W.pep.map((p) => `<div class="person"><b>${esc(p.person)}</b><small>${esc(p.political_role)}</small><span>${esc(p.corporate_role)}</span>
        <span class="chip" style="justify-self:start">${esc(p.company)}</span></div>`).join("");
    },
    foreign(id) {
      $(id).innerHTML = `<thead><tr><th>Company</th><th>Owner / parent</th><th>Jurisdiction</th></tr></thead><tbody>` +
        W.foreign.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td class="w">${esc(r.owner)}</td><td>${esc(r.jurisdiction)}</td></tr>`).join("") + "</tbody>";
    },
    groups(id) {
      LW.hbar($(id), W.group_counts.map((r) => ({ label: r.group, value: r.firms, color: r.origin === "Malaysia" ? "#1baf7a" : "#2a78d6",
        tip: `<b>${esc(r.group)}</b><br>${r.origin}<br>${r.firms} firms` })), { labelW: 200 });
    },
    field(id) {
      $(id).innerHTML = `<thead><tr><th>Company</th><th>Group</th><th class="n">Burned</th><th>Finding</th></tr></thead><tbody>` +
        W.field.map((r) => `<tr><td><b>${esc(r.name)}</b><br><small class="note">${esc(r.province)}</small></td><td>${esc(r.group || "–")}</td>
          <td class="n">${r.burned_ha ? fmt.n(r.burned_ha) + " ha" : "–"}</td><td class="w">${esc(r.finding)}</td></tr>`).join("") + "</tbody>";
    },
    issues(id) {
      $(id).innerHTML = W.issues.map((t) => `<li>${esc(t)}</li>`).join("");
    },
    validation(tableId, segId) {
      const V = W.validation; let filt = "";
      const seg = $(segId);
      seg.innerHTML = [["", `All (${V.length})`], ...Object.keys(STC).map((k) => [k, `${k[0].toUpperCase() + k.slice(1)} (${V.filter((r) => r.status === k).length})`])]
        .map(([k, l]) => `<button data-k="${k}" aria-pressed="${k === ""}">${l}</button>`).join("");
      const draw = () => {
        $(tableId).innerHTML = `<thead><tr><th>Company (WALHI)</th><th>List</th><th class="n">WALHI hotspots</th><th>WALHI group / owner</th><th>Our group</th><th class="n">Mapped area</th><th class="n">Our fires, 7 d</th><th>Status</th><th>Note</th></tr></thead><tbody>` +
          V.filter((r) => !filt || r.status === filt).map((r) => {
            const link = r.conc_ids.length ? `<a href="map.html?conc=${r.conc_ids[0]}">${esc(r.name)}</a>` : esc(r.name);
            const cos = r.cids.map((id) => CO[id] ? `<a href="companies.html?id=${id}">${esc(CO[id].short)}</a>` : "").join(", ");
            return `<tr><td><b>${link}</b><br><small class="note">${esc(r.province)}</small></td><td style="font-size:.8rem">${esc(r.src)}</td>
              <td class="n">${r.hotspots == null ? "–" : fmt.n(r.hotspots)}<br><small class="note">${esc(r.period)}</small></td><td class="w">${esc(r.walhi_group) || "–"}</td>
              <td class="w">${esc(r.our_group) || "–"}${cos ? "<br>" + cos : ""}</td><td class="n">${r.area_ha ? fmt.ha(r.area_ha) : "–"}</td><td class="n">${r.conc_ids.length ? fmt.n(r.fires7d) : "–"}</td>
              <td><span class="st ${STC[r.status]}">${esc(r.status)}</span></td><td class="w">${esc(r.note)}</td></tr>`;
          }).join("") + "</tbody>";
      };
      seg.onclick = (e) => { const b = e.target.closest("button"); if (!b) return; filt = b.dataset.k; seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); };
      draw();
    },
    source(id) { $(id).textContent = `Source: ${W.source}. Hotspot counts, ownership and political links are WALHI's findings as published; this dashboard does not independently verify them.`; },
  };
  LW.walhi = R;
})();
