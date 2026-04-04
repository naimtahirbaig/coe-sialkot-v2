-- ============================================================
-- SEED DATA FOR COE SIALKOT (BOYS)
-- Run this AFTER creating users in Supabase Auth dashboard
-- ============================================================

-- SUBJECTS
INSERT INTO public.subjects (name, code, department) VALUES
('Mathematics', 'MATH', 'STEM'),
('Physics', 'PHY', 'STEM'),
('Chemistry', 'CHEM', 'STEM'),
('Biology', 'BIO', 'STEM'),
('English', 'ENG', 'Languages'),
('Urdu', 'URD', 'Languages'),
('Islamiat', 'ISL', 'Humanities'),
('Pakistan Studies', 'PST', 'Humanities'),
('Computer Science', 'CS', 'STEM'),
('General Science', 'GSCI', 'STEM');

-- CLASSES
INSERT INTO public.classes (name, grade, section, academic_year, room_number, capacity) VALUES
('Grade 6-A', '6', 'A', '2025-2026', '101', 40),
('Grade 6-B', '6', 'B', '2025-2026', '102', 40),
('Grade 7-A', '7', 'A', '2025-2026', '201', 40),
('Grade 7-B', '7', 'B', '2025-2026', '202', 40),
('Grade 8-A', '8', 'A', '2025-2026', '301', 40),
('Grade 8-B', '8', 'B', '2025-2026', '302', 40),
('Grade 9-A', '9', 'A', '2025-2026', '401', 40),
('Grade 9-B', '9', 'B', '2025-2026', '402', 40),
('Grade 10-A', '10', 'A', '2025-2026', '501', 40),
('Grade 10-B', '10', 'B', '2025-2026', '502', 40);

-- FEE STRUCTURE
INSERT INTO public.fee_structure (name, amount, fee_type, academic_year, due_date) VALUES
('Monthly Tuition (Subsidized)', 0, 'tuition', '2025-2026', '2026-04-01'),
('Exam Fee - Term 1', 500, 'exam', '2025-2026', '2025-10-01'),
('Exam Fee - Term 2', 500, 'exam', '2025-2026', '2026-03-01'),
('Lab Fee (Annual)', 300, 'lab', '2025-2026', '2025-09-15'),
('Library Deposit', 200, 'library', '2025-2026', '2025-09-15'),
('Activity Fee', 400, 'activity', '2025-2026', '2025-09-15');

-- EVENTS
INSERT INTO public.events (title, event_type, start_date, start_time, location, audience) VALUES
('Annual Day Celebration', 'event', '2026-03-28', '09:00 AM', 'Main Auditorium', 'all'),
('Mid-Term Exams Begin', 'exam', '2026-04-07', '08:00 AM', 'All Classrooms', 'all'),
('Spring Break', 'holiday', '2026-04-18', NULL, NULL, 'all'),
('Science Fair', 'event', '2026-04-25', '10:00 AM', 'Science Block', 'all'),
('Parent-Teacher Conference', 'meeting', '2026-05-02', '02:00 PM', 'Main Hall', 'all'),
('Sports Day', 'sports', '2026-05-10', '08:30 AM', 'Sports Ground', 'all'),
('Pakistan Day Celebration', 'event', '2026-03-23', '09:00 AM', 'Assembly Ground', 'all'),
('Summer Break Begins', 'holiday', '2026-06-20', NULL, NULL, 'all');

-- TRANSPORT ROUTES
INSERT INTO public.transport_routes (route_name, bus_number, driver_name, driver_phone, capacity, stops, status) VALUES
('Route 1 - Cantt Area', 'COE-001', 'Muhammad Aslam', '+92-300-1234567', 40, 8, 'active'),
('Route 2 - Daska Road', 'COE-002', 'Ghulam Abbas', '+92-301-2345678', 40, 10, 'active'),
('Route 3 - Pasrur Road', 'COE-003', 'Tariq Mehmood', '+92-302-3456789', 40, 6, 'active'),
('Route 4 - Wazirabad Road', 'COE-004', 'Sajjad Hussain', '+92-303-4567890', 40, 9, 'active'),
('Route 5 - Sambrial', 'COE-005', 'Nadeem Ahmed', '+92-304-5678901', 40, 7, 'maintenance');

-- LIBRARY BOOKS
INSERT INTO public.library_books (title, author, isbn, category, total_copies, available_copies) VALUES
('Pakistan Studies for Grade 9', 'Dr. Iftikhar Ahmad', '978-969-001-001', 'Textbook', 30, 25),
('Mathematics Grade 10', 'Punjab Textbook Board', '978-969-001-002', 'Textbook', 30, 28),
('English Grammar & Composition', 'Wren & Martin', '978-0-06-112008-4', 'Reference', 10, 4),
('Urdu Adab', 'Dr. Saleem Akhtar', '978-969-001-003', 'Literature', 8, 5),
('Introduction to Physics', 'Halliday & Resnick', '978-0-471-32057-9', 'Reference', 6, 2),
('Quran Translation (Urdu)', 'Maulana Maududi', '978-969-001-004', 'Religious', 15, 12),
('Computer Science Basics', 'Peter Norton', '978-0-07-882189-4', 'Technology', 10, 7),
('General Knowledge Encyclopedia', 'Various', '978-0-7566-3710-4', 'Reference', 5, 3);

-- ANNOUNCEMENTS
INSERT INTO public.announcements (title, body, priority, audience) VALUES
('Annual Day Celebration – March 28', 'All students and parents are invited to the Annual Day celebration at the main auditorium.', 'high', 'all'),
('Parent-Teacher Meeting for Grade 10', 'Grade 10 PTM is scheduled for next Friday. All parents are requested to attend.', 'medium', 'parents'),
('Science Fair Registration Open', 'Register for the annual science fair before April 5. See your science teacher for details.', 'low', 'students'),
('Staff Training on New LMS', 'Mandatory training session for all teaching staff on the new learning management system.', 'medium', 'teachers'),
('Fee Reminder', 'This is a reminder that exam fees for Term 2 are due by March 30.', 'high', 'parents'),
('Pakistan Day Assembly', 'Special assembly on March 23 for Pakistan Day. All students must wear white uniform.', 'medium', 'all');

-- ============================================================
-- HOW TO CREATE USERS:
-- ============================================================
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create New User"
-- 3. Create these accounts:
--
--    ADMIN:
--    Email: admin@coesialkot.edu.pk
--    Password: Admin@COE2026
--    (Then run: UPDATE profiles SET role='admin', full_name='System Administrator' WHERE email='admin@coesialkot.edu.pk')
--
--    PRINCIPAL:
--    Email: principal@coesialkot.edu.pk
--    Password: Principal@COE2026
--    (Then run: UPDATE profiles SET role='management', full_name='Dr. Muhammad Akram' WHERE email='principal@coesialkot.edu.pk')
--
--    TEACHER:
--    Email: teacher@coesialkot.edu.pk
--    Password: Teacher@COE2026
--    (Then run: UPDATE profiles SET role='teacher', full_name='Mr. Usman Ali' WHERE email='teacher@coesialkot.edu.pk')
--
--    STUDENT:
--    Email: student@coesialkot.edu.pk
--    Password: Student@COE2026
--    (Then run: UPDATE profiles SET role='student', full_name='Ahmad Hassan' WHERE email='student@coesialkot.edu.pk')
--
--    PARENT:
--    Email: parent@coesialkot.edu.pk
--    Password: Parent@COE2026
--    (Then run: UPDATE profiles SET role='parent', full_name='Muhammad Hussain' WHERE email='parent@coesialkot.edu.pk')
--
-- ============================================================
