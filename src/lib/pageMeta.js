// Link previews (WhatsApp, Facebook, X) for every page of the site.
// Each page has its own title, description and 1200x630 picture in public/og/<key>.jpg.
// The pictures are made from this list (title, section, photo), so a new page needs:
//   1. an entry here,  2. a picture in public/og/,  3. `export const metadata = pageMeta('<key>')` in its layout.js

export const SITE = 'https://www.coesialkot.com';
const SCHOOL = 'Centre of Excellence Sialkot (Boys)';

export const PAGE_META = {
  // ── public pages ──
  home: { path: '/', section: 'Home', title: 'Centre of Excellence', light: 'Sialkot (Boys)', photo: 'old-campus',
    desc: 'Online tests, practice tests, notes and the Mid-Term date sheet for Classes 6, 7 and 8. Punjab Daanish Schools & Centres of Excellence Authority.' },
  'notice-board': { path: '/notice-board', section: 'Notice Board', title: 'Notice', light: 'Board', photo: 'assembly-speech',
    desc: 'Official announcements from the school administration, newest first. No sign-in needed.' },
  'student-resources': { path: '/student-resources', section: 'Students', title: 'Student', light: 'Resources', photo: 'library-1',
    desc: 'Notes, past papers and date sheets for Classes 6 to 10. Read online or download, free for every student.' },
  'practice-tests': { path: '/practice-tests', section: 'Students', title: 'Practice', light: 'Quizzes', photo: 'library-2',
    desc: 'Quizzes and practice papers added by teachers, plus chapter-wise MCQ practice for Classes 6, 7 and 8.' },
  'practice-quiz': { path: '/practice-tests/online', section: 'Students', title: 'Practice', light: 'Quiz', photo: 'library-1',
    desc: 'An interactive practice quiz from your teacher. Write your name and class, then start.' },
  'online-tests': { path: '/online-tests', section: 'Tests & Results', title: 'September', light: 'MCQ Tests', photo: 'classroom-english',
    desc: 'The September 2026 MCQ tests for Classes 6, 7 and 8. Choose your class, then your subject.' },
  exams: { path: '/exams', section: 'Notes & Exams', title: 'Examinations', light: 'Office', photo: 'exam-hall',
    desc: 'Every exam link in one place: marks entry, proformas, result cards and office tools.' },
  'result-cards': { path: '/result-cards', section: 'Tests & Results', title: 'Result', light: 'Cards', photo: 'assembly-rows',
    desc: 'Progress report cards for a whole section, colourful or ink-friendly, ready to print as PNG or PDF.' },
  login: { path: '/login', section: 'Portal', title: 'Portal', light: 'Sign In', photo: 'new-campus',
    desc: 'Teachers, students, parents and the school office sign in with their school email.' },
  'reset-password': { path: '/reset-password', section: 'Portal', title: 'Choose a New', light: 'Password', photo: 'new-campus',
    desc: 'Set a new password for your school portal account.' },

  // ── plain .html pages ──
  'practice-tests-2026': { path: '/practice-tests-2026.html', section: 'Students', title: 'Practice', light: 'Tests 2026', photo: 'library-2',
    desc: 'Free chapter-wise MCQ practice for Classes 6, 7 and 8 in every subject. Same questions and timer as the real tests; no camera, nothing saved.' },
  'online-tests-2026': { path: '/online-tests-2026.html', section: 'Tests & Results', title: 'Online', light: 'Tests 2026', photo: 'classroom-english',
    desc: 'Chapter-wise MCQ tests for Classes 6, 7 and 8 on the dates teachers announce. Password from your class teacher; camera needed.' },
  'textbooks-2026': { path: '/textbooks-2026.html', section: 'Students', title: 'Textbooks &', light: 'Model Papers', photo: 'library-2',
    desc: 'Official Punjab textbooks (e-books), model papers, pairing schemes and smart syllabus for Classes 6, 7, 8, 9 and 10. Read online or download, free.' },
  'notes-2026': { path: '/notes-2026.html', section: 'Notes & Exams', title: 'Notes &', light: 'Expected Questions', photo: 'library-1',
    desc: 'Chapter-wise MCQs and subjective questions for Classes 6, 7 and 8 in every subject, PECTAA style. 51 files to read or download.' },
  'mid-term-2026-27': { path: '/mid-term-2026-27.html', section: 'Notes & Exams', title: 'Mid-Term', light: 'SBA 2026-27', photo: 'exam-hall',
    desc: 'Date sheet and syllabus for Classes 6, 7 and 8. Papers from Monday 7 to Friday 18 December 2026.' },
  'case-register': { path: '/case-register', section: 'Teachers', title: 'UMC Case', light: 'Register', photo: 'assembly-staff',
    desc: 'Report, review and decide unfair-means cases from the examination hall. Staff sign-in required.' },
  invigilator: { path: '/invigilator', section: 'UMC Case Register', title: 'Invigilator', light: 'Sign In', photo: 'exam-hall',
    desc: 'Invigilators and teachers file an unfair-means report from the examination hall.' },
  coordinator: { path: '/coordinator', section: 'UMC Case Register', title: 'Class Coordinator', light: 'Sign In', photo: 'assembly-staff',
    desc: 'Class coordinators review reported cases and forward them for a decision.' },
  senior: { path: '/senior', section: 'UMC Case Register', title: 'Senior Staff', light: 'Sign In', photo: 'assembly-staff',
    desc: 'Senior staff give the final decision on forwarded unfair-means cases.' },

  // ── teachers ──
  'question-bank': { path: '/question-bank', section: 'Teachers', title: 'Question', light: 'Bank', photo: 'classroom-science',
    desc: 'Teachers make class tests and term papers from the school question bank of 18,576 questions.' },
  'online-test-setup': { path: '/online-test-setup', section: 'Teachers', title: 'Online Test', light: 'Setup', photo: 'classroom-english',
    desc: 'Choose a chapter test, set its dates and share the link with your class.' },
  'online-test-results': { path: '/online-test-results', section: 'Teachers', title: 'Online Test', light: 'Results', photo: 'exam-hall',
    desc: 'Marks, result cards, answer keys and warning letters for every online test.' },
  'award-list': { path: '/award-list', section: 'Teachers', title: 'Award', light: 'Lists', photo: 'classroom-english',
    desc: 'Subject teachers enter their section’s marks with their PIN.' },
  proformas: { path: '/proformas', section: 'Teachers', title: 'Teacher', light: 'Proformas', photo: 'assembly-staff',
    desc: 'Teacher-wise and class-wise detail proformas with live result summaries and Excel download.' },
  'exam-teacher': { path: '/exam/teacher', section: 'Teachers', title: 'Teacher', light: 'Examination Portal', photo: 'classroom-science',
    desc: 'Teachers write their paper online and send it to the examination office.' },
  'paper-template': { path: '/exam/paper-template', section: 'Teachers', title: 'Paper', light: 'Template Builder', photo: 'exam-hall',
    desc: 'Build an exam paper in two versions with MCQs, short and long questions, then print or submit it.' },

  // ── office ──
  admin: { path: '/admin', section: 'Administration', title: 'School', light: 'Administration', photo: 'old-campus',
    desc: 'Office tools for the school’s records, papers, online tests, award lists and result cards.' },
  'admin-papers': { path: '/admin/papers', section: 'Administration', title: 'Exam', light: 'Papers', photo: 'exam-hall',
    desc: 'Papers sent by teachers: check, approve and print.' },
  'admin-students': { path: '/admin/students', section: 'Administration', title: 'Student', light: 'Records', photo: 'assembly-rows',
    desc: 'Student lists for every class and section: add, edit, promote and import.' },
  'admin-exams': { path: '/admin/exams', section: 'Administration', title: 'Manage', light: 'Exams', photo: 'exam-hall',
    desc: 'Create exams, copy teacher links and set the current exam.' },
  'admin-online-tests': { path: '/admin/online-tests', section: 'Administration', title: 'Online Tests', light: 'Admin', photo: 'classroom-english',
    desc: 'Add, edit and schedule the chapter-wise online tests.' },
  'admin-test-students': { path: '/admin/test-students', section: 'Administration', title: 'Test', light: 'Students', photo: 'assembly-rows',
    desc: 'Students who may take the online tests, class by class.' },
  'admin-warning-letter': { path: '/admin/warning-letter', section: 'Administration', title: 'Warning', light: 'Letters', photo: 'assembly-speech',
    desc: 'Make and print discipline warning letters for students.' },
  'admin-award-lists': { path: '/admin/award-lists', section: 'Administration', title: 'Award Lists', light: 'Admin', photo: 'classroom-science',
    desc: 'Lock or unlock subjects and download the award lists.' },
  'admin-proformas': { path: '/admin/proformas', section: 'Administration', title: 'Proformas', light: 'Admin', photo: 'assembly-staff',
    desc: 'Set up and download the teacher-wise and class-wise proformas.' },
  'admin-result-cards': { path: '/admin/result-cards', section: 'Administration', title: 'Result Cards', light: 'Admin', photo: 'assembly-rows',
    desc: 'Set up the result card design, grading and remarks.' },

  // ── signed-in portals ──
  'portal-teacher': { path: '/portal/teacher', section: 'Portal', title: 'Teacher', light: 'Portal', photo: 'classroom-english',
    desc: 'Classes, gradebook, assignments, attendance, timetable and messages for teachers.' },
  'portal-student': { path: '/portal/student', section: 'Portal', title: 'Student', light: 'Portal', photo: 'library-2',
    desc: 'Classes, assignments, exams, timetable and library for students.' },
  'portal-parent': { path: '/portal/parent', section: 'Portal', title: 'Parent', light: 'Portal', photo: 'assembly-rows',
    desc: 'Your son’s results, attendance, assignments, timetable and fees.' },
  'portal-management': { path: '/portal/management', section: 'Portal', title: 'Management', light: 'Portal', photo: 'assembly-staff',
    desc: 'Analytics, staff, students, exams and lesson plans for the school management.' },
  'portal-admin': { path: '/portal/admin', section: 'Portal', title: 'Admin', light: 'Portal', photo: 'new-campus',
    desc: 'Users, students, teachers, admissions, finance and announcements.' },
};

const NOINDEX = /^(admin|portal-|award-list|proformas|online-test-setup|online-test-results|exam-teacher|paper-template|question-bank|reset-password|case-register|invigilator|coordinator|senior)/;

// Next.js metadata for a page
export function pageMeta(key, extra = {}) {
  const m = PAGE_META[key];
  const name = [m.title, m.light].filter(Boolean).join(' ');
  const title = key === 'home' ? `${SCHOOL} | Online Tests, Notes & Date Sheets` : `${name} | ${SCHOOL}`;
  const ogTitle = key === 'home' ? SCHOOL : `${name} — COE Sialkot (Boys)`;
  const url = SITE + m.path;
  const image = `${SITE}/og/${key}.jpg?v=2`;
  return {
    title,
    description: m.desc,
    alternates: { canonical: url },
    ...(NOINDEX.test(key) ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website', siteName: SCHOOL, locale: 'en_PK', url, title: ogTitle, description: m.desc,
      images: [{ url: image, width: 1200, height: 630, alt: `${name}, ${SCHOOL}` }],
    },
    twitter: { card: 'summary_large_image', title: ogTitle, description: m.desc, images: [image] },
    ...extra,
  };
}
