QuickNotes System Architecture

1. Overview

QuickNotes is a note-taking application that allows users to create, view, update, delete, and organize their notes using tags. The system is designed to support growth from a small application to a service with one million registered users.

The proposed architecture uses a web client, a content delivery network (CDN), a load balancer, multiple application servers, a cache, a relational database, a read replica, a message queue, and background workers.

The frontend prototype currently uses JSONPlaceholder to demonstrate HTTP requests. JSONPlaceholder is a mock API; the architecture described in this document is a proposed production design, not a claim that all these services have already been implemented.

2. Functional Requirements

The system must allow users to:

1. Register an account and log in securely.
2. Create a note with a title and body.
3. View a list of their notes and retrieve an individual note.
4. Update existing notes.
5. Delete notes.
6. Create tags and assign tags to notes.
7. Search, filter, and paginate through notes.
8. Access only notes belonging to their own account.

3. Non-Functional Requirements

Scalability

The system should support increasing numbers of users and requests by adding application servers and scaling database resources.

Availability

The service should remain available when an application server fails. Critical infrastructure should support redundancy and failover.

Performance

Frequently accessed notes should load quickly through caching, efficient database queries, and pagination.

Security

The system must use HTTPS, securely hash passwords, validate input, authenticate requests, and authorize access to each user's notes.

Data integrity

Database constraints and transactions should protect relationships between users, notes, and tags.

Maintainability

The system should use separate components, clear API contracts, automated tests, logging, and monitoring to simplify maintenance.

Reliability

Temporary failures should be handled through timeouts, retries where appropriate, and monitoring. Background jobs should not be silently lost.

4. Architecture Diagram

The following diagram illustrates the proposed production architecture.

flowchart TD
    U[User / Web Browser] --> DNS[DNS]
    DNS --> CDN[CDN]
    CDN --> LB[Load Balancer]

    LB --> A1[Application Server A]
    LB --> A2[Application Server B]

    A1 --> CACHE[Shared Cache]
    A2 --> CACHE

    CACHE -->|Cache miss| DB[(Primary Database)]
    A1 -->|Write requests| DB
    A2 -->|Write requests| DB

    A1 -->|Read requests| REPLICA[(Read Replica)]
    A2 -->|Read requests| REPLICA

    A1 --> Q[Message Queue]
    A2 --> Q
    Q --> W[Background Worker]
    W --> DB

    DB -. Replication .-> REPLICA

5. Components and the Problems They Solve

5.1 Web Client

The browser provides the user interface for creating, viewing, updating, and deleting notes. It communicates with the backend through HTTPS requests.

5.2 DNS

The Domain Name System translates the application's domain name into the address of the appropriate network endpoint, allowing users to access the service using a memorable name.

5.3 Content Delivery Network (CDN)

The CDN serves static files such as JavaScript, CSS, and images from locations closer to users, reducing latency and the load on application servers.

5.4 Load Balancer

The load balancer distributes incoming API requests across available application servers. Health checks allow it to stop routing requests to unhealthy servers.

5.5 Application Servers

At least two application server instances run the backend API. They authenticate users, validate requests, enforce authorization, and coordinate database operations. Multiple instances allow the system to scale horizontally and tolerate an individual server failure.

5.6 Shared Cache

A shared cache such as Redis stores frequently accessed data temporarily, reducing repeated database queries and improving response times. Cached notes must be invalidated or updated when the underlying data changes.

5.7 Primary Database

A relational database such as PostgreSQL stores users, notes, tags, and their relationships. The primary database handles writes and provides transactional consistency.

5.8 Read Replica

A read replica receives replicated database changes and handles suitable read queries. It reduces read pressure on the primary database, although replication lag may mean that very recent changes are not immediately visible on the replica.

5.9 Message Queue

A durable message queue holds background jobs until workers can process them. It separates time-consuming tasks from user-facing requests and helps absorb temporary spikes in workload.

5.10 Background Worker

Background workers process queued tasks, such as sending notifications, generating exports, or performing other non-urgent operations. Failed jobs can be retried and eventually moved to a dead-letter queue for investigation.

6. Load and Storage Estimate for One Million Users

These calculations are planning estimates, not measured results. Actual usage will depend on user activity, note sizes, and the application's features.

Assumptions

- Registered users: 1,000,000.
- Daily active users: 10% of registered users = 100,000.
- Average reads per active user per day: 20.
- Average note writes per active user per day: 2.
- Average stored size per new or updated note: approximately 2 KB, including basic note content and metadata but excluding database index overhead.
- Peak traffic: five times the average request rate.
- Storage growth estimate assumes 200,000 new notes per day and does not subtract deleted notes.

Estimated Read Load

Daily reads:

100,000 active users × 20 reads = 2,000,000 reads per day.

Average reads per second:

2,000,000 ÷ 86,400 ≈ 23 reads per second.

Estimated peak reads:

23 × 5 ≈ 115 reads per second.

Estimated Write Load

Daily note writes:

100,000 active users × 2 writes = 200,000 writes per day.

Average writes per second:

200,000 ÷ 86,400 ≈ 2.3 writes per second.

Estimated peak writes:

2.3 × 5 ≈ 12 writes per second.

These estimates suggest that caching, efficient queries, pagination, and horizontal application-server scaling should be evaluated before introducing more complex infrastructure.

Estimated Storage Growth

Daily raw note storage:

200,000 notes × 2 KB = 400,000 KB, approximately 400 MB per day.

Annual raw note storage:

400 MB × 365 = approximately 146 GB per year.

Allowing an additional 30% for indexes and related database overhead gives an illustrative estimate of:

146 GB × 1.30 ≈ 190 GB per year.

This is an approximate planning figure. It excludes backups, replicas, logs, attachments, and other operational data. Replication and backups also require additional storage capacity.

7. Request Flows

7.1 GET /notes — Retrieve Notes

1. The user opens the notes page in the browser.
2. The browser sends a GET request to "/notes" over HTTPS, including the user's authentication token.
3. DNS resolves the application's domain, and the request passes through the CDN and load balancer.
4. The load balancer routes the request to a healthy application server.
5. The application server validates the user's identity and checks authorization.
6. The server checks the shared cache for the requested notes or cached list.
7. If suitable data is cached, the server returns it. Otherwise, the server queries the database, using the read replica where appropriate.
8. The server returns a paginated JSON response.
9. The browser displays the notes.

The API must filter results by the authenticated user so that one user cannot access another user's private notes.

7.2 POST /notes — Create a Note

1. The user submits a note title and body through the browser.
2. The browser sends a POST request to "/notes" over HTTPS with a JSON body and authentication token.
3. The load balancer routes the request to a healthy application server.
4. The server authenticates the user and validates the note's title and body.
5. The server inserts the note into the primary database, associating it with the authenticated user's account.
6. The database commits the transaction and returns the created note's identifier and stored data.
7. The server invalidates or updates affected cached data.
8. The server responds with HTTP "201 Created" and the created note representation.

If additional work is required, such as sending a notification, the server can publish a job to the message queue and let a background worker process it separately.

8. Trade-Offs and Design Decisions

Relational database versus NoSQL

PostgreSQL is a suitable starting point because users, notes, and tags have clear relationships, and transactions help maintain data integrity. A relational database requires thoughtful indexing and scaling as data grows, but the proposed workload does not by itself prove that a NoSQL database is necessary.

Caching versus data consistency

Caching improves read performance and reduces database load. However, cached notes can become stale. The application should invalidate or refresh relevant cache entries after successful writes. Sensitive data must not be shared across users' cache entries.

Read replicas versus immediate consistency

Read replicas can increase read capacity, but replication may lag behind the primary database. Operations that require the latest committed data, such as immediately verifying a newly saved note, may need to read from the primary database.

Synchronous versus asynchronous processing

Returning a response after a database write keeps the user's core operation straightforward. Sending non-essential work to a queue improves responsiveness and absorbs workload spikes, but introduces job retries, monitoring, and eventual completion rather than immediate completion.

CDN caching versus privacy

A CDN is useful for public static assets. Private notes and authenticated API responses must not be placed in a shared public cache unless the caching policy explicitly guarantees correct authorization and isolation.

9. Avoiding Single Points of Failure

1. Application servers: Run multiple instances and use load-balancer health checks so one failed server does not take down the service.
2. Load balancing and network entry: Use a managed or redundant load-balancing service and highly available DNS.
3. Database: Deploy the primary database and replica across separate availability zones where supported, with monitored replication and a tested failover procedure.
4. Cache: Configure timeouts and a fallback strategy so a cache outage can temporarily route suitable requests to the database, with rate controls to avoid overwhelming it.
5. Message queue: Use a durable, highly available queue, retries, and a dead-letter queue for jobs that repeatedly fail.
6. Backups and recovery: Schedule database backups, test restoration regularly, and document recovery procedures.
7. Monitoring: Track error rates, latency, CPU, memory, database connections, cache hit rate, and queue depth so the team can detect failures early.

10. Conclusion

The proposed QuickNotes architecture separates user-facing requests from background processing and combines multiple application servers, caching, a relational database, and a read replica to support growth. The load estimates provide an initial planning baseline, while monitoring and load testing should guide future scaling decisions. Reliability depends not only on redundant components but also on tested failover, backups, security controls, and operational monitoring.
