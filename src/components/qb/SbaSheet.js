"use client";
// The question paper itself, laid out like the PECTAA School-Based Assessment (SBA) papers:
// bordered header (logo, title, QR, school and student lines), Part A (MCQs in two columns,
// optionally with a reading passage), Part B (numbered questions with a / b / c parts),
// right-to-left Urdu version, A3 page.
import "@fontsource/source-sans-pro/400.css";
import "@fontsource/source-sans-pro/700.css";
import Rich from "./Rich";
import { optionLayout, labelFor } from "@/lib/qbFormats";

const fmt = (v) => String(+Number(v).toFixed(2));

export const SHEET_CSS = `
@font-face{font-family:COEUrdu;src:url(/fonts/noto-nastaliq-urdu-400.woff2) format("woff2");font-weight:400}
@font-face{font-family:COEUrdu;src:url(/fonts/noto-nastaliq-urdu-700.woff2) format("woff2");font-weight:700}
.sba{width:842pt;box-sizing:border-box;margin:0 auto;padding:38pt 50pt 40pt;background:#fff;color:#000;
  font-family:"Source Sans Pro","Noto Sans",Arial,sans-serif;font-size:10pt;line-height:1.38}
.sba *{box-sizing:border-box}
.sba .box{border:3.2pt solid #000;padding:7pt 15pt 4pt}
.sba .hd{display:grid;grid-template-columns:92pt 1fr 92pt;align-items:start}
.sba .logo{width:88pt;height:auto;display:block}
.sba .qr{width:84pt;height:84pt;image-rendering:pixelated;justify-self:end;display:block}
.sba .qrgap{width:84pt;height:84pt}
.sba .t1{font-size:21pt;font-weight:700;text-align:center;line-height:1.18}
.sba .t2{font-size:18.5pt;font-weight:700;text-align:center;margin-top:5pt}
.sba .t3{font-size:18.5pt;font-weight:700;text-align:center;margin-top:3pt;line-height:1.2}
.sba .marks{text-align:center;font-weight:700;font-size:12pt;margin-top:7pt}
.sba .fl{display:flex;align-items:baseline;gap:14pt;margin-top:3pt}
.sba .fl b{font-size:11.5pt;white-space:nowrap}
.sba .fl .ln{flex:1;border-bottom:2pt solid #000;min-height:14pt;font-weight:700;font-size:11.5pt;padding-left:4pt}
.sba .fl.stu{margin-top:9pt;margin-bottom:4pt}
.sba .fl.stu b{font-size:11pt}.sba .fl.stu .ln{border-bottom-width:1.6pt}
.sba .sec{text-align:center;font-size:16.5pt;font-weight:700;margin:12pt 0 6pt;line-height:1.3}
.sba .div{border-top:1pt solid #cfcfcf;margin:10pt 0 2pt}
.sba .mcqs{display:grid;grid-template-columns:1fr 1fr;column-gap:16pt;row-gap:5pt;align-items:start}
.sba .mq{break-inside:avoid;position:relative;padding-bottom:3pt}
.sba .stem{font-weight:700}
.sba .opts{margin-top:3pt}
.sba .opts.row{display:flex;justify-content:space-between;gap:8pt}
.sba .opts.grid{display:grid;grid-template-columns:1fr 1fr;gap:3pt 10pt}
.sba .opts.list{display:grid;grid-template-columns:1fr;gap:3pt}
.sba .qimg{display:block;max-width:100%;max-height:170pt;margin:5pt auto;object-fit:contain}
.sba .pass{grid-column:1/-1;margin:6pt 0 2pt;overflow:hidden}
.sba .pass b{display:block}
.sba .pimg{float:right;width:175pt;border:3pt solid #000;margin:4pt 0 6pt 14pt;display:block}
.sba.rtl .pimg{float:left;margin:4pt 14pt 6pt 0}
.sba .bq{break-inside:avoid;margin-top:5pt}
.sba .bqn{font-weight:700;margin-top:3pt}
.sba .bp{font-weight:700;margin:7pt 0;position:relative}
.sba .bp .pm{white-space:nowrap}
.sba .ans{color:#0B7A3E;font-style:italic;font-weight:400;margin-top:2pt}
.sba .ok{color:#0B7A3E;font-weight:700}
.sba .swap{position:absolute;top:0;inset-inline-end:0;background:#fff;border:1px solid #9a9db5;border-radius:6px;font:700 13px/1 sans-serif;cursor:pointer;padding:2px 6px;color:#150F3F}
.sba.rtl .body{direction:rtl}
.sba.rtl .body, .sba.rtl .body .stem, .sba.rtl .body .bp{font-family:COEUrdu,"Noto Nastaliq Urdu","Jameel Noori Nastaleeq",serif;line-height:2.15}
.sba.rtl .body .sec{font-size:14pt}
.sba.rtl .body .ltr{direction:ltr;unicode-bidi:isolate;font-family:"Source Sans Pro",Arial,sans-serif}
.sba .end{text-align:center;font-style:italic;margin-top:18pt}
@media print{
  @page{size:A3 portrait;margin:0}
  .sba{zoom:1!important;position:absolute;left:0;top:0}
  .sba .swap{display:none!important}
  .sba .ans,.sba .ok{color:#000}
}`;

