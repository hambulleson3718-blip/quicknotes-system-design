# QuickNotes Data Model

## 1. Overview

QuickNotes is an online note-taking service that allows users to create and manage notes and organize them using tags.

The database uses a relational model implemented with SQL. The design contains four entities:

1. Users
2. Notes
3. Tags
4. Note_Tags

Primary keys uniquely identify records, while foreign keys maintain relationships and referential integrity between tables.

## 2. Entities and Columns

### 2.1 Users

The `users` table stores registered user accounts.

| Column | Data type | Key or constraint | Description |
|---|---|---|---|
| id | BIGINT GENERATED ALWAYS AS IDENTITY | Primary key | Unique user identifier |
| name | VARCHAR(100) | NOT NULL | User's display name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| password_hash | VARCHAR(255) | NOT NULL | Secure password hash |
| created_at | TIMESTAMPTZ | NOT NULL, default current time | Account creation time |

Passwords must never be stored as plain text. The application should use an appropriate password-hashing algorithm.

### 2.2 Notes

The `notes` table stores notes created by users.

| Column | Data type | Key or constraint | Description |
|---|---|---|---|
| id | BIGINT GENERATED ALWAYS AS IDENTITY | Primary key | Unique note identifier |
| user_id | BIGINT | Foreign key, NOT NULL | Owner of the note |
| title | VARCHAR(100) | NOT NULL | Note title |
| body | TEXT | NOT NULL, default empty string | Note content |
| created_at | TIMESTAMPTZ | NOT NULL, default current time | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, default current time | Last update timestamp |

The `user_id` foreign key references `users.id`. Every note belongs to one user.

### 2.3 Tags

The `tags` table stores labels that users can apply to their notes.

| Column | Data type | Key or constraint | Description |
|---|---|---|---|
| id | BIGINT GENERATED ALWAYS AS IDENTITY | Primary key | Unique tag identifier |
| user_id | BIGINT | Foreign key, NOT NULL | Owner of the tag |
| name | VARCHAR(50) | NOT NULL | Tag name |
| created_at | TIMESTAMPTZ | NOT NULL, default current time | Tag creation timestamp |

A unique constraint on `(user_id, name)` prevents a user from creating duplicate tags with the same name.

### 2.4 Note_Tags

The `note_tags` table connects notes and tags.

| Column | Data type | Key or constraint | Description |
|---|---|---|---|
| note_id | BIGINT | Foreign key, primary-key component | Associated note |
| tag_id | BIGINT | Foreign key, primary-key component | Associated tag |
| created_at | TIMESTAMPTZ | NOT NULL, default current time | Association creation time |

The composite primary key `(note_id, tag_id)` prevents the same tag from being associated with the same note more than once.

## 3. Relationships

### One-to-many: Users and Notes

One user can create many notes, but each note belongs to exactly one user.

Relationship:

`users (1) ---- (many) notes`

The `notes.user_id` foreign key references `users.id`.

### One-to-many: Users and Tags

One user can create many tags, but each tag belongs to one user.

Relationship:

`users (1) ---- (many) tags`

The `tags.user_id` foreign key references `users.id`.

### Many-to-many: Notes and Tags

One note can have multiple tags, and one tag can be applied to multiple notes.

Relationship:

`notes (many) ---- (many) tags`

The `note_tags` junction table implements this relationship through `note_id` and `tag_id`.

The application must ensure that a note and its assigned tag belong to the same user.

## 4. SQL CREATE TABLE Statements

The following statements use PostgreSQL syntax. Create the parent tables before their dependent tables.

### 4.1 Create users

```sql
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Create notes

```sql
CREATE TABLE notes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_notes_title
        CHECK (LENGTH(TRIM(title)) BETWEEN 1 AND 100)
);
```

### 4.3 Create tags

```sql
CREATE TABLE tags (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_tags_user_name
        UNIQUE (user_id, name)
);
```

### 4.4 Create note_tags

```sql
CREATE TABLE note_tags (
    note_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (note_id, tag_id),

    CONSTRAINT fk_note_tags_note
        FOREIGN KEY (note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_note_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);
```

The cascading delete rules remove dependent notes, tags, or tag associations when their referenced parent records are deleted. The backend must also enforce user ownership when creating associations.

## 5. Example SQL Queries

### Query 1: Retrieve all notes belonging to one user

```sql
SELECT id, title, body, created_at, updated_at
FROM notes
WHERE user_id = 12
ORDER BY updated_at DESC;
```

This query retrieves the notes owned by user 12, showing the most recently updated notes first.

### Query 2: Create a new note

```sql
INSERT INTO notes (user_id, title, body)
VALUES (12, 'Revision plan', 'Revise Chemistry and Mathematics.')
RETURNING id, user_id, title, body, created_at;
```

The database generates the new note ID and returns the inserted record. In production, the application must obtain the user ID from the authenticated session rather than trusting a client-supplied ID.

### Query 3: Retrieve notes with their tags using JOIN

```sql
SELECT
    n.id AS note_id,
    n.title,
    t.id AS tag_id,
    t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt
    ON n.id = nt.note_id
JOIN tags AS t
    ON nt.tag_id = t.id
WHERE n.user_id = 12
ORDER BY n.id, t.name;
```

This query uses joins to combine notes, their tag associations, and the corresponding tag names.

### Query 4: Count notes per user

```sql
SELECT
    u.id,
    u.name,
    COUNT(n.id) AS total_notes
FROM users AS u
LEFT JOIN notes AS n
    ON u.id = n.user_id
GROUP BY u.id, u.name
ORDER BY total_notes DESC;
```

The `LEFT JOIN` includes users who have not created any notes.

## 6. Indexing Strategy

Indexes help the database locate records without scanning entire tables.

### Index 1: Notes by owner and update time

```sql
CREATE INDEX idx_notes_user_updated
ON notes (user_id, updated_at DESC);
```

**Reason:** The application frequently retrieves a user's notes sorted by their most recent update. This composite index supports the owner filter and the requested ordering.

### Index 2: Reverse lookup of tags by note

```sql
CREATE INDEX idx_note_tags_tag_note
ON note_tags (tag_id, note_id);
```

**Reason:** The primary key `(note_id, tag_id)` supports lookups starting with a note ID. This additional index helps find all notes associated with a particular tag.

Indexes consume storage and add overhead to writes, so they should be selected based on actual query patterns and database monitoring.

## 7. SQL vs NoSQL Decision

QuickNotes will use a relational SQL database, specifically PostgreSQL.

The application has clearly defined entities and relationships. Notes belong to users, while tags and notes have a many-to-many relationship. SQL provides foreign keys, unique constraints, transactions, joins, and referential integrity to maintain consistent data.

PostgreSQL is also suitable for filtering, sorting, pagination, and reporting. At one million users, the system can scale through indexing, connection pooling, caching, read replicas, and database optimization.

A NoSQL database could be useful for flexible document structures or specialized access patterns, but it would require additional application-level handling for relationships and consistency. For this project, PostgreSQL offers a better balance of data integrity, flexibility, and maintainability.

## 8. Security and Data Integrity

- Store password hashes rather than plain-text passwords.
- Enforce authentication and authorization in the backend.
- Use parameterized SQL queries to prevent SQL injection.
- Validate all incoming fields before inserting or updating records.
- Restrict queries so users can access only their own notes and tags.
- Use database transactions when an operation changes multiple related records.
- Apply database backups and test restoration procedures regularly.