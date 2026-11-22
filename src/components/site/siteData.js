// Shared site navigation: used by the header on every page (SiteChrome.js).
// The plain .html pages use public/site-chrome.js, which carries a copy of the same lists.

export const MENU = [
  {
    label: 'Students',
    intro: 'Everything a student needs: practise, take tests and revise.',
    links: [
      { href: '/practice-tests-2026.html', title: 'Practice tests',     text: 'Any chapter, any time, nothing saved' },
      { href: '/online-tests-2026.html',   title: 'Online Tests 2026',  text: 'Real chapter tests on announced dates' },
      { href: '/textbooks-2026.html',      title: 'Textbooks & model papers', text: 'Official e-books and model papers, Classes 6 to 10' },
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
  {
    label: 'Notes & Exams',
    intro: 'Mid-Term SBA 2026-27: date sheet, syllabus and expected questions for Classes 6, 7 and 8.',
    links: [
      { href: '/mid-term-2026-27.html',        title: 'Mid-Term date sheet',      text: '7 to 18 December 2026, Classes 6, 7 and 8' },
      { href: '/mid-term-2026-27.html#syllabus', title: 'Mid-Term syllabus',      text: 'Units and lessons for every paper' },
      { href: '/notes-2026.html',              title: 'Notes & expected questions', text: '51 files in 8 subjects, ready to download' },
      { href: '/textbooks-2026.html',          title: 'Textbooks & model papers', text: 'Official e-books, Classes 6 to 10' },
      { href: '/notes-2026.html?class=6',      title: 'Class 6 notes',            text: 'MCQs and subjective questions' },
      { href: '/notes-2026.html?class=7',      title: 'Class 7 notes',            text: 'MCQs and subjective questions' },
      { href: '/notes-2026.html?class=8',      title: 'Class 8 notes',            text: 'MCQs, subjective and updated History & Geography' },
    ],
  },
  { label: 'Notice Board', href: '/notice-board' },
];

export const QUICK = [
  { href: '/practice-tests-2026.html', label: 'Practice tests', icon: 'pencil' },
  { href: '/online-tests-2026.html',   label: 'Online Tests',   icon: 'check' },
  { href: '/notes-2026.html',          label: 'Notes',          icon: 'book' },
  { href: '/textbooks-2026.html',      label: 'Textbooks',      icon: 'book' },
  { href: '/mid-term-2026-27.html',    label: 'Date sheet',     icon: 'cal' },
  { href: '/notice-board',             label: 'Notice board',   icon: 'bell' },
];

export const AUTHORITIES = [
  { src: '/ld-punjab.webp',  name: 'Government of the Punjab' },
  { src: '/ld-pectaa.webp',  name: 'PECTAA' },
  { src: '/ld-naim.webp',    name: 'Dr Naim Tahir Baig, COE Sialkot (Boys)' },
];

export const FOOT_LINKS = [
  { href: '/practice-tests-2026.html', label: 'Practice tests' },
  { href: '/online-tests-2026.html',   label: 'Online Tests' },
  { href: '/notes-2026.html',          label: 'Notes' },
  { href: '/textbooks-2026.html',      label: 'Textbooks' },
  { href: '/mid-term-2026-27.html',    label: 'Date sheet' },
  { href: '/student-resources',        label: 'Student resources' },
  { href: '/notice-board',             label: 'Notice board' },
  { href: '/question-bank',            label: 'Staff' },
  { href: '/login',                    label: 'Sign in' },
];

// Sections for the gold bar on inner pages: name, banner photo and the pages inside
export const SECTIONS = {
  students: {
    label: 'Students', href: '/practice-tests-2026.html', photo: '/home/photos/library-2.webp',
    sub: [
      { href: '/practice-tests-2026.html', label: 'Practice tests' },
      { href: '/online-tests-2026.html', label: 'Online Tests 2026' },
      { href: '/notes-2026.html', label: 'Notes & expected questions' },
      { href: '/textbooks-2026.html', label: 'Textbooks & model papers' },
      { href: '/student-resources', label: 'Student resources' },
      { href: '/practice-tests', label: 'Quizzes' },
    ],
  },
  exams: {
    label: 'Notes & Exams', href: '/mid-term-2026-27.html', photo: '/home/photos/exam-hall.webp',
    sub: [
      { href: '/mid-term-2026-27.html', label: 'Mid-Term date sheet' },
      { href: '/mid-term-2026-27.html#syllabus', label: 'Syllabus' },
      { href: '/notes-2026.html', label: 'Notes & expected questions' },
      { href: '/exams', label: 'Examinations' },
      { href: '/result-cards', label: 'Result cards' },
    ],
  },
  notices: {
    label: 'Notice Board', href: '/notice-board', photo: '/home/photos/assembly-speech.webp',
    sub: [
      { href: '/notice-board', label: 'All notices' },
      { href: '/mid-term-2026-27.html', label: 'Mid-Term date sheet' },
      { href: '/student-resources', label: 'Student resources' },
    ],
  },
  teachers: {
    label: 'Teachers', href: '/question-bank', photo: '/home/photos/classroom-science.webp',
    sub: [
      { href: '/question-bank', label: 'Question Bank' },
      { href: '/online-test-setup', label: 'Online test setup' },
      { href: '/online-test-results', label: 'Online test results' },
      { href: '/award-list', label: 'Award lists' },
      { href: '/proformas', label: 'Proformas' },
      { href: '/result-cards', label: 'Result cards' },
      { href: '/admin', label: 'Administration' },
    ],
  },
  portal: {
    label: 'Portal', href: '/login', photo: '/home/photos/new-campus.webp',
    sub: [
      { href: '/login', label: 'Sign in' },
      { href: '/notice-board', label: 'Notice board' },
    ],
  },
};

// Page title band for every route. "own" pages draw their own ISKL layout with <InnerPage>;
// the others are working tools: SiteChrome draws the banner, gold bar, breadcrumb and title,
// then shows the tool underneath (dark = the tool keeps its navy working screen).
export const PAGES = [
  { re: /^\/practice-tests\/online/, photo: '/home/photos/library-1.webp', section: 'students', title: 'Practice', light: 'Quiz', dark: true },
  { re: /^\/(notice-board|student-resources|practice-tests|online-tests|exams|login|reset-password)(\/|$)/, own: true },
  { re: /^\/question-bank/, section: 'teachers', title: 'Question', light: 'Bank', lede: 'Make class tests and term papers from the school question bank.' },
  { re: /^\/online-test-setup/, photo: '/home/photos/classroom-english.webp', section: 'teachers', title: 'Online Test', light: 'Setup', lede: 'Choose a test, set its dates and share the link with your class.' },
  { re: /^\/online-test-results/, photo: '/home/photos/exam-hall.webp', section: 'teachers', title: 'Online Test', light: 'Results', lede: 'Marks, result cards and answer keys for every online test.' },
  { re: /^\/award-list/, photo: '/home/photos/classroom-english.webp', section: 'teachers', title: 'Award', light: 'Lists', lede: 'Enter your section’s subject marks with your PIN.', dark: true },
  { re: /^\/proformas/, photo: '/home/photos/assembly-staff.webp', section: 'teachers', title: 'Teacher', light: 'Proformas', lede: 'Teacher-wise and class-wise detail proformas, ready to download.', dark: true },
  { re: /^\/result-cards/, photo: '/home/photos/assembly-rows.webp', section: 'exams', title: 'Result', light: 'Cards', lede: 'Progress report cards for a whole section, ready to print.', dark: true },
  { re: /^\/admin\/papers/, section: 'teachers', title: 'Exam', light: 'Papers', crumb: 'Administration' },
  { re: /^\/admin\/students/, section: 'teachers', title: 'Student', light: 'Records', crumb: 'Administration' },
  { re: /^\/admin\/exams/, section: 'teachers', title: 'Exams', light: 'Office', crumb: 'Administration', dark: true },
  { re: /^\/admin\/online-tests/, section: 'teachers', title: 'Online', light: 'Tests', crumb: 'Administration' },
  { re: /^\/admin\/test-students/, section: 'teachers', title: 'Test', light: 'Students', crumb: 'Administration' },
  { re: /^\/admin\/warning-letter/, section: 'teachers', title: 'Warning', light: 'Letters', crumb: 'Administration' },
  { re: /^\/admin\/award-lists/, section: 'teachers', title: 'Award Lists', light: 'Admin', crumb: 'Administration', dark: true },
  { re: /^\/admin\/proformas/, section: 'teachers', title: 'Proformas', light: 'Admin', crumb: 'Administration' },
  { re: /^\/admin\/result-cards/, section: 'teachers', title: 'Result Cards', light: 'Admin', crumb: 'Administration' },
  { re: /^\/admin/, photo: '/home/photos/old-campus.webp', section: 'teachers', title: 'School', light: 'Administration', lede: 'Office tools for the school’s records, papers and results.' },
  { re: /^\/exam\/teacher/, photo: '/home/photos/classroom-science.webp', section: 'teachers', title: 'Teacher', light: 'Examination Portal', lede: 'Write your paper and send it to the examination office.' },
  { re: /^\/exam\/paper-template/, photo: '/home/photos/exam-hall.webp', section: 'teachers', title: 'Paper', light: 'Template Builder' },
  { re: /^\/portal\/admin/, photo: '/home/photos/old-campus.webp', section: 'portal', title: 'Admin', light: 'Portal' },
  { re: /^\/portal\/management/, photo: '/home/photos/assembly-staff.webp', section: 'portal', title: 'Management', light: 'Portal' },
  { re: /^\/portal\/teacher/, photo: '/home/photos/classroom-english.webp', section: 'portal', title: 'Teacher', light: 'Portal' },
  { re: /^\/portal\/student/, photo: '/home/photos/library-2.webp', section: 'portal', title: 'Student', light: 'Portal' },
  { re: /^\/portal\/parent/, photo: '/home/photos/assembly-rows.webp', section: 'portal', title: 'Parent', light: 'Portal' },
];
export const pageFor = (path) => PAGES.find((p) => p.re.test(path)) || null;