function Mcq({ q, n, rtl, keyOn, onSwap }) {
  const lay = optionLayout(q.opts);
  return (
    <div className="mq" id={`q${n}`}>
      <div className="stem">
        <span>{rtl ? `سوال نمبر ${n}:` : `Question No.${n} :`}</span>{" "}<Rich text={q.text} />
      </div>
      {q.image && <img className="qimg" src={q.image} alt="" />}
      <div className={`opts ${lay}`}>
        {q.opts.map((o, i) => o && (
          <span key={i} className={keyOn && q.correct === "ABCD"[i] ? "ok" : undefined}>
            <bdi className="ltr">({"abcd"[i]})</bdi>{" "}<Rich text={o} />
          </span>
        ))}
      </div>
      {onSwap && <button className="swap qb-noprint" title="Replace with another question" onClick={onSwap}>↻</button>}
    </div>
  );
}

export default function SbaSheet({ doc, keyOn = false, onSwap = null }) {
  const h = doc.header;
  const rtl = h.lang === "ur";
  const A = doc.partA, B = doc.partB || [];
  const aTotal = (A.plain.length + (A.passage?.questions.length || 0)) * A.marksEach;
  const bTotal = B.reduce((t, blk) => t + blk.parts.reduce((x, p) => x + p.marks, 0), 0);
  let n = 0;

  return (
    <article className={`sba${rtl ? " rtl" : ""}`}>
      <div className="box">
        <div className="hd">
          <img className="logo" src={h.logo} alt="PECTAA" />
          <div>
            <div className="t1">{h.title}</div>
            <div className="t2">{h.gradeLabel}</div>
            <div className="t3">SUBJECT: {h.subjectTitle}</div>
          </div>
          {h.qr ? <img className="qr" src={h.qr} alt="QR code" /> : <div className="qrgap" />}
        </div>
        <div className="marks">[Part A: {fmt(aTotal)} Marks Part B: {fmt(bTotal)} Marks Total: {fmt(aTotal + bTotal)} Marks]</div>
        <div className="fl"><b>School Name:</b><span className="ln">{h.school}</span></div>
        <div className="fl stu">
          <b>Student Name :</b><span className="ln" />
          <b>Roll Number :</b><span className="ln" />
          <b>Section :</b><span className="ln" />
        </div>
      </div>

      <div className="body">
        {aTotal > 0 && (
          <>
            <div className="sec">{rtl ? "حصہ اول: معروضی سوالات" : "OBJECTIVE PART(MCQs)"}</div>
            <div className="mcqs">
              {A.plain.map((q, i) => { n++; return <Mcq key={`p${i}`} q={q} n={n} rtl={rtl} keyOn={keyOn} onSwap={onSwap && (() => onSwap(["A", "plain", i]))} />; })}
              {A.passage && (
                <div className="pass">
                  <b>{rtl ? "پیراگراف ہدایات" : "Paragraph Instruction"}</b>
                  {A.passage.instruction && <b><Rich text={A.passage.instruction} /></b>}
                  {A.passage.image && <img className="pimg" src={A.passage.image} alt="" />}
                  <Rich text={A.passage.text} />
                </div>
              )}
              {A.passage && A.passage.questions.map((q, i) => { n++; return <Mcq key={`s${i}`} q={q} n={n} rtl={rtl} keyOn={keyOn} onSwap={onSwap && (() => onSwap(["A", "passage", i]))} />; })}
            </div>
          </>
        )}

        {B.length > 0 && (
          <>
            {aTotal > 0 && <div className="div" />}
            <div className="sec">{rtl ? "حصہ دوم: انشائیہ سوالات" : "SUBJECTIVE PART(CRQs)"}</div>
            {B.map((blk, bi) => (
              <div className="bq" key={bi} id={`q${blk.no}`}>
                <div className="bqn">{rtl ? `سوال نمبر ${blk.no}` : `Question No: ${blk.no}`}</div>
                {blk.parts.map((pt, pj) => (
                  <div className="bp" key={pj}>
                    {blk.parts.length > 1 && <><bdi className="ltr">{labelFor(pj, h.lang)}</bdi>{" "}</>}
                    <Rich text={pt.q.text} />{" "}
                    <span className="pm">{rtl ? `(${fmt(pt.marks)} نمبر)` : `(${fmt(pt.marks)} Marks)`}</span>
                    {pt.q.image && <img className="qimg" src={pt.q.image} alt="" />}
                    {keyOn && <div className="ans" dir="auto">{rtl ? "جواب: " : "Answer: "}{pt.q.qtype === "true_false" ? pt.q.correct : ""} {pt.q.answer || (pt.q.qtype !== "true_false" ? (rtl ? "(جواب درج نہیں)" : "(no model answer stored)") : "")}</div>}
                    {onSwap && <button className="swap qb-noprint" title="Replace with another question" onClick={() => onSwap(["B", bi, pj])}>↻</button>}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </article>
  );
}
