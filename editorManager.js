import { currentFile, fs, editor, setEditor, updateState } from './state.js';
import { getNodeByPath } from './fileManager.js';

/* --- Monaco Editor Management --- */

// Monaco loader configuration is done in index.html <script> block

export function initEditor() {
  if (editor) {
      console.warn("Monaco editor already initialized.");
      return;
  }

  require(["vs/editor/editor.main"], function() {
    window.monaco.languages.html.htmlDefaults.options.suggest.doctype = true;
    const newEditor = monaco.editor.create(document.getElementById("editor"), {
      value: "",
      language: "html",
      theme: "vs-dark",
      /* @tweakable editor font size */
      fontSize: 15,
      wordWrap: "on",
       minimap: { enabled: false }
    });

    setEditor(newEditor);

    console.log("Monaco editor initialized.");
  });
}

export function setEditorValue(content, path = null) {
    if (!editor) {
        console.error("Editor not initialized.");
        return;
    }
    editor.setValue(content);
     if (path) {
        const ext = path.split('.').pop();
        let lang = ext==='js' ? 'javascript' : ext==='css' ? 'css' : ext==='json' ? 'json' : 'html';
         if (monaco.languages.getLanguages().some(l => l.id === lang)) {
            monaco.editor.setModelLanguage(editor.getModel(), lang);
         } else {
             console.warn(`Monaco language "${lang}" not found, defaulting to plain text.`);
              monaco.editor.setModelLanguage(editor.getModel(), 'plaintext');
         }
    } else {
         monaco.editor.setModelLanguage(editor.getModel(), 'plaintext');
    }
}

export function getEditorValue() {
     if (!editor) {
        console.error("Editor not initialized.");
        return "";
    }
    return editor.getValue();
}

export function saveFile() {
  if(!currentFile) {
      alert('No file is currently open to save.');
      return;
  }
  const node = getNodeByPath(currentFile);
  if(!node || node.type !== 'file') {
      alert('Cannot save a non-file item.');
      return;
  }

  node.content = getEditorValue();

  updateState(fs, openFiles, currentFile);

  console.log(`File saved: ${currentFile}`);

  if(currentFile.endsWith('.html')) {
    const outputFrame = document.getElementById("outputFrame");
     if (outputFrame && outputFrame.contentWindow) {
        outputFrame.contentWindow.document.open();
        outputFrame.contentWindow.document.write(node.content);
        outputFrame.contentWindow.document.close();
    } else {
        console.error("Output iframe not found or not accessible for saving.");
    }
  }
}

window.saveFile = saveFile;
