import { fs, openFiles, currentFile, updateState } from './state.js';
import { renderFileTree, renderTabs, openFile } from './uiManager.js'; // Import UI update functions

/* --- File system management --- */

export function getNodeByPath(path) {
  const segs = path.split('/').slice(1);
  let node = fs.root;
  for(let i=0;i<segs.length;i++) {
    if (!node.children || !node.children[segs[i]]) return null; // Prevent error on non-existent path
    node = node.children[segs[i]];
  }
  return node;
}

export function addFileDialog(base='root') {
  const name = prompt('Enter file name (e.g. about.html):');
  if(!name) return;

  if (name.includes('/') || name.includes('\\')) {
      alert('File name cannot contain slashes.');
      return;
  }

  let node = getNodeByPath(base);
  if(!node || node.type!=='folder') { alert('Invalid base path for adding file'); return; } // Validate base is a folder
  if(node.children[name]) return alert('File/folder exists');

  node.children[name] = { type: 'file', content: '' };
  node.expanded = true;

  updateState(fs, openFiles, currentFile);
  renderFileTree();
}

export function addFolderDialog(base='root') {
  const name = prompt('Enter folder name:');
  if(!name) return;

  if (name.includes('/') || name.includes('\\')) {
      alert('Folder name cannot contain slashes.');
      return;
  }

  let node = getNodeByPath(base);
  if(!node || node.type!=='folder') { alert('Invalid base path for adding folder'); return; } // Validate base is a folder
  if(node.children[name]) return alert('File/folder exists');

  node.children[name] = { type: 'folder', children: {}, expanded:true };
  node.expanded = true;

  updateState(fs, openFiles, currentFile);
  renderFileTree();
}

export function deleteNode(path) {
  if(path==='root/index.html') return alert("Can't delete main file");
  if(!confirm('Delete this item?')) return;

  const segs = path.split('/');
  const key = segs.pop();
  const parentPath = segs.join('/');
  let parent = getNodeByPath(parentPath);
  if(!parent || !parent.children || !parent.children[key]) return alert('Item not found'); // Validate item exists in parent

  delete parent.children[key];

  const newOpenFiles = openFiles.filter(f => !f.path.startsWith(path));
  let newCurrentFile = currentFile;
  if(currentFile === path) {
      newCurrentFile = newOpenFiles.length ? newOpenFiles[0].path : null;
  } else if (path.startsWith(currentFile + '/')) {
       newCurrentFile = newOpenFiles.length ? newOpenFiles[0].path : null;
  }


  updateState(fs, newOpenFiles, newCurrentFile);
  renderFileTree();
  renderTabs();
  if (newCurrentFile !== currentFile) {
      if(newCurrentFile) openFile(newCurrentFile);
      else window.editor.setValue('');
  }
}

export function moveFile(from, to) {
  if(from===to) return alert('Cannot move to the same location');
  let node = getNodeByPath(from);
  let toNode = getNodeByPath(to);
  if(!node) return alert('Source item not found'); // Validate source exists
  if(!toNode || toNode.type!=='folder') return alert('Can only move into folders');

  const segs = from.split('/');
  const key = segs.pop();
  const parentPath = segs.join('/');
  let parent = getNodeByPath(parentPath);
  if(!parent || !parent.children || !parent.children[key]) return alert('Source item not found in parent'); // Validate source exists in parent

  if (to.startsWith(from + '/')) {
      return alert('Cannot move a folder into its own child');
  }
  if (toNode.children[key]) {
      return alert(`An item named "${key}" already exists in the target folder.`);
  }

  toNode.children[key] = node;
  delete parent.children[key];

  const oldPrefix = from;
  const newPrefix = to + '/' + key;
  const newOpenFiles = openFiles.map(f => {
      if (f.path === oldPrefix) {
          return { path: newPrefix, name: key };
      } else if (f.path.startsWith(oldPrefix + '/')) {
          const suffix = f.path.substring(oldPrefix.length);
          return { path: newPrefix + suffix, name: f.name };
      }
      return f;
  });
  const newCurrentFile = currentFile && currentFile.startsWith(oldPrefix)
      ? newPrefix + (currentFile.length > oldPrefix.length ? currentFile.substring(oldPrefix.length) : '')
      : currentFile;


  updateState(fs, newOpenFiles, newCurrentFile);
  renderFileTree();
  renderTabs();
}


export function renameCurrentFile() {
  if(!currentFile) return;
  const segs = currentFile.split('/');
  const key = segs.pop();
  const parentPath = segs.join('/');
  const parent = getNodeByPath(parentPath);
  if(!parent || !parent.children || !parent.children[key]) return alert('Current file not found'); // Validate current file exists

  const newName = prompt('New name:', key);
  if(!newName || newName===key) return;

  if (newName.includes('/') || newName.includes('\\')) {
      return alert('File name cannot contain slashes.');
  }
   if (parent.children[newName]) {
      return alert(`An item named "${newName}" already exists in this folder.`);
  }

  parent.children[newName] = parent.children[key];
  delete parent.children[key];
  const newPath = [...segs,newName].join('/');

  const newOpenFiles = openFiles.map(f => f.path===currentFile ? {path: newPath, name: newName} : f);
  const newCurrentFile = newPath;

  updateState(fs, newOpenFiles, newCurrentFile);
  renderFileTree();
  renderTabs();
}

export function deleteCurrentFile() {
  if(!currentFile) return;
  deleteNode(currentFile);
}

window.addFileDialog = addFileDialog;
window.addFolderDialog = addFolderDialog;
window.deleteNode = deleteNode;
window.moveFile = moveFile;
window.renameCurrentFile = renameCurrentFile;
window.deleteCurrentFile = deleteCurrentFile;
