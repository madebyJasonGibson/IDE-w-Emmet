/* --- Shared State --- */

/* @tweakable initial file structure */
export let fs = {
  'root': {
    type: 'folder',
    children: {
      'index.html': { type: 'file', content: `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Sample Page</title>
  <meta name="description" content="An example description.">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="favicon.ico">
</head>
<body>
  <h1>Hello World</h1>
  <img src="example.jpg" alt="Example image">
  <a href="https://external.com">External Link</a>
  <a href="/internal">Internal Link</a>
</body>
</html>` },
      'scripts': { type: 'folder', children: {
        'app.js': { type: 'file', content: `console.log('Hello from app.js!');` }
      } }
    }
  }
};

export let openFiles = []; // array of {path, name}
export let currentFile = null;
export let editor = null; // Monaco editor instance

// Function to update editor instance once initialized
export function setEditor(editorInstance) {
    editor = editorInstance;
}

// Function to update state after file manager operations
// This is a simple approach; a more complex app might use events
export function updateState(newFs, newOpenFiles, newCurrentFile) {
    fs = newFs;
    openFiles = newOpenFiles;
    currentFile = newCurrentFile;
}
