import { editor, setEditor, currentFile } from './state.js'; // Import state variables
import { initEditor } from './editorManager.js'; // Import editor initialization
import { renderFileTree, openFile } from './uiManager.js'; // Import UI rendering and file opening
import { initMobileSidebar } from './mobileSidebar.js'; // Import mobile sidebar initialization


require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs" } });
require(["vs/editor/editor.main"], function() {
  console.log("Monaco loader finished.");
  initEditor(); // Initialize the Monaco editor
   setTimeout(() => {
       console.log("Opening initial file: root/index.html");
       openFile('root/index.html'); // Open the default file
   }, 100);
});

initMobileSidebar();

renderFileTree();

console.log("main.js loaded.");
