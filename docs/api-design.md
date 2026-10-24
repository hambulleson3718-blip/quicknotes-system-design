# QuickNotes API Design

## 1. Overview

QuickNotes is an online note-taking service that allows authenticated users to create, view, update, and delete notes. Users can organize their notes with tags.

The API follows REST principles and uses HTTP methods to perform operations on resources. Data is exchanged in JSON format over HTTPS.

### Base URL

Production base URL:

`https://api.quicknotes.example.com/v1`

The domain above is a placeholder for the future production service.

### General conventions

- All requests and responses use JSON unless otherwise stated.
- HTTPS is required in production.
- Authentication uses a bearer access token.
- Note IDs, user IDs, and tag IDs are unique identifiers.
- Timestamps use ISO 8601 format in UTC.
- List endpoints support pagination.
- Clients must not assume that a successful request means data has been permanently stored unless the API confirms success.

## 2. REST Endpoint Reference

| Method | Path | Description | Success status |
|---|---|---|---|
| POST | `/auth/register` | Register a new user account | 201 Created |
| POST | `/auth/login` | Authenticate a user and issue tokens | 200 OK |
| GET | `/notes` | List the authenticated user's notes | 200 OK |
| POST | `/notes` | Create a new note | 201 Created |
| GET | `/notes/{noteId}` | Retrieve one note by ID | 200 OK |
| PATCH | `/notes/{noteId}` | Update selected fields of a note | 200 OK |
| DELETE | `/notes/{noteId}` | Delete a note | 204 No Content |
| GET | `/tags` | List the user's tags | 200 OK |
| POST | `/tags` | Create a tag | 201 Created |
| PUT | `/notes/{noteId}/tags/{tagId}` | Associate a tag with a note | 204 No Content |
| DELETE | `/notes/{noteId}/tags/{tagId}` | Remove a tag association | 204 No Content |

All note and tag operations require authentication. A user can access only resources they are authorized to access.

## 3. List Notes

### Request

`GET /v1/notes?page=1&limit=10`

Headers:

`Authorization: Bearer <access_token>`

### Successful response — 200 OK

```json
{
  "data": [
    {
      "id": "note_101",
      "title": "My first note",
      "body": "Learning REST APIs.",
      "userId": "user_12",
      "createdAt": "2026-10-24T08:00:00Z",
      "updatedAt": "2026-10-24T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

The server returns only notes belonging to the authenticated user. An empty collection returns an empty `data` array.

## 4. Create a Note

### Request

`POST /v1/notes`

Headers:

- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

Request body:

```json
{
  "title": "Revision plan",
  "body": "Revise Chemistry and Mathematics."
}
```

### Successful response — 201 Created

The response includes the new resource and its identifier.

```json
{
  "data": {
    "id": "note_102",
    "title": "Revision plan",
    "body": "Revise Chemistry and Mathematics.",
    "userId": "user_12",
    "createdAt": "2026-10-24T08:15:00Z",
    "updatedAt": "2026-10-24T08:15:00Z"
  }
}
```

The server generates the note ID, associates the note with the authenticated user, and stores the note in the database.

## 5. Retrieve, Update and Delete a Note

### Retrieve one note

`GET /v1/notes/{noteId}`

Returns `200 OK` with the note representation if it exists and the user is authorized to access it.

### Update a note

`PATCH /v1/notes/{noteId}`

Example request body:

```json
{
  "title": "Updated revision plan"
}
```

Returns `200 OK` with the updated note. Only supplied fields are changed. The title must not exceed 100 characters.

### Delete a note

`DELETE /v1/notes/{noteId}`

Returns `204 No Content` when deletion succeeds. The response has no body. The operation also removes associated rows from the `note_tags` relationship table.

## 6. Tags

### List tags

`GET /v1/tags`

Returns `200 OK` with the authenticated user's tags.

### Create a tag

`POST /v1/tags`

Example request:

```json
{
  "name": "School"
}
```

Returns `201 Created` with the new tag resource.

### Associate a tag with a note

`PUT /v1/notes/{noteId}/tags/{tagId}`

Returns `204 No Content` when the association is created. The server verifies that both resources belong to the authenticated user.

### Remove a tag association

`DELETE /v1/notes/{noteId}/tags/{tagId}`

Returns `204 No Content` when the association is removed.

## 7. Authentication

Protected endpoints require:

`Authorization: Bearer <access_token>`

The authentication service validates the token and identifies the user. Expired, missing, or invalid credentials are rejected.

## 8. Error Status Codes

| HTTP status | Name | Meaning |
|---|---|---|
| 400 | Bad Request | Invalid JSON, missing required fields, or invalid input |
| 401 | Unauthorized | Authentication is missing or invalid |
| 403 | Forbidden | The user is authenticated but lacks permission |
| 404 | Not Found | The requested resource does not exist or is not accessible |
| 409 | Conflict | A duplicate or conflicting resource prevents the operation |
| 422 | Unprocessable Content | The request is understood but fails a business validation rule |
| 429 | Too Many Requests | The client exceeded a rate limit |
| 500 | Internal Server Error | An unexpected server-side failure occurred |
| 503 | Service Unavailable | The service is temporarily unavailable |

## 9. Example Error Response

For a request with a missing title, the server may return `400 Bad Request`.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The title field is required.",
    "details": [
      {
        "field": "title",
        "issue": "Required field is missing."
      }
    ],
    "requestId": "req_a83f21"
  }
}
```

The server must not return passwords, access tokens, database credentials, or internal stack traces in error responses.

## 10. API Design Decisions

- **REST:** Resources such as notes and tags have clear URLs and use standard HTTP methods.
- **JSON:** JSON is easy to exchange between browser clients, mobile applications, and backend services.
- **Authentication:** Bearer tokens identify users, and authorization checks prevent access to another user's data.
- **Validation:** The backend enforces required titles and a maximum title length of 100 characters.
- **Pagination:** List endpoints limit response size and help the service handle large collections.
- **Consistent errors:** A standard error structure helps clients handle failures predictably.
- **HTTPS:** Encrypts data in transit between clients and the API.
- **Database transactions:** Operations involving notes and their tag associations should maintain referential integrity.
