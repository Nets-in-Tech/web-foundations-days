# Library Books REST API Design

This document specifies the REST API design for managing a library's `books` resource.

---

## Endpoints

- **List All Books**
  - **Method:** `GET`
  - **Path:** `/api/v1/books`
  - **Description:** Retrieves a list of all books available in the library collection.
  - **Success Status Code:** `200 OK`

- **Filter Books by Author**
  - **Method:** `GET`
  - **Path:** `/api/v1/books?author={authorName}`
  - **Description:** Retrieves a list of books written by a specific author passed as a query parameter.
  - **Success Status Code:** `200 OK`

- **Get a Single Book**
  - **Method:** `GET`
  - **Path:** `/api/v1/books/{id}`
  - **Description:** Retrieves detailed information for a specific book by its unique ID.
  - **Success Status Code:** `200 OK`

- **Create a New Book**
  - **Method:** `POST`
  - **Path:** `/api/v1/books`
  - **Description:** Adds a new book entry to the library database.
  - **Example Request Body:**
    ```json
    {
      "title": "The Pragmatic Programmer",
      "author": "Andrew Hunt",
      "isbn": "978-0201616224",
      "publishedYear": 1999
    }
    ```
  - **Success Status Code:** `201 Created`

- **Update an Existing Book**
  - **Method:** `PUT`
  - **Path:** `/api/v1/books/{id}`
  - **Description:** Completely updates the details of an existing book record.
  - **Example Request Body:**
    ```json
    {
      "title": "The Pragmatic Programmer: 20th Anniversary Edition",
      "author": "Andrew Hunt",
      "isbn": "978-0135957059",
      "publishedYear": 2019
    }
    ```
  - **Success Status Code:** `200 OK`

- **Delete a Book**
  - **Method:** `DELETE`
  - **Path:** `/api/v1/books/{id}`
  - **Description:** Permanently removes a book entry from the library database.
  - **Success Status Code:** `204 No Content`

---

## Common Error Codes

- **HTTP 400 Bad Request**
  - **When it occurs:** Occurs when the client submits invalid or missing payload data during creation or update operations.
  - **Example:** Submitting a `POST /api/v1/books` request missing required fields like `title` or sending an invalid data type for `publishedYear` (e.g., `"publishedYear": "Nineteen Ninety Nine"`).

- **HTTP 404 Not Found**
  - **When it occurs:** Occurs when the requested resource or URL path does not exist on the server.
  - **Example:** Sending a `GET /api/v1/books/99999` request when no book exists with ID `99999`.