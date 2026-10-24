const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const submitButton = document.getElementById("submit-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

// Display loading, success, error and other status messages.
function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

// Reusable HTTP request function.
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return {
    data: await response.json(),
    status: response.status
  };
}

// Display an empty-state message when there are no notes.
function showEmptyState() {
  const emptyItem = document.createElement("li");
  emptyItem.textContent = "No notes available yet.";
  emptyItem.className = "empty-state";
  notesList.replaceChildren(emptyItem);
}

// Display a note safely and provide a Delete button.
function displayNote(note, addToTop = false) {
  const item = document.createElement("li");
  item.className = "note";
  item.dataset.id = note.id;

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body || "No body provided.";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.className = "delete-btn";

  deleteButton.addEventListener("click", () => {
    deleteNote(note.id, item, deleteButton);
  });

  item.append(title, body, deleteButton);

  if (addToTop) {
    notesList.prepend(item);
  } else {
    notesList.appendChild(item);
  }
}

// GET: Load the first 10 notes.
async function loadNotes() {
  loadButton.disabled = true;
  setStatus("Loading notes...", "loading");
  notesList.replaceChildren();

  try {
    const result = await request(`${API_URL}?_limit=10`);
    const notes = result.data;

    if (notes.length === 0) {
      showEmptyState();
      setStatus("No notes found.", "success");
      return;
    }

    notes.forEach(note => displayNote(note));

    setStatus(
      `Loaded ${notes.length} notes from the server.`,
      "success"
    );
  } catch (error) {
    console.error("GET request failed:", error);

    setStatus(
      "Sorry, we could not load your notes. Please try again.",
      "error"
    );
  } finally {
    loadButton.disabled = false;
  }
}

// POST: Create a new note.
async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    setStatus("Please enter a title for your note.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    setStatus(
      "The title must not exceed 100 characters.",
      "error"
    );
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  setStatus("Creating note...", "loading");

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        body,
        userId: 1
      })
    });

    const note = result.data;

    // JSONPlaceholder simulates POST; it does not persist new notes.
    // Display the returned note in the current page only.
    displayNote(note, true);

    setStatus(
      `Note created (status ${result.status}, id ${note.id}).`,
      "success"
    );

    noteForm.reset();
  } catch (error) {
    console.error("POST request failed:", error);

    setStatus(
      "Sorry, we could not create your note. Please try again.",
      "error"
    );
  } finally {
    submitButton.disabled = false;
  }
}

// DELETE: Remove a note from the current page after success.
async function deleteNote(id, item, deleteButton) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this note?"
  );

  if (!confirmed) {
    return;
  }

  deleteButton.disabled = true;
  setStatus("Deleting note...", "loading");

  try {
    const result = await request(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    // JSONPlaceholder simulates DELETE and does not permanently
    // change its stored posts. Remove the note from this page only.
    item.remove();

    if (notesList.querySelectorAll(".note").length === 0) {
      showEmptyState();
    }

    setStatus(
      `Note ${id} deleted successfully (status ${result.status}).`,
      "success"
    );
  } catch (error) {
    console.error("DELETE request failed:", error);

    deleteButton.disabled = false;

    setStatus(
      "Sorry, we could not delete this note. Please try again.",
      "error"
    );
  }
}

// Connect page controls to their functions.
loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

