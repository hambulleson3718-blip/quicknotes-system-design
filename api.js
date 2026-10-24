const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const statusMessage = document.getElementById("status");
const notesList = document.getElementById("notes-list");

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = type;
}

// Reusable function for sending HTTP requests.
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

// Display notes safely using textContent.
function displayNote(note) {
  const item = document.createElement("li");
  item.className = "note";

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body || "No body provided.";

  item.append(title, body);
  notesList.appendChild(item);
}

// Load the first 10 notes from the API.
async function loadNotes() {
  loadButton.disabled = true;
  setStatus("Loading notes...", "loading");
  notesList.replaceChildren();

  try {
    const notes = await request(`${API_URL}?_limit=10`);

    if (notes.length === 0) {
      setStatus("No notes found.", "success");
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "No notes available yet.";
      notesList.appendChild(emptyItem);
      return;
    }

    notes.forEach(displayNote);
    setStatus(
      `Loaded ${notes.length} notes from the server.`,
      "success"
    );
  } catch (error) {
    console.error("Unable to load notes:", error);
    setStatus(
      "Sorry, we could not load your notes. Please try again.",
      "error"
    );
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);