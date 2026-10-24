const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const submitButton = document.getElementById("submit-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

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

// Display a note safely without interpreting user text as HTML.
function displayNote(note, addToTop = false) {
  const item = document.createElement("li");
  item.className = "note";
  item.dataset.id = note.id;

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body || "No body provided.";

  item.append(title, body);

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
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "No notes available yet.";
      notesList.appendChild(emptyItem);
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

// POST: Create a note.
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
    setStatus("The title must not exceed 100 characters.", "error");
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

    // JSONPlaceholder simulates POST but does not persist new posts.
    // Keep the returned note in the current page so the user can see it.
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

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);
