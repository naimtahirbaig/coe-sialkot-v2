'use client';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ── Home page ───────────────────────────────────────────────
// Header over the slideshow: big school badge, quick links row, main menu with full-width panels.
// Slideshow: full-screen, big two-colour name, a tilted photo card that changes with each slide.
// Below: control bar, notices strip, students, staff, footer. Gold quick buttons on the right edge.

const MENU = [
  {
    label: 'Students',
    intro: 'Everything a student needs: practise, take tests and revise.',
    links: [
      { href: '/practice-tests-2026.html', title: 'Practice tests',     text: 'Any chapter, any time, nothing saved' },
      { href: '/online-tests-2026.html',   title: 'Online Tests 2026',  text: 'Real chapter tests on announced dates' },
      { href: '/student-resources',        title: 'Student resources',  text: 'Notes, past papers and date sheets' },
      { href: '/practice-tests',           title: 'Quizzes',            text: 'Flashcards, matching and quick quizzes' },
    ],
  },
  {
    label: 'Tests & Results',
    intro: 'Online MCQ tests for Classes 6, 7 and 8, with a result card for every test.',
    links: [
      { href: '/online-tests-2026.html',   title: 'Online Tests 2026',    text: 'Password from your class teacher' },
      { href: '/practice-tests-2026.html', title: 'Practice tests',       text: 'Same questions and timer, no camera' },
      { href: '/result-cards',             title: 'Result cards',         text: 'Printable progress report cards' },
      { href: '/exams',                    title: 'Examinations',         text: 'All exam links in one place' },
    ],
  },
  {
    label: 'Teachers',
    intro: 'Tools for teachers and the office. Most ask for your password.',
    links: [
      { href: '/question-bank',       title: 'Question Bank',       text: 'Add questions and make class tests' },
      { href: '/online-test-setup',   title: 'Online test setup',   text: 'Choose a test, set dates, make it live' },
      { href: '/online-test-results', title: 'Online test results', text: 'Result cards, letters and downloads' },
      { href: '/award-list',          title: 'Award lists',         text: 'Enter marks for your class and section' },
      { href: '/proformas',           title: 'Proformas',           text: 'Teacher-wise and class-wise details' },
      { href: '/admin',               title: 'Administration',      text: 'Papers, results, promotion and letters' },
    ],
  },
  { label: 'Notice Board', href: '/notice-board' },
];

const QUICK = [
  { href: '/practice-tests-2026.html', label: 'Practice tests', icon: 'pencil' },
  { href: '/online-tests-2026.html',   label: 'Online Tests',   icon: 'check' },
  { href: '/notice-board',             label: 'Notice board',   icon: 'bell' },
];

const SLIDES = [
  { id: 'online', photo: '/home/photos/assembly-wide.webp', caption: 'Online Tests 2026', href: '/online-tests-2026.html',
    pic: { kind: 'img', src: '/home/home-test.webp', alt: 'A question from a Class 6 General Science online test with a 15-second timer' } },
  { id: 'practice', photo: '/home/photos/class10-sound.webp', caption: 'Practise any chapter', href: '/practice-tests-2026.html',
    pic: { kind: 'img', src: '/home/home-practice.webp', alt: 'The Practice Tests page with class and subject filters' } },
  { id: 'result', photo: '/home/photos/assembly-lines.webp', caption: 'A result card for every test', href: '/online-tests-2026.html',
    pic: { kind: 'img', src: '/home/home-result.webp', alt: 'A student result card: 9 out of 10 in General Science, Class 6' } },
  { id: 'notes', photo: '/home/photos/class8-biology.webp', caption: 'Notes, papers & date sheets', href: '/student-resources',
    pic: { kind: 'books' } },
  { id: 'bank', photo: '/home/photos/class10-sound2.webp', caption: 'Question Bank for teachers', href: '/question-bank',
    pic: { kind: 'paperdraw' } },
];

const NEWS_DEFAULT = [
  { id: 'd1', title: 'Practice tests for Classes 6, 7 and 8 are open any time' },
  { id: 'd2', title: 'Online Tests 2026: ask your class teacher for the password' },
  { id: 'd3', title: 'Result cards are saved in the school record after every online test' },
];

const SLIDE_MS = 6500;

const STUDENT_MAIN = [
  { href: '/practice-tests-2026.html', title: 'Practice tests', note: 'Open any time', tone: 'gold', cta: 'Start practising',
    text: 'Chapter-wise MCQs for Classes 6, 7 and 8 in every subject. No camera, nothing is saved, and the questions change each time you practise.' },
  { href: '/online-tests-2026.html', title: 'Online Tests 2026', note: 'Password from your teacher', tone: 'green', cta: 'Go to Online Tests',
    text: 'The real chapter tests. They open on the dates your teacher announces, need a camera, allow one attempt, and your result card is saved.' },
];
const STUDENT_MORE = [
  { href: '/student-resources', title: 'Student resources', text: 'Notes, past papers and date sheets' },
  { href: '/notice-board',      title: 'Notice board',      text: 'Announcements from the school office' },
  { href: '/practice-tests',    title: 'Quizzes',           text: 'Flashcards, matching and quick quizzes' },
];
const STAFF = [
  { href: '/question-bank',       title: 'Question Bank',       text: 'Add questions and make class tests' },
  { href: '/online-test-setup',   title: 'Online test setup',   text: 'Choose a test, set dates, make it live' },
  { href: '/online-test-results', title: 'Online test results', text: 'Result cards, letters and downloads' },
  { href: '/exams',               title: 'Examinations',        text: 'All exam links in one place' },
  { href: '/award-list',          title: 'Award lists',         text: 'Enter marks for your class and section' },
  { href: '/result-cards',        title: 'Result cards',        text: 'Printable progress report cards' },
  { href: '/proformas',           title: 'Proformas',           text: 'Teacher-wise and class-wise details' },
  { href: '/admin',               title: 'Administration',      text: 'Papers, results, promotion and letters' },
];
const AUTHORITIES = [
  { src: '/ld-punjab.webp',  name: 'Government of the Punjab' },
  { src: '/ld-pectaa.webp',  name: 'PECTAA' },
  { src: '/ld-naim.webp',    name: 'Dr Naim Tahir Baig, COE Sialkot (Boys)' },
];
// ── "Why choose" tabs: each one changes the section colour ──
const WHY = [
  { id: 'tests', tab: 'Chapter-wise Online Tests', bg: '#7A5410', bg2: '#C98612', h: '#FFFFFF', title: 'Chapter-wise Online Tests', label: 'ONLINE TESTS', icon: 'check',
    text: 'Every chapter of every subject for Classes 6, 7 and 8 has its own timed MCQ test, given up to five times in the year. Students take them on any phone or computer, and teachers set the dates.',
    href: '/online-tests-2026.html', pic: { kind: 'img', src: '/home/home-test.webp', alt: 'An online test question with a 15-second timer' } },
  { id: 'practice', tab: 'Practise Any Time', bg: '#0C0C3C', bg2: '#1F2A86', title: 'Practise Any Time', label: 'PRACTICE', icon: 'pencil',
    text: 'The same questions and timer as the real tests, open day and night. No camera and nothing saved, so students can practise each chapter until they are ready.',
    href: '/practice-tests-2026.html', pic: { kind: 'img', src: '/home/home-practice.webp', alt: 'The Practice Tests page' } },
  { id: 'cards', tab: 'A Result Card for Every Test', bg: '#123F4A', bg2: '#2C7A8A', title: 'A Result Card for Every Test', label: 'RESULT CARDS', icon: 'card',
    text: 'Marks, percentage, grade and a question-by-question answer key, saved in the school record and ready to print. Parents see exactly where their son needs help.',
    href: '/online-tests-2026.html', pic: { kind: 'img', src: '/home/home-result.webp', alt: 'A student result card' } },
  { id: 'bank', tab: 'Question Bank', bg: '#4A1424', bg2: '#8E2638', title: 'A Question Bank of 18,576 Questions', label: 'QUESTION BANK', icon: 'bank',
    text: 'Teachers add questions chapter by chapter. Class tests and term papers are made from the bank in minutes, with no question repeated between versions.',
    href: '/question-bank', pic: { kind: 'paperdraw' } },
  { id: 'notes', tab: 'Notes & Past Papers', bg: '#1E2550', bg2: '#3C4A9A', title: 'Notes, Past Papers and Date Sheets', label: 'RESOURCES', icon: 'book',
    text: 'Class-wise study material for every subject, kept in one place so students can revise at home and parents can follow the date sheets.',
    href: '/student-resources', pic: { kind: 'books' } },
  { id: 'authority', tab: 'Daanish Authority', bg: '#0A0A30', bg2: '#16154F', title: 'Part of the Daanish Family', label: 'GOVT. OF THE PUNJAB', icon: 'shield',
    text: 'A Centre of Excellence of the Punjab Daanish Schools and Centres of Excellence Authority, under PECTAA and the Government of the Punjab.',
    href: '/notice-board', pic: { kind: 'logos' } },
];

