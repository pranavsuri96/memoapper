document.getElementById('save-note').addEventListener('click', async () => {
  const { v4: uuidv4 } = await import('https://cdn.jsdelivr.net/npm/uuid@9.0.1/dist/esm-browser/index.js');
  const content = document.getElementById('note-content').value;
  const noteId = uuidv4(); // Generate a random noteId

  const response = await fetch('/save-note', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ noteId, content }),
  });

  const result = await response.json();
  if (result.success) {
    const noteUrl = `${window.location.origin}/get-note/${noteId}`;
    document.getElementById('share-link').value = noteUrl;
    document.getElementById('note-link').classList.remove('hidden');
    alert('Note saved successfully!');
  } else {
    alert('Error saving note');
  }
});