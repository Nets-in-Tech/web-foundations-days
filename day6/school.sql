-- Disable foreign key check temporarily for clean teardown, then enable foreign key enforcement
PRAGMA foreign_keys = ON;

-- Drop tables if they already exist to allow clean re-runs
DROP TABLE IF EXISTS enrolments;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

-- ==========================================
-- 1. Table Creation (Schema Definition)
-- ==========================================

-- Students Table
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_name TEXT NOT NULL,
    course_code TEXT NOT NULL UNIQUE,
    credits INTEGER NOT NULL
);

-- Enrolments Join Table (Resolves Many-to-Many between Students & Courses)
CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE (student_id, course_id) -- Prevents duplicate enrollment for the same student in the same course
);

-- ==========================================
-- 2. Sample Data Insertion
-- ==========================================

-- Insert 4 Students (Includes 1 student without any enrollments to test LEFT JOIN)
INSERT INTO students (first_name, last_name, email) VALUES
('Alice', 'Smith', 'alice.smith@example.com'),
('Bob', 'Jones', 'bob.jones@example.com'),
('Charlie', 'Brown', 'charlie.brown@example.com'),
('Diana', 'Prince', 'diana.prince@example.com');

-- Insert 3 Courses
INSERT INTO courses (course_name, course_code, credits) VALUES
('Web Development', 'CS101', 3),
('Database Systems', 'CS202', 4),
('Software Engineering', 'CS303', 3);

-- Insert 5 Enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES
(1, 1, 'A'),   -- Alice enrolled in Web Development
(1, 2, 'B+'),  -- Alice enrolled in Database Systems
(2, 1, 'A-'),  -- Bob enrolled in Web Development
(2, 3, 'B'),   -- Bob enrolled in Software Engineering
(3, 2, 'A');   -- Charlie enrolled in Database Systems

-- ==========================================
-- 3. Five Required Queries
-- ==========================================

-- Query 1: All courses for one student by name (e.g., 'Alice Smith')
SELECT 
    s.first_name, 
    s.last_name, 
    c.course_code, 
    c.course_name, 
    e.grade
FROM students s
JOIN enrolments e ON s.student_id = e.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.first_name = 'Alice' AND s.last_name = 'Smith';

-- Query 2: All students enrolled on one course (e.g., 'Database Systems')
SELECT 
    c.course_name, 
    s.first_name, 
    s.last_name, 
    s.email, 
    e.grade
FROM courses c
JOIN enrolments e ON c.course_id = e.course_id
JOIN students s ON e.student_id = s.student_id
WHERE c.course_name = 'Database Systems';

-- Query 3: The number of students per course (Includes courses with zero students if any)
SELECT 
    c.course_code, 
    c.course_name, 
    COUNT(e.student_id) AS student_count
FROM courses c
LEFT JOIN enrolments e ON c.course_id = e.course_id
GROUP BY c.course_id, c.course_code, c.course_name;

-- Query 4: Students who have no enrolments
SELECT 
    s.student_id, 
    s.first_name, 
    s.last_name, 
    s.email
FROM students s
LEFT JOIN enrolments e ON s.student_id = e.student_id
WHERE e.enrolment_id IS NULL;

-- Query 5: Update one enrolment's grade (e.g., update Bob's grade in Software Engineering to 'A')
UPDATE enrolments
SET grade = 'A'
WHERE student_id = (
    SELECT student_id FROM students WHERE first_name = 'Bob' AND last_name = 'Jones'
) 
AND course_id = (
    SELECT course_id FROM courses WHERE course_name = 'Software Engineering'
);

-- Verify the update
SELECT 
    s.first_name, 
    s.last_name, 
    c.course_name, 
    e.grade
FROM enrolments e
JOIN students s ON e.student_id = s.student_id
JOIN courses c ON e.course_id = c.course_id
WHERE s.first_name = 'Bob' AND s.last_name = 'Jones';