# School Management Database Design

## Table Explanations

- **`students`**: Stores core information about registered students, including a unique auto-incrementing ID, first and last names, and a strictly unique email address.
- **`courses`**: Stores course offerings, including a unique course ID, official title, course code (e.g., `CS101`), and academic credit values.
- **`enrolments`**: Serves as the associative (join) table linking students to courses. It tracks student progress by holding attributes specific to the relationship, such as `grade` and `enrolled_at`.

---

## Entity Relationships

- **Students to Enrolments (One-to-Many):** One student can have multiple enrolment records, but each enrolment record belongs to exactly one student.
- **Courses to Enrolments (One-to-Many):** One course can have multiple enrolment records, but each enrolment record corresponds to exactly one course.
- **Students to Courses (Many-to-Many):** A student can enroll in multiple courses, and a course can have many enrolled students.

### Why a Join Table is Needed
Relational databases cannot directly implement a many-to-many relationship without introducing severe data redundancy or violating normal form rules (such as storing comma-separated lists of course IDs in a single row). The `enrolments` join table breaks down the many-to-many relationship into two manageable one-to-many relationships while providing a clean location to store relationship-specific metadata, such as grades.

---

## Recommended Database Index

CREATE INDEX idx_enrolments_student_id ON enrolments(student_id);

### Reason for Index Choice
In an academic system, searching for all courses and grades associated with a specific student is one of the most frequent database operations (e.g., generating student transcripts or dashboard views). Creating a secondary B-tree index on `enrolments(student_id)` eliminates the need for expensive full-table scans during `JOIN` queries filtering by `student_id`, significantly speeding up read queries as the `enrolments` table grows into millions of records.

---

## Architectural Decision: SQL vs NoSQL

For a school management system, a relational **SQL database** (such as PostgreSQL or SQLite for smaller deployments) is the clear choice over a NoSQL database. Academic management systems require strict data integrity, structured schemas, and transactional guarantees (ACID compliance) to ensure that enrollment states, grade logs, and course rosters are always consistent. Features such as foreign key constraints prevent orphan records (e.g., enrolling a non-existent student), and `UNIQUE` constraint checks prevent duplicate enrollments natively at the database level. While NoSQL databases scale well for unstructured data, a school system's highly relational structure and requirement for complex multi-table joins make SQL the most robust and maintainable choice.

```