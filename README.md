QuickNotes System Design

1. Project Overview

QuickNotes is a note-taking application prototype and system design project. It demonstrates how a web client can communicate with a REST API and documents how the application could be developed into a scalable, secure, and reliable service.

The project combines a simple HTML, CSS, and JavaScript frontend with system design documentation covering API endpoints, database structure, and application architecture.

Project status: Frontend prototype and system design documentation.

2. Features

- Load notes from an API using HTTP GET.
- Create notes using HTTP POST.
- Delete notes using HTTP DELETE.
- Validate note titles before submission.
- Display loading, success, empty, and error messages.
- Use reusable JavaScript request handling.
- Document REST API design and error responses.
- Design a relational data model for users, notes, and tags.
- Propose an architecture designed to scale toward one million registered users.

3. Technologies Used

- HTML5: Structures the user interface.
- CSS3: Styles the application and supports mobile layouts.
- JavaScript: Handles user interactions, validation, and asynchronous API requests.
- Fetch API: Sends HTTP requests to the API.
- JSONPlaceholder: Provides a mock REST API for demonstrating requests.
- PostgreSQL: Proposed database for the production system.
- Git and GitHub: Version control and source-code hosting.
- Mermaid: Illustrates the proposed system architecture.

4. How to Run the Frontend Prototype

Requirements

- A modern web browser.
- Internet connectivity to access JSONPlaceholder.
- The project files downloaded or cloned to your computer.

Instructions

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Confirm that "index.html", "style.css", and "api.js" are in the project root.
4. Open "index.html" in a web browser, or use the VS Code Live Server extension if installed.
5. Select Load Notes to retrieve sample notes.
6. Enter a title and body, then submit the form to test creating a note.
7. Use a note's Delete button to test the delete request.

Important API limitation

JSONPlaceholder is a mock API. POST and DELETE requests simulate successful operations but do not permanently create or delete records on the remote server. Changes made through the prototype are therefore not persistent production data.

The proposed production API and PostgreSQL database described in the documentation have not been implemented by this frontend prototype.

5. Project Structure

quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── docs/
│ ├── api-design.md
│ ├── data-model.md
│ └── architecture.md
└── README.md

6. System Design Documentation

- "API Design" (docs/api-design.md) — Endpoints, request and response formats, authentication, and error handling.
- "Data Model" (docs/data-model.md) — Database tables, relationships, constraints, indexes, and SQL examples.
- "Architecture" (docs/architecture.md) — System components, load estimates, request flows, trade-offs, and reliability.

7. Design Decisions

- REST API: Uses resource-oriented endpoints and standard HTTP methods.
- Relational database: PostgreSQL is proposed to maintain relationships and transactional integrity.
- Caching: A shared cache can reduce repeated database reads.
- Horizontal scaling: Multiple application servers can distribute incoming requests.
- Asynchronous processing: A message queue and background workers can handle non-urgent tasks.
- Security: The proposed production system requires HTTPS, authentication, authorization, input validation, and secure password hashing.

These are documented design decisions and proposals; they should not be interpreted as implemented production infrastructure.

8. What I Learned

Through this project, I learned how to:

1. Use JavaScript's Fetch API and asynchronous functions to communicate with a REST API.
2. Handle loading states, successful responses, validation errors, and failed requests.
3. Design REST endpoints with appropriate HTTP methods and status codes.
4. Model relational data using primary keys, foreign keys, constraints, and indexes.
5. Explain how DNS, a CDN, a load balancer, application servers, caching, databases, and message queues work together.
6. Estimate request rates and storage requirements using explicit assumptions.
7. Use Git to track changes and organize a project into meaningful commits.

9. Future Improvements

- Implement a real backend API and persistent PostgreSQL storage.
- Add secure user registration and login.
- Implement server-side authorization and note ownership checks.
- Add search, filtering, pagination, and tag management.
- Write automated tests for the API and frontend.
- Deploy the application and configure monitoring, backups, and recovery procedures.

10. Conclusion

QuickNotes demonstrates the frontend fundamentals of API communication and provides a documented proposal for a scalable note-taking service. The project separates the working prototype from the proposed production architecture and identifies improvements needed to move toward a fully deployed application.