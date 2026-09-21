"use client";

import { useState, useEffect } from "react";
import { groupExams, monthName } from "@/lib/awardListExams";

const NAVY = "#150F3F";
const NAVY_LIGHT = "#1F1760";
const GOLD = "#FCB629";
const SITE = "https://www.coesialkot.com";

// One page listing every exam-related link.
//
// The exam list is read live, so a new exam created in /admin/exams
// appears here automatically — nobody has to edit this page.
//
// Listing links publicly is safe: every destination is still protected by
// the teachers' PIN or the admin password.

export default function ExamsHub() {
  const [exams, setExams] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/award-list/exams")
      .then((r) => r.json())
      .then((d) => setExams(d.exams || []))
      .finally(() => setLoaded(true));
  }, []);

  function copy(url) {
    navigator.clipboard?.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(""), 1800);
  }

  const grouped = groupExams(exams);
  const years = Object.keys(grouped).sort((a, b) => b - a);

  return (
    <div className="min-h-screen text-white"
         style={{ background: `radial-gradient(circle at top, ${NAVY_LIGHT}, #0A0826 60%)` }}>
      <div className="max-w-4xl mx-auto p-4 md:p-8">

        <div className="flex items-center gap-4 rounded-2xl p-5 md:p-6 mb-8 shadow-xl border"
             style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`, borderColor: `${GOLD}33` }}>
          <img src="/coe-logo.png" alt="COE Sialkot logo"
               className="h-14 w-14 md:h-16 md:w-16 rounded-full ring-2 shrink-0"
               style={{ ["--tw-ring-color"]: GOLD }} />
          <div className="min-w-0">
            <h1 className="text-xl md:text-3xl font-bold tracking-tight">Examinations</h1>
            <p className="text-xs md:text-sm uppercase tracking-widest mt-0.5" style={{ color: GOLD }}>
              Centre of Excellence Sialkot
            </p>
          </div>
        </div>

        {/* ---------------- Marks entry, per exam ---------------- */}
        <Section title="Enter marks" note="Teachers — open your exam, enter the PIN, choose your class-section.">
          {!loaded && <p className="text-sm text-white/50">Loading exams…</p>}
          {loaded && years.length === 0 && (
            <p className="text-sm text-white/50">No exams have been set up yet.</p>
          )}

          {years.map((y) => (
            <div key={y} className="mb-5">
              <h3 className="text-sm font-bold mb-2" style={{ color: GOLD }}>{y}</h3>
              {Object.keys(grouped[y]).sort((a, b) => b - a).map((m) => (
                <div key={m} className="mb-3">
                  <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">
                    {monthName(m)}
                  </div>
                  <div className="space-y-2">
                    {grouped[y][m].map((ex) => {
                      const url = `${SITE}/award-list/${ex.slug}`;
                      return (
                        <LinkRow
                          key={ex.id}
                          href={`/award-list/${ex.slug}`}
                          title={ex.name}
                          subtitle={`${monthName(ex.month)} ${ex.year}`}
                          badge={ex.is_current ? "Current" : null}
                          onCopy={() => copy(url)}
                          copied={copied === url}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Section>

        {/* ---------------- Results ---------------- */}
        <Section title="Results" note="Open with the teachers' PIN or the admin password.">
          <div className="space-y-2">
            <LinkRow href="/proformas"
                     title="Teacher-wise & Class-wise Proformas"
                     subtitle="Live result summaries · Excel download"
                     onCopy={() => copy(`${SITE}/proformas`)}
                     copied={copied === `${SITE}/proformas`} />
            <LinkRow href="/result-cards"
                     title="Result Cards"
                     subtitle="Progress report cards · colourful or ink-friendly · PNG & PDF"
                     onCopy={() => copy(`${SITE}/result-cards`)}
                     copied={copied === `${SITE}/result-cards`} />
          </div>
        </Section>

        {/* ---------------- Office ---------------- */}
        <Section title="Office" note="Admin password required.">
          <div className="space-y-2">
            <LinkRow href="/admin/exams"
                     title="Manage Exams"
                     subtitle="Create exams, copy teacher links, set the current exam" />
            <LinkRow href="/admin/award-lists"
                     title="Award Lists"
                     subtitle="Lock or unlock subjects · download award lists" />
            <LinkRow href="/admin/warning-letter"
                     title="Student Warning Letter"
                     subtitle="Discipline notices" />
          </div>
        </Section>

        <p className="text-[11px] text-white/40 mt-10 text-center">
          New exams appear here automatically once they are created in Manage Exams.
        </p>
      </div>
    </div>
  );
}

function Section({ title, note, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg md:text-xl font-bold mb-1" style={{ color: GOLD }}>{title}</h2>
      {note && <p className="text-xs text-white/50 mb-3">{note}</p>}
      {children}
    </section>
  );
}

function LinkRow({ href, title, subtitle, badge, onCopy, copied }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 border transition hover:brightness-125"
         style={{ borderColor: badge ? GOLD : "#ffffff1a", background: badge ? `${GOLD}12` : "#ffffff06" }}>
      <a href={href} className="flex-1 min-w-0">
        <div className="font-semibold flex items-center gap-2 flex-wrap">
          <span>{title}</span>
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border"
                  style={{ color: GOLD, borderColor: `${GOLD}66`, background: `${GOLD}1f` }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && <div className="text-xs text-white/50 truncate">{subtitle}</div>}
        <div className="text-[11px] font-mono mt-0.5 truncate" style={{ color: `${GOLD}cc` }}>
          coesialkot.com{href}
        </div>
      </a>
      {onCopy && (
        <button onClick={onCopy}
                className="text-xs font-semibold rounded-lg px-3 py-1.5 border shrink-0"
                style={{ borderColor: `${GOLD}55`, color: copied ? NAVY : GOLD,
                         background: copied ? GOLD : "transparent" }}>
          {copied ? "Copied" : "Copy"}
        </button>
      )}
      <a href={href} className="text-lg shrink-0" style={{ color: GOLD }} aria-label={`Open ${title}`}>
        &rarr;
      </a>
    </div>
  );
}