// ── "Learning at" columns ──
const CLASSES = [
  { n: 6, photo: '/home/photos/class6-science.webp', sections: 6, href: '/practice-tests-2026.html?class=6', note: 'Online and practice tests in 9 subjects', subjects: ['English', 'Urdu', 'Mathematics', 'General Science', 'Computer Science', 'Islamiat', 'Tarjuma-tul-Quran', 'History', 'Geography'] },
  { n: 7, photo: '/home/photos/assembly-lines.webp', sections: 6, href: '/practice-tests-2026.html?class=7', note: 'Online and practice tests in 9 subjects', subjects: ['English', 'Urdu', 'Mathematics', 'General Science', 'Computer Science', 'Islamiat', 'Tarjuma-tul-Quran', 'History', 'Geography'] },
  { n: 8, photo: '/home/photos/class8-biology.webp', sections: 7, href: '/practice-tests-2026.html?class=8', note: 'Online and practice tests in 10 subjects', subjects: ['English', 'Urdu', 'Mathematics', 'General Science', 'Computer Science', 'Islamiat', 'Tarjuma-tul-Quran', 'History', 'Geography', 'Fine Arts'] },
  { n: 9, photo: '/home/photos/assembly-podium.webp', sections: 6, href: '/student-resources', note: 'Notes, past papers and date sheets', subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer', 'English', 'Urdu', 'Islamiat', 'Pakistan Studies'] },
  { n: 10, photo: '/home/photos/class10-sound.webp', sections: 6, href: '/student-resources', note: 'Notes, past papers and date sheets', subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer', 'English', 'Urdu', 'Islamiat', 'Pakistan Studies'] },
];

// ── "At a Glance": real figures from the school database (November 2026) ──
const GLANCE = [
  { big: '1,420', text: 'Students' },
  { big: '31', text: 'Class sections, from Class 6 to Class 10' },
  { big: '38', text: 'Teachers' },
  { big: '289', text: 'Chapter-wise online tests, each given up to five times a year' },
  { big: '18,576', text: 'Questions in the school Question Bank' },
  { big: '10', text: 'Subjects with online and practice tests' },
];

const ACTIONS = [
  { href: '/practice-tests-2026.html', label: 'Practise', icon: 'pencil' },
  { href: '/online-tests-2026.html',   label: 'Online Tests', icon: 'check' },
  { href: '/notice-board',             label: 'Notices', icon: 'bell' },
];

// Mughal eight-point star lattice, drawn as thin lines and used faintly behind sections
const PATTERN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><g fill="none" stroke="#fff" stroke-width="1.4"><path d="M60 14 74 46 106 60 74 74 60 106 46 74 14 60 46 46Z"/><path d="M27.5 27.5 60 40 92.5 27.5 80 60 92.5 92.5 60 80 27.5 92.5 40 60Z"/><circle cx="60" cy="60" r="12"/><path d="M0 0 14 0M0 0 0 14M120 0 106 0M120 0 120 14M0 120 14 120M0 120 0 106M120 120 106 120M120 120 120 106"/></g></svg>')}")`;

const PATTERN_DARK = PATTERN.replace(encodeURIComponent('stroke="#fff"'), encodeURIComponent('stroke="#16154F"'));
const AUTH3 = [
  { src: '/ld-punjab.webp',  name: 'Government of the Punjab' },
  { src: '/ld-pectaa.webp',  name: 'PECTAA' },
  { src: '/ld-daanish.webp', name: 'Punjab Daanish Schools & Centres of Excellence Authority' },
];


// ── Life at COE: event posters from the school (WhatsApp collages, Sept–May 2026) ──
const EVENTS = [
  { src: '/home/photos/event-60.webp', date: '11 Sep 2026', title: 'Tribute to Quaid-e-Azam', text: 'A morning assembly honouring the legacy of Quaid-e-Azam Muhammad Ali Jinnah and his services to Pakistan.' },
  { src: '/home/photos/event-55.webp', date: '10 Sep 2026', title: 'Coding with Scratch', text: 'Class 8 students explore loops in Scratch through interactive learning.' },
  { src: '/home/photos/event-48.webp', date: '8 Sep 2026', title: 'World Literacy Day', text: 'Empowering minds, inspiring dreams and building a brighter tomorrow.' },
  { src: '/home/photos/event-45.webp', date: '4 Sep 2026', title: 'Light in Action', text: 'Class 8 Tipu presents the transmission, reflection and absorption of light.' },
  { src: '/home/photos/event-40.webp', date: '28 Aug 2026', title: 'Space Technology', text: 'Class 8 Abdali students learn how a two-stage rocket works.' },
  { src: '/home/photos/event-43.webp', date: '27 Aug 2026', title: 'Morning Assembly', text: 'The school gathers in front of its historic red-brick building to start the day.' },
  { src: '/home/photos/event-37.webp', date: '27 Aug 2026', title: 'Independence Day Certificates', text: 'Certificates for the students who performed on Independence Day.' },
  { src: '/home/photos/event-34.webp', date: '14 Aug 2026', title: 'Independence Day', text: 'Celebrating freedom, unity and love for Pakistan. Pakistan Zindabad!' },
  { src: '/home/photos/event-30.webp', date: '14 Aug 2026', title: 'Flag Hoisting Ceremony', text: 'Graced by the Chief Guest, ADC (R) Sialkot, and members of the Governing Body.' },
  { src: '/home/photos/event-24.webp', date: '29 Jun 2026', title: 'States of Matter', text: 'Class 6 Jinnah discovers how matter changes from one state to another.' },
  { src: '/home/photos/event-18.webp', date: '9 Jun 2026', title: 'Sound Waves', text: 'Class 10 Liaqat learns about sound waves and the tuning fork.' },
  { src: '/home/photos/event-9.webp', date: '2 Jun 2026', title: 'Science in Action', text: 'Class 8 Liaqat explores chemical reactions in the biology lab.' },
  { src: '/home/photos/event-8.webp', date: '2 Jun 2026', title: 'In the Library', text: 'Class 6 students exploring knowledge in the school library.' },
];
// ── drawings for the slides that have no screenshot ──
function BooksDrawing() {
  return (
    <svg viewBox="0 0 560 420" role="img" aria-label="Books, a notebook and a pencil">
      <ellipse cx="290" cy="372" rx="240" ry="20" fill="#08082A" opacity=".45" />
      {/* stacked books */}
      <g>
        <rect x="70" y="300" width="300" height="56" rx="6" fill="#E39C24" />
        <rect x="70" y="300" width="22" height="56" fill="#C98612" />
        <rect x="104" y="316" width="190" height="8" rx="4" fill="#FDF1D8" opacity=".8" />
        <rect x="104" y="332" width="120" height="6" rx="3" fill="#FDF1D8" opacity=".55" />
        <rect x="90" y="246" width="280" height="54" rx="6" fill="#FDF1D8" />
        <rect x="90" y="246" width="22" height="54" fill="#F2CF85" />
        <rect x="126" y="262" width="150" height="8" rx="4" fill="#16154F" opacity=".75" />
        <rect x="126" y="278" width="96" height="6" rx="3" fill="#16154F" opacity=".45" />
        <rect x="60" y="192" width="290" height="54" rx="6" fill="#2B2A7A" />
        <rect x="60" y="192" width="22" height="54" fill="#201F63" />
        <rect x="96" y="208" width="170" height="8" rx="4" fill="#F6C766" />
        <rect x="96" y="224" width="110" height="6" rx="3" fill="#F6C766" opacity=".6" />
      </g>
      {/* open notebook */}
      <g transform="translate(300 96) rotate(8)">
        <rect x="0" y="0" width="210" height="250" rx="10" fill="#FFFDF6" stroke="#F2CF85" strokeWidth="3" />
        <rect x="0" y="0" width="34" height="250" rx="10" fill="#E39C24" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <circle key={i} cx="17" cy={28 + i * 28} r="5" fill="#FFFDF6" />)}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1="52" x2="190" y1={46 + i * 28} y2={46 + i * 28} stroke="#D3D2E6" strokeWidth="2" />)}
        <path d="M58 40 q16 -10 30 0 t30 0 t30 0" fill="none" stroke="#16154F" strokeWidth="3" strokeLinecap="round" />
        <path d="M58 96 h86" stroke="#16154F" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        <path d="M58 124 h110" stroke="#16154F" strokeWidth="3" strokeLinecap="round" opacity=".5" />
        <path d="M58 152 h70" stroke="#16154F" strokeWidth="3" strokeLinecap="round" opacity=".5" />
        <path d="M58 180 q20 18 48 0" fill="none" stroke="#E39C24" strokeWidth="3" strokeLinecap="round" />
      </g>
      {/* pencil */}
      <g transform="translate(150 150) rotate(-28)">
        <rect x="0" y="0" width="150" height="16" rx="3" fill="#F6C766" />
        <rect x="0" y="0" width="18" height="16" fill="#E39C24" />
        <polygon points="150,0 172,8 150,16" fill="#FDF1D8" />
        <polygon points="165,5.5 172,8 165,10.5" fill="#0C0C3C" />
      </g>
    </svg>
  );
}
function PaperDrawing() {
  const rows = [0, 1, 2, 3];
  return (
    <svg viewBox="0 0 560 420" role="img" aria-label="A class test paper made from the Question Bank">
      <ellipse cx="280" cy="392" rx="200" ry="16" fill="#08082A" opacity=".45" />
      <g transform="translate(150 22) rotate(-3)">
        <rect x="0" y="0" width="270" height="350" rx="8" fill="#FFFDF6" />
        <rect x="0" y="0" width="270" height="54" rx="8" fill="#16154F" />
        <rect x="0" y="46" width="270" height="8" fill="#E39C24" />
        <rect x="20" y="16" width="130" height="10" rx="5" fill="#F6C766" />
        <rect x="20" y="31" width="80" height="7" rx="3.5" fill="#F6C766" opacity=".55" />
        {rows.map((r) => (
          <g key={r} transform={`translate(20 ${76 + r * 66})`}>
            <rect x="0" y="0" width={150 + (r % 2) * 50} height="8" rx="4" fill="#16154F" opacity=".7" />
            {[0, 1, 2, 3].map((c) => (
              <g key={c} transform={`translate(${c * 58} 22)`}>
                <circle cx="8" cy="8" r="7" fill={c === (r + 1) % 4 ? '#2B2A7A' : 'none'} stroke="#2B2A7A" strokeWidth="2" />
                <rect x="20" y="5" width="26" height="6" rx="3" fill="#AEADC9" />
              </g>
            ))}
          </g>
        ))}
      </g>
      {/* stack of question cards behind */}
      <g transform="translate(60 120) rotate(-12)">
        <rect width="110" height="150" rx="8" fill="#FDF1D8" stroke="#F2CF85" strokeWidth="2" />
        <rect x="16" y="20" width="70" height="7" rx="3.5" fill="#C98612" />
        <rect x="16" y="36" width="50" height="6" rx="3" fill="#C98612" opacity=".5" />
      </g>
      {/* gold seal */}
      <g transform="translate(410 268)">
        <circle r="46" fill="#E39C24" />
        <circle r="36" fill="none" stroke="#FFFDF6" strokeWidth="3" strokeDasharray="4 5" />
        <path d="M-16 0 l10 11 l22 -24" fill="none" stroke="#0C0C3C" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}


function fmtDate(d) {
  if (!d) return '';
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Icon({ name }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'pencil') return <svg {...p}><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></svg>;
  if (name === 'check') return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.5 2.5 5-6" /></svg>;
  if (name === 'bell') return <svg {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
  if (name === 'card') return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h6M7 13h10M7 17h4" /></svg>;
  if (name === 'bank') return <svg {...p}><path d="M3 9l9-5 9 5" /><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" /></svg>;
  if (name === 'book') return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5M8 7h7" /></svg>;
  if (name === 'shield') return <svg {...p}><path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>;
  if (name === 'user') return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>;
  return null;
}

function Polaroid({ s, eager }) {
  const { pic } = s;
  return (
    <a href={s.href} className="ix-pola" tabIndex={-1}>
      <span className={pic.kind === 'img' ? 'ix-pola-pic' : 'ix-pola-pic draw'}>
        {pic.kind === 'img'
          ? <img src={pic.src} alt={pic.alt} loading={eager ? 'eager' : 'lazy'} />
          : pic.kind === 'books' ? <BooksDrawing /> : <PaperDrawing />}
      </span>
      <span className="ix-pola-cap">{s.caption}</span>
    </a>
  );
}

export default function HomePage() {
  const [open, setOpen] = useState(-1);          // which menu panel is open (desktop)
  const [mob, setMob] = useState(false);         // phone menu
  const [solid, setSolid] = useState(false);     // header turns solid after scrolling
  const [news, setNews] = useState(null);
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [still, setStill] = useState(false);
  const [whyI, setWhyI] = useState(0);         // which 'Why choose' tab is open
  const [colI, setColI] = useState(0);         // which class column is open
  const [lb, setLb] = useState(null);          // event picture opened full size
  const lfRef = useRef(null);
  const timer = useRef(null);
  const headRef = useRef(null);

  useEffect(() => {
    let live = true;
    supabase.from('public_notices').select('id, title, notice_date, is_pinned')
      .eq('is_visible', true)
      .order('is_pinned', { ascending: false })
      .order('notice_date', { ascending: false })
      .limit(4)
      .then(({ data }) => { if (live) setNews(data || []); }, () => { if (live) setNews([]); });
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setStill(mq.matches);
      const on = (e) => setStill(e.matches);
      mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    } catch {}
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(-1); setMob(false); setLb(null); } };
    const onDoc = (e) => { if (headRef.current && !headRef.current.contains(e.target)) setOpen(-1); };
    document.addEventListener('keydown', onKey); document.addEventListener('click', onDoc);
    return () => { live = false; window.removeEventListener('scroll', onScroll); document.removeEventListener('keydown', onKey); document.removeEventListener('click', onDoc); };
  }, []);

  const go = useCallback((n) => setCur((n + SLIDES.length) % SLIDES.length), []);
  const running = !paused && !hold && !still;
  useEffect(() => {
    clearTimeout(timer.current);
    if (running) timer.current = setTimeout(() => go(cur + 1), SLIDE_MS);
    return () => clearTimeout(timer.current);
  }, [cur, running, go]);

  const items = news && news.length ? news : NEWS_DEFAULT;

  return (
    <div className="hp" style={{ '--pattern': PATTERN, '--pattern-dark': PATTERN_DARK }}>
      <style>{CSS}</style>
      <a href="#main" className="hp-skip">Skip to content</a>

      {/* ── Header over the slideshow ── */}
      <header ref={headRef} className={`ix-head${solid ? ' solid' : ''}${open >= 0 ? ' menu-open' : ''}`} onMouseLeave={() => setOpen(-1)}>
        <Link href="/" className="ix-badge" aria-label="Centre of Excellence Sialkot (Boys), home">
          <img src="/logo.png" alt="" width="150" height="150" />
        </Link>
        <div className="ix-rows">
          <div className="ix-util">
            <span className="ix-name">Centre of Excellence Sialkot <b>(Boys)</b></span>
            <nav aria-label="Quick links">
              <Link href="/student-resources">Student resources</Link>
              <Link href="/notice-board">Notice board</Link>
              <Link href="/login" className="ix-sign"><Icon name="user" />Sign in</Link>
            </nav>
          </div>
          <nav className="ix-nav" aria-label="Main">
            {MENU.map((m, i) => m.href ? (
              <a key={m.label} href={m.href} className="ix-top" onMouseEnter={() => setOpen(-1)}>{m.label}</a>
            ) : (
              <button
                key={m.label} type="button" className={open === i ? 'ix-top on' : 'ix-top'}
                aria-expanded={open === i} aria-controls={`ix-panel-${i}`}
                onMouseEnter={() => setOpen(i)} onClick={(e) => { e.stopPropagation(); setOpen(open === i ? -1 : i); }}
              >{m.label}</button>
            ))}
            <a href="/practice-tests-2026.html" className="ix-cta">Start practising</a>
          </nav>
        </div>
        <button type="button" className="ix-burger" aria-label="Menu" aria-expanded={mob} onClick={() => setMob(true)}><span /><span /><span /></button>

        {/* full-width menu panels */}
        {MENU.map((m, i) => !m.href && (
          <div key={m.label} id={`ix-panel-${i}`} className={open === i ? 'ix-panel on' : 'ix-panel'} hidden={open !== i}>
            <div className="ix-panel-in">
              <div className="ix-panel-intro"><h2>{m.label}</h2><p>{m.intro}</p></div>
              <ul>
                {m.links.map((l) => (
                  <li key={l.href + l.title}><a href={l.href}><b>{l.title}</b><span>{l.text}</span></a></li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </header>

      {/* phone menu */}
      <div className={mob ? 'ix-mob on' : 'ix-mob'} hidden={!mob} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="ix-mob-top">
          <img src="/logo.png" alt="" width="54" height="54" />
          <button type="button" aria-label="Close menu" onClick={() => setMob(false)}>×</button>
        </div>
        {MENU.map((m) => m.href ? (
          <a key={m.label} href={m.href} className="ix-mob-link" onClick={() => setMob(false)}>{m.label}</a>
        ) : (
          <details key={m.label}>
            <summary>{m.label}</summary>
            {m.links.map((l) => <a key={l.href + l.title} href={l.href} onClick={() => setMob(false)}>{l.title}</a>)}
          </details>
        ))}
        <Link href="/login" className="ix-mob-sign" onClick={() => setMob(false)}>Sign in</Link>
      </div>

      {/* ── Slideshow ── */}
      <section
        className="ix-hero" aria-roledescription="carousel" aria-label="Centre of Excellence Sialkot"
        onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
        onFocus={() => setHold(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHold(false); }}
      >
        {SLIDES.map((s, i) => (
          <div key={s.id} className={i === cur ? 'ix-bg on' : 'ix-bg'} aria-hidden="true"
            style={{ backgroundImage: `url(${s.photo})` }} />
        ))}
        <div className="ix-shade" aria-hidden="true" />
        <div className="ix-frame" aria-hidden="true" />
        <div className="ix-hero-in">
          <div className="ix-word">
            <span className="ix-kicker">Learn and grow at</span>
            <h1>
              <span className="ix-coe">COE</span>
              <span className="ix-sia">SIALKOT</span>
            </h1>
            <span className="ix-ur" lang="ur" dir="rtl">سینٹر آف ایکسیلینس سیالکوٹ (بوائز)</span>
          </div>
          <div className="ix-polas">
            {SLIDES.map((s, i) => (
              <div key={s.id} className={i === cur ? 'ix-pola-wrap on' : 'ix-pola-wrap'} aria-hidden={i === cur ? undefined : 'true'}
                role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}: ${s.caption}`}>
                <Polaroid s={s} eager={i === 0} />
              </div>
            ))}
          </div>
        </div>
        <p className="ix-motto">Learn. Practise. Excel.</p>
      </section>

      {/* control bar */}
      <div className="ix-ctrl">
        <button type="button" aria-label="Previous slide" onClick={() => go(cur - 1)}>‹</button>
        <div className="ix-dots" role="tablist" aria-label="Choose a slide">
          {SLIDES.map((s, i) => (
            <button key={s.id} type="button" role="tab" aria-selected={i === cur} aria-label={s.caption}
              className={i === cur ? 'on' : ''} onClick={() => go(i)} />
          ))}
        </div>
        <button type="button" aria-label="Next slide" onClick={() => go(cur + 1)}>›</button>
        <button type="button" className="ix-pause" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused(!paused)}>
          {paused || still ? '▶' : '❚❚'}
        </button>
      </div>

      {/* notices strip */}
      <section className="ix-news" aria-label="Latest notices">
        {news === null
          ? [0, 1, 2].map((i) => <div key={i} className="ix-news-item skel" />)
          : items.slice(0, 4).map((n) => (
            <Link key={n.id} href="/notice-board" className="ix-news-item">
              {n.notice_date && <time>{fmtDate(n.notice_date)}</time>}
              <b>{n.is_pinned && <em>Pinned</em>}{n.title}</b>
            </Link>
          ))}
      </section>

      {/* gold quick buttons on the right edge */}
      <nav className="ix-quick" aria-label="Quick access">
        {QUICK.map((q) => (
          <a key={q.href} href={q.href}><Icon name={q.icon} /><span>{q.label}</span></a>
        ))}
      </nav>

      <main id="main">
        {/* ── Why choose: tabs change the colour of the whole section ── */}
        <section className="wy" style={{ '--wy1': WHY[whyI].bg, '--wy2': WHY[whyI].bg2, '--wyh': WHY[whyI].h || '#F6C766', backgroundImage: `${PATTERN}, linear-gradient(120deg, var(--wy1), var(--wy2))` }} aria-labelledby="wy-h">
          <div className="wy-in">
            <div className="wy-head">
              <span className="pill">Why choose</span>
              <h2 id="wy-h" className="giant light">COE Sialkot</h2>
            </div>
            <div className="wy-body" role="tabpanel" id="wy-panel" aria-labelledby={`wy-tab-${whyI}`}>
              <div className="wy-text" key={`t-${whyI}`}>
                <h3>{WHY[whyI].title}</h3>
                <p>{WHY[whyI].text}</p>
              </div>
              <a href={WHY[whyI].href} className="wy-card" key={`c-${whyI}`}>
                <span className="wy-card-side"><Icon name={WHY[whyI].icon} big /><b>{WHY[whyI].label}</b></span>
                <span className="wy-card-pic">
                  {WHY[whyI].pic.kind === 'img' && <img src={WHY[whyI].pic.src} alt={WHY[whyI].pic.alt} loading="lazy" />}
                  {WHY[whyI].pic.kind === 'books' && <BooksDrawing />}
                  {WHY[whyI].pic.kind === 'paperdraw' && <PaperDrawing />}
                  {WHY[whyI].pic.kind === 'logos' && (
                    <span className="wy-logos">{AUTH3.map((a) => <img key={a.name} src={a.src} alt={a.name} />)}</span>
                  )}
                  <span className="wy-more">Open</span>
                </span>
              </a>
            </div>
            <div className="wy-tabs" role="tablist" aria-label="Why choose COE Sialkot">
              <span className="wy-skip" aria-hidden="true">Explore</span>
              <div className="wy-tabs-in">
                {WHY.map((w, i) => (
                  <button key={w.id} id={`wy-tab-${i}`} type="button" role="tab" aria-selected={i === whyI} aria-controls="wy-panel"
                    className={i === whyI ? 'on' : ''} onClick={() => setWhyI(i)}>{w.tab}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Learning at ── */}
        <section className="lr" aria-labelledby="lr-h">
          <div className="lr-top">
            <div>
              <span className="pill">Learning at</span>
              <h2 id="lr-h" className="giant">COE Sialkot</h2>
            </div>
            <div className="lr-copy">
              <p>Every student learns at his own pace. Our aim is to give each boy the practice, feedback and resources that help him do his best in every subject.</p>
              <p>Lessons in class are followed by chapter-wise practice and online tests. Every result is saved, so teachers and parents can see progress across the year and step in early where help is needed.</p>
            </div>
          </div>
          <div className="lr-cols">
            {CLASSES.map((c, i) => (
              <a key={c.n} href={c.href} style={{ '--ph': `url(${c.photo})` }} className={i === colI ? 'lr-col on' : 'lr-col'}
                onMouseEnter={() => setColI(i)} onFocus={() => setColI(i)}>
                <span className="lr-name">Class {c.n}</span>
                <span className="lr-num" aria-hidden="true">{c.n}</span>
                <span className="lr-more">
                  <b>{c.sections} sections</b>
                  <span>{c.note}</span>
                  <span className="lr-subj">{c.subjects.join(' · ')}</span>
                </span>
                <span className="lr-plus" aria-hidden="true">+</span>
                <i className="lr-bar" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        {/* ── Life at COE: school events (like "Panthers of ISKL") ── */}
        <section className="lf" aria-labelledby="lf-h">
          <img className="lf-crest" src="/logo.png" alt="" width="110" height="110" />
          <h2 id="lf-h">Life at <b>COE Sialkot</b></h2>
          <p className="lf-lede">Assemblies, science lessons, celebrations and visits. A look at what our students do every week, shared from the school's own record.</p>
          <div className="lf-row">
            <button type="button" className="lf-arrow" aria-label="Previous events" onClick={() => lfRef.current && lfRef.current.scrollBy({ left: -lfRef.current.clientWidth * 0.9, behavior: 'smooth' })}>‹</button>
            <ul className="lf-track" ref={lfRef}>
              {EVENTS.map((e) => (
                <li key={e.src} className="lf-card">
                  <button type="button" className="lf-frame" onClick={() => setLb(e)} aria-label={`Open picture: ${e.title}`}>
                    <img src={e.src} alt={`${e.title}, ${e.date}`} loading="lazy" />
                    <span className="lf-side" aria-hidden="true">COE SIALKOT</span>
                  </button>
                  <time>{e.date}</time>
                  <h3>{e.title}</h3>
                  <p>{e.text}</p>
                </li>
              ))}
            </ul>
            <button type="button" className="lf-arrow" aria-label="Next events" onClick={() => lfRef.current && lfRef.current.scrollBy({ left: lfRef.current.clientWidth * 0.9, behavior: 'smooth' })}>›</button>
          </div>
        </section>
        {lb && (
          <div className="lb" role="dialog" aria-modal="true" aria-label={lb.title} onClick={() => setLb(null)}>
            <figure onClick={(e) => e.stopPropagation()}>
              <img src={lb.src} alt={`${lb.title}, ${lb.date}`} />
              <figcaption><b>{lb.title}</b> · {lb.date}</figcaption>
            </figure>
            <button type="button" aria-label="Close picture" onClick={() => setLb(null)}>×</button>
          </div>
        )}

        {/* ── At a glance ── */}
        <section className="gl" aria-labelledby="gl-h">
          <div className="gl-in">
            <h2 id="gl-h" className="gl-title"><span className="giant">COE</span><span className="pill big">at a Glance</span></h2>
            <dl className="gl-grid">
              {GLANCE.map((g) => (
                <div key={g.big + g.text} className="gl-item"><dt>{g.big}</dt><dd>{g.text}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Staff ── */}
        <section className="hp-sec hp-paper" id="staff">
          <div className="hp-wrap">
            <div className="hp-head">
              <h2>For staff</h2>
              <p>Teacher and office tools. Most ask for your password.</p>
            </div>
            <ul className="hp-staff">
              {STAFF.map((s) => <li key={s.href}><a href={s.href}><b>{s.title}</b><span>{s.text}</span></a></li>)}
            </ul>
          </div>
        </section>

        {/* ── Authority ── */}
        <section className="au" aria-labelledby="au-h">
          <h2 id="au-h"><b>COE Sialkot</b> under the Government of the Punjab</h2>
          <div className="au-line" aria-hidden="true"><span /></div>
          <ul className="au-list">
            {AUTH3.map((a) => <li key={a.name}><img src={a.src} alt="" width="76" height="76" /><span>{a.name}</span></li>)}
          </ul>
        </section>

        {/* ── Three big buttons ── */}
        <section className="ac" aria-label="Quick links">
          {ACTIONS.map((a) => <a key={a.href} href={a.href}><Icon name={a.icon} big />{a.label}</a>)}
        </section>

        {/* ── Motto band ── */}
        <section className="mb" style={{ backgroundImage: `url(/home/photos/assembly-wide.webp)` }}>
          <p className="mb-motto">Learn. Practise. Excel.</p>
          <span className="mb-pill">Centre of Excellence Sialkot (Boys)</span>
        </section>
      </main>

      {/* ── Footer: white card on navy ── */}
      <footer className="ft" style={{ backgroundImage: `${PATTERN}, linear-gradient(135deg, #16154F, #0C0C3C)` }}>
        <div className="ft-card">
          <div className="ft-top">
            <div className="ft-id">
              <img src="/logo.png" alt="" width="120" height="120" />
              <p>Centre of Excellence<br />Sialkot (Boys)</p>
            </div>
            <div className="ft-right">
              <div className="ft-logos">{AUTHORITIES.map((a) => <img key={a.name} src={a.src} alt={a.name} width="52" height="52" />)}</div>
              <p>Punjab Daanish Schools &amp; Centres of Excellence Authority, Government of the Punjab</p>
              <p className="ft-ur" lang="ur" dir="rtl">سینٹر آف ایکسیلینس سیالکوٹ (بوائز)</p>
            </div>
          </div>
          <nav className="ft-links" aria-label="Footer">
            <a href="/practice-tests-2026.html">Practice tests</a>
            <a href="/online-tests-2026.html">Online Tests</a>
            <a href="/student-resources">Student resources</a>
            <a href="/notice-board">Notice board</a>
            <a href="#staff">Staff</a>
            <Link href="/login">Sign in</Link>
          </nav>
          <p className="ft-credit">Designed and developed by <b>Dr Naim Tahir Baig</b>. © {new Date().getFullYear()} Centre of Excellence Sialkot (Boys)</p>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@600;700&family=Source+Sans+3:wght@400;600;700&family=Caveat:wght@600&display=swap');
@font-face{font-family:COEUrdu;src:url('/fonts/noto-nastaliq-urdu-400.woff2') format('woff2');font-weight:400;font-display:swap}
.hp{--navy:#16154F;--deep:#0C0C3C;--royal:#1F2A86;--gold:#E39C24;--gold2:#F6C766;--red:#C8364A;--paper:#F6F5FA;--ink:#15142E;--moss:#4E4C6B;--line:#DEDCEA;
  min-height:100vh;background:#fff;color:var(--ink);font-family:'Source Sans 3',system-ui,sans-serif;font-size:17px;line-height:1.55}
.hp *{box-sizing:border-box}
.hp h1,.hp h2,.hp h3{font-family:'Josefin Sans','Source Sans 3',sans-serif;font-weight:700;margin:0;letter-spacing:-.01em}
.hp a{color:inherit}
.hp a:focus-visible,.hp button:focus-visible,.hp summary:focus-visible{outline:3px solid var(--gold);outline-offset:3px;border-radius:6px}
.hp-wrap{max-width:1180px;margin:0 auto;padding-left:24px;padding-right:24px}
.hp-skip{position:absolute;left:-999px;top:0;background:var(--gold);color:var(--deep);padding:10px 16px;z-index:200;font-weight:700}
.hp-skip:focus{left:12px;top:12px}

/* ── header over the slideshow ── */
.ix-head{position:fixed;top:0;left:0;right:0;z-index:90;display:flex;align-items:flex-start;justify-content:flex-end;padding:0 40px 0 220px;
  background:linear-gradient(180deg,rgba(12,12,60,.82) 0%,rgba(12,12,60,.35) 70%,rgba(12,12,60,0) 100%);transition:background .3s,box-shadow .3s}
.ix-head.solid,.ix-head.menu-open{background:var(--deep);box-shadow:0 6px 24px rgba(0,0,0,.25)}
.hp .ix-badge{position:absolute;left:40px;top:14px;display:block;border-radius:50%;background:#fff;padding:5px;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all .3s}
.ix-badge img{display:block;width:150px;height:150px;border-radius:50%}
.ix-head.solid .ix-badge{top:8px;padding:3px}
.ix-head.solid .ix-badge img{width:78px;height:78px}
.ix-rows{display:flex;flex-direction:column;align-items:flex-end;padding-top:12px}
.ix-util{display:flex;align-items:center;gap:28px;font-size:15.5px;color:#fff}
.ix-name{font-family:'Josefin Sans',sans-serif;font-weight:700;font-size:16px;opacity:.95}
.ix-name b{color:var(--gold2)}
.ix-util nav{display:flex;align-items:center;gap:22px}
.hp .ix-util a{color:#fff;text-decoration:none;font-weight:600}
.hp .ix-util a:hover{color:var(--gold2)}
.hp .ix-util .ix-sign{display:flex;align-items:center;gap:6px;background:var(--gold);color:var(--deep);padding:6px 14px;border-radius:999px}
.hp .ix-util .ix-sign:hover{background:var(--gold2);color:var(--deep)}
.ix-sign svg{width:18px;height:18px}
.ix-nav{display:flex;align-items:center;gap:6px;margin-top:10px;padding-bottom:12px}
.hp .ix-top{background:none;border:0;color:#fff;font:700 19px 'Josefin Sans',sans-serif;padding:10px 16px 8px;border-radius:8px;cursor:pointer;text-decoration:none}
.hp .ix-top:hover,.hp .ix-top.on{background:var(--royal);color:var(--gold2)}
.hp .ix-cta{margin-left:10px;background:var(--gold);color:var(--deep);font-weight:700;padding:10px 20px;border-radius:10px;text-decoration:none}
.hp .ix-cta:hover{background:var(--gold2)}
.ix-burger{display:none;margin:22px 0 0;background:rgba(255,255,255,.08);border:1.5px solid rgba(255,255,255,.4);border-radius:10px;width:48px;height:44px;padding:11px 12px;cursor:pointer}
.ix-burger span{display:block;height:2px;background:#fff;margin:4px 0;border-radius:2px}

.ix-panel{position:absolute;left:0;right:0;top:100%;background:var(--royal);color:#fff;box-shadow:0 20px 40px rgba(0,0,0,.3)}
.ix-panel[hidden]{display:none}
.ix-panel-in{max-width:1180px;margin:0 auto;padding:40px 24px 48px 240px;display:grid;grid-template-columns:260px 1fr;gap:48px}
.ix-panel-intro h2{font-size:28px;color:var(--gold2);margin-bottom:8px}
.ix-panel-intro p{margin:0;color:#D6D9F2}
.ix-panel ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:6px 36px}
.hp .ix-panel a{display:block;text-decoration:none;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.14)}
.ix-panel a b{display:block;font-size:19px}
.ix-panel a span{color:#C7CBEA;font-size:15px}
.hp .ix-panel a:hover b{color:var(--gold2)}

/* phone menu */
.ix-mob{position:fixed;inset:0;z-index:150;background:var(--deep);color:#fff;padding:16px 20px 30px;overflow:auto}
.ix-mob[hidden]{display:none}
.ix-mob-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.ix-mob-top img{border-radius:50%;background:#fff;padding:2px}
.ix-mob-top button{background:none;border:1.5px solid rgba(255,255,255,.4);color:#fff;font-size:30px;line-height:1;width:46px;height:46px;border-radius:10px;cursor:pointer}
.ix-mob details,.hp .ix-mob-link{display:block;border-bottom:1px solid rgba(255,255,255,.14)}
.ix-mob summary,.hp .ix-mob-link{font:700 21px 'Josefin Sans',sans-serif;padding:16px 4px;cursor:pointer;text-decoration:none;list-style:none}
.ix-mob summary::-webkit-details-marker{display:none}
.ix-mob summary::after{content:"+";float:right;color:var(--gold2)}
.ix-mob details[open] summary::after{content:"–"}
.hp .ix-mob details a{display:block;padding:10px 12px;color:#D6D9F2;text-decoration:none}
.hp .ix-mob-sign{display:block;margin-top:22px;text-align:center;background:var(--gold);color:var(--deep);font-weight:700;padding:14px;border-radius:12px;text-decoration:none}

/* ── slideshow ── */
.ix-hero{position:relative;height:min(92vh,880px);min-height:640px;overflow:hidden;background:var(--deep);color:#fff}
.ix-bg{position:absolute;inset:-40px;background:radial-gradient(ellipse at 70% 40%,#2B2A7A,var(--deep) 70%) center/cover no-repeat;opacity:0;transition:opacity 1s ease;filter:blur(1.5px) saturate(1.05) brightness(.62);transform:scale(1.04)}
.ix-bg.on{opacity:1}
.ix-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(12,12,60,.85) 0%,rgba(12,12,60,.45) 55%,rgba(12,12,60,.25) 100%),linear-gradient(0deg,rgba(12,12,60,.85) 0%,rgba(12,12,60,0) 40%)}
.ix-frame{position:absolute;left:5%;right:5%;top:150px;bottom:110px;border:8px solid var(--gold);opacity:.85;pointer-events:none}
.ix-hero-in{position:relative;z-index:2;height:100%;max-width:1320px;margin:0 auto;padding:180px 6% 170px 8%;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px}
.ix-word{align-self:center;margin-top:-40px}
.ix-kicker{display:block;font:700 clamp(22px,2.6vw,38px)/1 'Josefin Sans',sans-serif;color:#E9E8F6;text-transform:uppercase;letter-spacing:.02em;margin-bottom:22px}
.ix-word h1{line-height:.86;letter-spacing:-.01em}
.ix-coe{display:block;font-size:clamp(84px,13vw,200px);color:var(--royal);-webkit-text-stroke:3px #fff;paint-order:stroke fill;text-shadow:0 10px 40px rgba(0,0,0,.35)}
.ix-sia{display:block;font-size:clamp(54px,8.2vw,128px);color:var(--gold);-webkit-text-stroke:2px #fff;paint-order:stroke fill;text-shadow:0 10px 40px rgba(0,0,0,.35)}
.ix-ur{display:block;margin-top:14px;font-family:COEUrdu,'Noto Nastaliq Urdu',serif;font-size:clamp(18px,1.8vw,26px);line-height:2;color:var(--gold2);text-align:left}
.ix-polas{position:relative;height:100%;max-height:480px}
.ix-pola-wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transform:translateX(40px) rotate(8deg);transition:opacity .8s ease,transform .8s ease,visibility 0s linear .8s}
.ix-pola-wrap.on{opacity:1;visibility:visible;transform:none;transition:opacity .8s ease,transform .8s ease}
.hp .ix-pola{display:block;width:min(480px,100%);background:#fff;padding:14px 14px 0;border-radius:4px;transform:rotate(4deg);box-shadow:0 30px 70px rgba(0,0,0,.5);text-decoration:none;color:var(--navy)}
.ix-pola-pic{display:block;aspect-ratio:16/10;overflow:hidden;background:var(--deep)}
.ix-pola-pic img{display:block;width:100%;height:100%;object-fit:cover;object-position:top}
.ix-pola-pic.draw{display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,#2B2A7A,var(--deep))}
.ix-pola-pic.draw svg{width:86%;height:auto}
.ix-pola-cap{display:block;font:600 clamp(26px,2.6vw,36px)/1.1 'Caveat',cursive;color:var(--royal);padding:14px 8px 16px;text-align:center}
.ix-motto{position:absolute;z-index:3;left:0;right:0;bottom:24px;margin:0;text-align:center;font:700 clamp(46px,8vw,132px)/1 'Josefin Sans',sans-serif;letter-spacing:-.02em;color:#fff;text-shadow:0 8px 40px rgba(0,0,0,.45)}

/* control bar + notices strip */
.ix-ctrl{background:var(--deep);display:flex;justify-content:center;align-items:center;gap:18px;padding:18px 20px;position:relative}
.ix-ctrl>button{width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,.7);background:transparent;color:#fff;font-size:26px;line-height:1;cursor:pointer}
.ix-ctrl>button:hover{border-color:var(--gold2);color:var(--gold2)}
.ix-ctrl .ix-pause{position:absolute;right:28px;top:50%;margin-top:-22px;width:44px;height:44px;border:0;background:var(--royal);font-size:13px;letter-spacing:-2px}
.ix-dots{display:flex;gap:10px}
.ix-dots button{width:12px;height:12px;border-radius:50%;border:2px solid rgba(255,255,255,.75);background:transparent;padding:0;cursor:pointer}
.ix-dots button.on{background:var(--gold);border-color:var(--gold)}
.ix-news{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));background:var(--navy);border-top:1px solid rgba(255,255,255,.1)}
.hp .ix-news-item{display:block;color:#fff;text-decoration:none;padding:24px 30px 26px;border-right:1px solid rgba(255,255,255,.12)}
.ix-news-item:last-child{border-right:0}
.ix-news-item time{display:block;color:var(--gold2);font-size:14px;margin-bottom:4px}
.ix-news-item b{font:700 21px/1.25 'Josefin Sans',sans-serif}
.ix-news-item em{font-style:normal;font-family:'Source Sans 3',sans-serif;font-size:13px;background:var(--red);border-radius:6px;padding:2px 8px;margin-right:8px;vertical-align:3px}
.hp .ix-news-item:hover b{color:var(--gold2)}
.ix-news-item.skel{min-height:96px;background:linear-gradient(90deg,#1B1A5C,#22216A,#1B1A5C)}

/* gold quick buttons */
.ix-quick{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:80;display:flex;flex-direction:column;gap:8px}
.hp .ix-quick a{display:flex;align-items:center;gap:10px;background:var(--gold);color:var(--deep);text-decoration:none;font-weight:700;height:56px;padding:0 16px 0 17px;border-radius:30px 0 0 30px;box-shadow:0 6px 16px rgba(0,0,0,.2);transform:translateX(calc(100% - 56px));transition:transform .25s ease}
.ix-quick a span{white-space:nowrap;opacity:0;transition:opacity .2s}
.hp .ix-quick a:hover span,.hp .ix-quick a:focus-visible span{opacity:1}
.hp .ix-quick a:hover,.hp .ix-quick a:focus-visible{transform:none;background:var(--gold2)}

/* lower sections */
.hp-sec{padding:64px 0}
.hp-sec h2{font-size:32px;color:var(--navy);margin-bottom:24px}
.hp-paper{background:var(--paper);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.hp-head{display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap}
.hp-head p{margin:0 0 24px;color:var(--moss)}
.hp-main2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.hp-feature{display:flex;flex-direction:column;text-decoration:none;border-radius:16px;padding:30px 30px 28px;min-height:250px}
.hp-feature.gold{background:#FDF1D8;border:1.5px solid #F2CF85}
.hp .hp-feature.green{background:var(--navy);color:#fff;border:1.5px solid var(--navy)}
.hp-note{align-self:flex-start;font-size:14px;font-weight:700;padding:4px 12px;border-radius:999px;background:var(--navy);color:#fff}
.hp-feature.green .hp-note{background:var(--gold);color:var(--deep)}
.hp-feature h3{font-size:30px;margin:16px 0 8px}
.hp-feature p{margin:0 0 22px;max-width:34em;color:var(--moss)}
.hp-feature.green p{color:#D9D8EE}
.hp-go{margin-top:auto;align-self:flex-start;font-weight:700;padding:10px 20px;border-radius:9px;background:var(--navy);color:#fff}
.hp-feature.green .hp-go{background:var(--gold);color:var(--deep)}
.hp-feature:hover .hp-go{text-decoration:underline;text-underline-offset:3px}
.hp-more{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px}
.hp-small{display:block;text-decoration:none;border:1.5px solid var(--line);border-radius:14px;padding:20px 22px;background:#fff}
.hp-small:hover{border-color:var(--gold)}
.hp-small h3{font-size:20px;color:var(--navy);margin-bottom:4px}
.hp-small p{margin:0;color:var(--moss);font-size:16px}
.hp-staff{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;column-gap:40px;border-top:1px solid var(--line)}
.hp-staff li{border-bottom:1px solid var(--line)}
.hp-staff a{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:14px 4px;text-decoration:none}
.hp-staff b{color:var(--navy);font-size:17px}
.hp-staff span{color:var(--moss);font-size:15px;text-align:right}
.hp-staff a:hover b{text-decoration:underline;text-underline-offset:3px}
.hp-foot{background:var(--deep);color:#C5C4DC;padding:40px 0 28px;border-top:3px solid var(--gold)}
.hp-foot-in{display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center}
.hp-foot-id{display:flex;align-items:center;gap:16px}
.hp-foot-id img{border-radius:50%}
.hp-foot-id b{display:block;color:#fff;font-family:'Josefin Sans',sans-serif;font-size:19px}
.hp-foot-id span{font-size:15px}
.hp-foot-logos{display:flex;gap:10px}
.hp-foot-logos img{border-radius:50%;background:#fff}
.hp-foot-links{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px 22px}
.hp .hp-foot-links a{color:#fff;font-weight:600;text-decoration:none}
.hp .hp-foot-links a:hover{color:var(--gold2)}
.hp-credit{grid-column:1/-1;margin:0;font-size:14px;border-top:1px solid rgba(255,255,255,.12);padding-top:18px}
.hp-credit b{color:var(--gold2)}

@media (prefers-reduced-motion:reduce){
  .ix-bg,.ix-pola-wrap,.ix-pola-wrap.on,.ix-head,.ix-badge,.hp .ix-quick a{transition:none}
}

/* laptops */
@media (max-width:1240px){
  .ix-name{display:none}
  .hp .ix-top{font-size:17px;padding:10px 12px 8px}
  .ix-head{padding-left:200px;padding-right:24px}
  .hp .ix-badge{left:24px}
  .ix-badge img{width:128px;height:128px}
  .ix-panel-in{padding-left:24px;grid-template-columns:220px 1fr}
}
/* tablets and phones */
@media (max-width:1000px){
  .ix-rows{display:none}
  .ix-burger{display:block}
  .ix-head{padding-left:24px;min-height:84px}
  .ix-badge img{width:96px;height:96px}
  .ix-head.solid .ix-badge img{width:60px;height:60px}
  .ix-hero{height:auto;min-height:0}
  .ix-hero-in{grid-template-columns:1fr;padding:140px 24px 150px;gap:24px;height:auto}
  .ix-word{margin-top:0}
  .ix-polas{height:auto;max-height:none;margin:0;display:grid}
  .ix-pola-wrap{position:relative;inset:auto;grid-area:1/1}
  .hp .ix-pola{width:min(460px,92%)}
  .ix-frame{top:120px;bottom:100px;left:12px;right:12px;border-width:5px}
  .hp-main2,.hp-more,.hp-staff{grid-template-columns:1fr}
  .hp-staff a{flex-direction:column;gap:2px}
  .hp-staff span{text-align:left}
  .hp-foot-in{grid-template-columns:1fr}
  .hp-sec{padding:48px 0}
}
@media (max-width:560px){
  .hp-wrap{padding-left:16px;padding-right:16px}
  .ix-head{padding-left:16px;padding-right:16px;min-height:72px}
  .hp .ix-badge{left:16px;top:10px}
  .ix-badge img{width:76px;height:76px}
  .ix-burger{margin-top:16px}
  .ix-hero-in{padding:112px 20px 178px}
  .ix-frame,.ix-quick{display:none}
  .ix-motto{font-size:44px;bottom:30px;padding:0 16px}
  .ix-coe{-webkit-text-stroke:2px #fff}
  .ix-ctrl>button{width:44px;height:44px;font-size:22px}
  .ix-ctrl .ix-pause{right:12px;width:38px;height:38px;margin-top:-19px}
  .hp .ix-news-item{padding:18px 20px;border-right:0;border-bottom:1px solid rgba(255,255,255,.12)}
  .ix-news-item b{font-size:18px}
  .hp .ix-quick a{height:48px;padding-left:13px;transform:translateX(calc(100% - 48px))}
  .hp-feature{padding:24px 22px;min-height:0}
  .hp-feature h3{font-size:26px}
}

/* ══ shared: gold label + giant name ══ */
.pill{display:inline-block;background:var(--gold);color:var(--deep);font:700 clamp(28px,3.4vw,52px)/1.1 'Josefin Sans',sans-serif;padding:8px 18px 4px;border-radius:12px}
.pill.big{font-size:clamp(34px,4.4vw,66px);padding:10px 22px 6px}
.giant{display:block;font:700 clamp(64px,10.5vw,170px)/.9 'Josefin Sans',sans-serif !important;letter-spacing:-.03em !important;color:var(--navy);margin-top:12px !important}
.giant.light{color:#fff}

/* ══ Why choose ══ */
.wy{position:relative;color:#fff;background-size:120px 120px,cover;background-blend-mode:soft-light,normal;transition:background-color .6s}
.wy::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,var(--wy1),var(--wy2));opacity:.88;transition:opacity .6s}
.wy-in{position:relative;max-width:1280px;margin:0 auto;padding:90px 6% 50px}
.wy-head .pill{transform:rotate(-1deg)}
.wy-body{display:grid;grid-template-columns:1fr 1.15fr;gap:60px;align-items:center;margin:56px 0 64px;min-height:400px}
.wy-text h3{font-size:clamp(34px,3.8vw,56px);color:var(--wyh,var(--gold2));line-height:1.08;margin-bottom:22px}
.wy-text p{font-size:20px;line-height:1.7;color:#F1F0FA;max-width:30em;margin:0}
.wy-text,.wy-card{animation:wyIn .6s ease both}
@keyframes wyIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.hp .wy-card{display:grid;grid-template-columns:170px 1fr;border-radius:22px;overflow:hidden;min-height:400px;text-decoration:none;color:#fff;box-shadow:0 30px 60px rgba(0,0,0,.35)}
.wy-card-side{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:var(--wy2);text-align:center;padding:14px}
.wy-card-side b{font:700 17px/1.15 'Josefin Sans',sans-serif;letter-spacing:.02em}
.wy-card-side svg{width:64px;height:64px}
.wy-card-pic{position:relative;display:block;background:#0C0C3C;overflow:hidden}
.wy-card-pic img,.wy-card-pic svg{display:block;width:100%;height:100%;object-fit:contain;object-position:center}
.wy-card-pic img{padding:18px}
.wy-card-pic svg{object-fit:contain;padding:20px}

.wy-more{position:absolute;z-index:2;right:18px;bottom:18px;background:var(--gold);color:var(--deep);font:700 15px 'Source Sans 3',sans-serif;letter-spacing:.18em;text-transform:uppercase;white-space:nowrap;padding:9px 16px;border-radius:999px;box-shadow:0 6px 16px rgba(0,0,0,.3)}
.wy-more::after{content:"";display:inline-block;width:22px;height:2px;background:var(--deep);margin-left:10px;vertical-align:middle}
.hp .wy-card:hover .wy-more{background:var(--gold2)}
.wy-logos{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:22px;background:radial-gradient(circle,#2B2A7A,#0C0C3C)}
.wy-logos img{width:min(26%,120px);height:auto;border-radius:50%;object-fit:contain;padding:0;background:#fff;position:static}
.wy-tabs{display:flex;align-items:center;gap:22px}
.wy-skip{writing-mode:vertical-rl;transform:rotate(180deg);font:600 15px 'Source Sans 3',sans-serif;letter-spacing:.3em;text-transform:uppercase;opacity:.8}
.wy-tabs-in{flex:1;display:grid;grid-template-columns:repeat(6,1fr);background:rgba(255,255,255,.18);padding:8px;border-radius:18px}
.wy-tabs-in button{background:rgba(255,255,255,.88);color:var(--navy);border:0;font:700 16.5px/1.3 'Source Sans 3',sans-serif;padding:20px 14px;cursor:pointer}
.wy-tabs-in button:first-child{border-radius:12px 0 0 12px}
.wy-tabs-in button:last-child{border-radius:0 12px 12px 0}
.wy-tabs-in button:hover{background:#fff}
.wy-tabs-in button.on{background:var(--gold);color:var(--deep)}

/* ══ Learning at ══ */
.lr{background:#fff;position:relative}
.lr-top{max-width:1280px;margin:0 auto;padding:100px 6% 70px;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.lr-copy p{font-size:19px;line-height:1.8;color:var(--moss);margin:0 0 20px}
.lr-cols{display:flex;height:560px;gap:6px;padding:0 6px}
.hp .lr-col{position:relative;flex:1;overflow:hidden;text-decoration:none;color:#fff;transition:flex .5s ease;background:var(--deep)}
.lr-col:nth-child(1){background:linear-gradient(160deg,#C98612,#7A5410)}
.lr-col:nth-child(2){background:linear-gradient(160deg,#1F2A86,#0C0C3C)}
.lr-col:nth-child(3){background:linear-gradient(160deg,#2C7A8A,#123F4A)}
.lr-col:nth-child(4){background:linear-gradient(160deg,#8E2638,#4A1424)}
.lr-col:nth-child(5){background:linear-gradient(160deg,#3C4A9A,#1E2550)}
.lr-col::before{content:"";position:absolute;inset:0;background:var(--ph) center/cover no-repeat;opacity:.55;mix-blend-mode:luminosity;transition:opacity .5s}
.lr-col.on::before{opacity:.75}
.lr-col::after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(12,12,60,.85),rgba(12,12,60,.1) 55%)}
.lr-name,.lr-num,.lr-more,.lr-plus,.lr-bar{z-index:2}
.lr-col.on{flex:2.6}
.lr-name{position:absolute;top:34px;left:0;right:0;text-align:center;font:700 clamp(24px,2.4vw,36px) 'Josefin Sans',sans-serif}
.lr-num{position:absolute;right:-10px;bottom:-40px;font:700 330px/1 'Josefin Sans',sans-serif;color:transparent;-webkit-text-stroke:2px rgba(255,255,255,.28);letter-spacing:-.05em}
.lr-more{position:absolute;left:34px;right:34px;bottom:96px;display:flex;flex-direction:column;gap:6px;opacity:0;transform:translateY(12px);transition:opacity .35s,transform .35s}
.lr-col.on .lr-more{opacity:1;transform:none;transition-delay:.15s}
.lr-more b{font:700 30px 'Josefin Sans',sans-serif;color:var(--gold2)}
.lr-more span{font-size:18px}
.lr-subj{color:#E1E0F2;font-size:15.5px !important;max-width:30em}
.lr-plus{position:absolute;left:50%;top:50%;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;background:var(--navy);color:#fff;font:400 54px/76px 'Source Sans 3',sans-serif;text-align:center;opacity:0;transition:opacity .3s}
.lr-col.on .lr-plus{opacity:1;top:38%}
.lr-bar{position:absolute;left:50%;bottom:30px;width:64px;height:5px;margin-left:-32px;background:var(--gold);border-radius:3px}

/* ══ At a glance ══ */
.gl{background:#fff;position:relative;overflow:hidden}
.gl::before{content:"";position:absolute;inset:0;background:var(--pattern-dark) 0 0/160px 160px;opacity:.035}
.gl-in{position:relative;max-width:1180px;margin:0 auto;padding:110px 6% 90px}
.gl-title{display:flex;align-items:flex-start;flex-wrap:wrap;gap:6px 18px;margin-bottom:70px !important}
.gl-title .giant{margin-top:0 !important}
.gl-title .pill{margin-top:clamp(10px,2vw,40px)}
.gl-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:60px;margin:0}
.gl-item{display:flex;align-items:center;gap:36px;padding:44px 6px;border-bottom:1.5px solid var(--line)}
.gl-item dt{flex:none;min-width:2.6em;font:700 clamp(46px,5vw,72px)/1 'Josefin Sans',sans-serif;color:var(--royal)}
.gl-item dd{margin:0;font-size:22px;line-height:1.5;color:var(--ink)}

/* ══ Authority ══ */
.au{padding:80px 6% 90px;text-align:center;background:#fff;border-top:1px solid var(--line)}
.au h2{font:400 clamp(28px,3.4vw,46px)/1.2 'Josefin Sans',sans-serif !important;color:var(--navy)}
.au h2 b{font-weight:700}
.au-line{position:relative;max-width:1000px;margin:40px auto 50px;height:2px;background:var(--line)}
.au-line span{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:var(--royal);box-shadow:0 0 0 8px #fff}
.au-list{list-style:none;margin:0 auto;padding:0;max-width:1100px;display:grid;grid-template-columns:repeat(3,1fr);gap:30px}
.au-list li{display:flex;align-items:center;gap:16px;text-align:left;font-size:17px;color:var(--moss)}
.au-list img{flex:none;border-radius:50%;box-shadow:0 0 0 1px var(--line)}

/* ══ Three big buttons ══ */
.ac{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;max-width:1240px;margin:0 auto;padding:30px 6% 80px;background:#fff}
.hp .ac a{display:flex;align-items:center;justify-content:center;gap:14px;border:2.5px solid #C9C7E6;border-radius:12px;padding:30px 20px;text-decoration:none;color:var(--royal);font:700 30px 'Josefin Sans',sans-serif;text-transform:uppercase;letter-spacing:.02em;transition:all .25s}
.ac a svg{width:40px;height:40px}
.hp .ac a:hover{background:var(--royal);border-color:var(--royal);color:#fff}

/* ══ Motto band ══ */
.mb{position:relative;padding:150px 6% 130px;text-align:center;background:#0C0C3C center/cover no-repeat;overflow:hidden}
.mb::before{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(12,12,60,.75),rgba(12,12,60,.35));backdrop-filter:blur(1px)}
.mb-motto{position:relative;margin:0;font:700 clamp(54px,9vw,150px)/1 'Josefin Sans',sans-serif;letter-spacing:-.03em;color:#fff}
.mb-pill{position:relative;display:inline-block;margin-top:-6px;background:var(--gold);color:var(--deep);font:700 clamp(20px,2.2vw,32px) 'Josefin Sans',sans-serif;padding:14px 60px 10px;border-radius:12px}

/* ══ Footer ══ */
.ft{padding:60px 2.5% 50px;background-size:120px 120px,cover;background-blend-mode:soft-light,normal}
.ft-card{max-width:1600px;margin:0 auto;background:#fff;border-radius:34px;padding:56px 6% 40px;color:var(--ink)}
.ft-top{display:flex;justify-content:space-between;gap:40px;flex-wrap:wrap;padding-bottom:36px;border-bottom:1.5px solid var(--line)}
.ft-id{display:flex;flex-direction:column;gap:12px}
.ft-id img{border-radius:50%}
.ft-id p{margin:0;font:400 clamp(26px,2.6vw,38px)/1.15 Georgia,'Times New Roman',serif;letter-spacing:.02em;text-transform:uppercase;color:var(--deep)}
.ft-right{display:flex;flex-direction:column;align-items:flex-end;gap:12px;text-align:right;max-width:560px}
.ft-right p{margin:0;font-size:18px;color:var(--moss)}
.ft-logos{display:flex;gap:12px}
.ft-logos img{border-radius:50%;box-shadow:0 0 0 1px var(--line)}
.ft-ur{font-family:COEUrdu,'Noto Nastaliq Urdu',serif;font-size:20px !important;line-height:2}
.ft-links{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px 0;padding:26px 0 10px}
.hp .ft-links a{font-size:18px;color:var(--ink);text-decoration:none;padding:0 18px;border-left:1.5px solid var(--line)}
.hp .ft-links a:first-child{border-left:0}
.hp .ft-links a:hover{color:var(--royal);text-decoration:underline}
.ft-credit{margin:8px 0 0;text-align:right;font-size:16px;color:var(--moss)}
.ft-credit b{color:var(--royal)}

/* ══ small screens ══ */
@media (max-width:1000px){
  .wy-body{grid-template-columns:1fr;gap:34px;min-height:0;margin:40px 0}
  .hp .wy-card{grid-template-columns:110px 1fr;min-height:300px}
  .wy-card-side svg{width:44px;height:44px}
  .wy-card-side b{font-size:13px}
  .wy-tabs-in{grid-template-columns:repeat(3,1fr);gap:6px;background:none;padding:0}
  .wy-tabs-in button{border-radius:10px !important;padding:14px 10px;font-size:15px}
  .wy-skip{display:none}
  .lr-top{grid-template-columns:1fr;gap:20px;padding:70px 24px 40px}
  .lr-cols{flex-direction:column;height:auto}
  .hp .lr-col{flex:none;height:120px;transition:height .45s ease}
  .lr-col.on{height:330px}
  .lr-name{top:22px;text-align:left;left:24px}
  .lr-num{font-size:220px;bottom:-30px}
  .lr-more{left:24px;right:24px;bottom:30px}
  .lr-plus,.lr-bar{display:none}
  .gl-grid{grid-template-columns:1fr}
  .gl-item{padding:28px 4px;gap:24px}
  .gl-item dd{font-size:19px}
  .au-list{grid-template-columns:1fr;max-width:460px}
  .ac{grid-template-columns:1fr;gap:16px}
  .hp .ac a{font-size:24px;padding:22px}
  .ft-right{align-items:flex-start;text-align:left}
  .ft-links{justify-content:flex-start}
  .hp .ft-links a{padding:0 12px 0 0;margin-right:12px;border-left:0}
  .ft-credit{text-align:left}
}
@media (max-width:560px){
  .wy-in{padding:64px 20px 40px}
  .wy-text p{font-size:17px}
  .wy-tabs-in{grid-template-columns:repeat(2,1fr)}
  .hp .wy-card{grid-template-columns:1fr;grid-template-rows:auto 220px}
  .wy-card-side{flex-direction:row;padding:14px}
  .wy-more{font-size:16px}
  .gl-in{padding:70px 20px 60px}
  .gl-item dt{min-width:2.4em}
  .mb{padding:90px 20px}
  .ft-card{border-radius:22px;padding:36px 22px 28px}
}
@media (prefers-reduced-motion:reduce){
  .wy-text,.wy-card{animation:none}
  .hp .lr-col,.lr-more,.lr-plus{transition:none}
}

/* ══ Life at COE ══ */
.lf{position:relative;background:#fff;padding:90px 0 80px;text-align:center;overflow:hidden}
.lf::before{content:"";position:absolute;inset:0;background:var(--pattern-dark) 0 0/160px 160px;opacity:.03}
.lf>*{position:relative}
.lf-crest{display:block;margin:0 auto 18px;border-radius:50%}
.lf h2{font:400 clamp(40px,5.4vw,78px)/1.05 'Josefin Sans',sans-serif !important;color:var(--royal)}
.lf h2 b{font-weight:700;color:var(--navy)}
.lf-lede{max-width:40em;margin:22px auto 50px;padding:0 24px;font-size:19px;line-height:1.75;color:var(--moss)}
.lf-row{display:flex;align-items:center;gap:16px;max-width:1340px;margin:0 auto;padding:0 2%}
.lf-arrow{flex:none;width:60px;height:60px;border-radius:50%;border:2px solid var(--ink);background:#fff;color:var(--ink);font-size:30px;line-height:1;cursor:pointer}
.lf-arrow:hover{background:var(--navy);color:#fff;border-color:var(--navy)}
.lf-track{flex:1;display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 60px)/3);gap:30px;overflow-x:auto;scroll-snap-type:x mandatory;list-style:none;margin:0;padding:10px 4px 20px;scrollbar-width:none}
.lf-track::-webkit-scrollbar{display:none}
.lf-card{scroll-snap-align:start;text-align:center}
.lf-frame{position:relative;display:block;width:100%;aspect-ratio:4/5;padding:12px;background:#fff;border:9px solid var(--royal);cursor:zoom-in;overflow:hidden}
.lf-frame img{display:block;width:100%;height:100%;object-fit:cover;object-position:top;transition:transform .5s}
.lf-frame:hover img{transform:scale(1.04)}
.lf-side{position:absolute;right:-2px;top:22px;writing-mode:vertical-rl;background:#fff;color:var(--gold);font:700 14px 'Josefin Sans',sans-serif;letter-spacing:.12em;padding:8px 3px}
.lf-card time{display:block;margin-top:18px;color:var(--gold);font-weight:700;font-size:15px}
.lf-card h3{font-size:clamp(22px,2vw,28px);color:var(--royal);margin:4px 0 8px}
.lf-card p{margin:0 auto;max-width:24em;color:var(--moss);font-size:16.5px;line-height:1.6}
.lb{position:fixed;inset:0;z-index:300;background:rgba(8,8,40,.92);display:flex;align-items:center;justify-content:center;padding:24px}
.lb figure{margin:0;max-width:min(92vw,820px);max-height:92vh;display:flex;flex-direction:column;align-items:center}
.lb img{max-width:100%;max-height:84vh;object-fit:contain;border-radius:6px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.lb figcaption{color:#fff;margin-top:12px;font-size:17px}
.lb>button{position:absolute;top:18px;right:20px;width:50px;height:50px;border-radius:50%;border:2px solid rgba(255,255,255,.6);background:none;color:#fff;font-size:32px;line-height:1;cursor:pointer}
@media (max-width:1000px){.lf-track{grid-auto-columns:calc((100% - 30px)/2)}}
@media (max-width:560px){.lf-arrow{display:none}.lf-track{grid-auto-columns:82%;gap:18px}.lf{padding:64px 0 56px}.lf-row{padding:0 16px}}
`;
