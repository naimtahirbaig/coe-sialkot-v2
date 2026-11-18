"use client";

import { useState, useEffect } from "react";
import { groupExams, monthName } from "@/lib/awardListExams";
import ResultSheetsPanel from "@/components/ResultSheetsPanel";
import InnerPage from "@/components/site/InnerPage";

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
    <InnerPage section="exams" title="Examinations" light="Office"
      lede="Every exam link in one place: marks entry, proformas, result cards and office tools."
      toc={[{ id: "marks", label: "Enter marks" }, { id: "results", label: "Results" }, { id: "sheets", label: "Result sheets" }, { id: "office", label: "Office" }]}>
      <Section id="marks" title="Enter marks" note="Teachers: open your exam, enter the PIN and choose your class section.">
        {!loaded && <p className="ip-empty">Loading exams…</p>}
        {loaded && years.length === 0 && <p className="ip-empty">No exams have been set up yet.</p>}
        {years.map((y) => (
          <div key={y} className="ex-year">
            <h3>{y}</h3>
            {Object.keys(grouped[y]).sort((a, b) => b - a).map((m) => (
              <div key={m} className="ex-month">
                <p className="ex-mname">{monthName(m)}</p>
                {grouped[y][m].map((ex) => {
                  const url = `${SITE}/award-list/${ex.slug}`;
                  return <LinkRow key={ex.id} href={`/award-list/${ex.slug}`} title={ex.name} subtitle={`${monthName(ex.month)} ${ex.year}`}
                    badge={ex.is_current ? "Current" : null} onCopy={() => copy(url)} copied={copied === url} />;
                })}
              </div>
            ))}
          </div>
        ))}
      </Section>
      <hr className="ip-rule" />
      <Section id="results" title="Results" note="Open with the teachers’ PIN or the admin password.">
        <LinkRow href="/proformas" title="Teacher-wise and class-wise proformas" subtitle="Live result summaries with Excel download"
          onCopy={() => copy(`${SITE}/proformas`)} copied={copied === `${SITE}/proformas`} />
        <LinkRow href="/result-cards" title="Result cards" subtitle="Progress report cards, colourful or ink-friendly, PNG and PDF"
          onCopy={() => copy(`${SITE}/result-cards`)} copied={copied === `${SITE}/result-cards`} />
      </Section>
      <hr className="ip-rule" />
      <section id="sheets">
        <h2>Result sheets</h2>
        <div className="ip-darkbox"><ResultSheetsPanel /></div>
      </section>
      <hr className="ip-rule" />
      <Section id="office" title="Office" note="Admin password required.">
        <LinkRow href="/admin/exams" title="Manage exams" subtitle="Create exams, copy teacher links, set the current exam" />
        <LinkRow href="/admin/award-lists" title="Award lists" subtitle="Lock or unlock subjects and download award lists" />
        <LinkRow href="/admin/warning-letter" title="Student warning letter" subtitle="Discipline notices" />
      </Section>
      <p className="ip-meta">New exams appear here automatically once they are created in Manage exams.</p>
    </InnerPage>
  );
}

function Section({ id, title, note, children }) {
  return (
    <section id={id}>
      <h2>{title}</h2>
      {note && <p className="ex-note">{note}</p>}
      <div className="ex-rows">{children}</div>
    </section>
  );
}

function LinkRow({ href, title, subtitle, badge, onCopy, copied }) {
  return (
    <div className={`ex-row${badge ? " cur" : ""}`}>
      <a href={href} className="ex-main">
        <b>{title}{badge && <span className="ip-tag gold">{badge}</span>}</b>
        {subtitle && <span>{subtitle}</span>}
        <code>coesialkot.com{href}</code>
      </a>
      {onCopy && <button type="button" className="ex-copy" onClick={onCopy}>{copied ? "Copied" : "Copy link"}</button>}
      <a href={href} className="ip-btn ex-open" aria-label={`Open ${title}`}>Open</a>
    </div>
  );
}
