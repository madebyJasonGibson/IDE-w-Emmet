import { fs, openFiles, currentFile, updateState, editor } from './state.js';
import { getNodeByPath, deleteNode, moveFile } from './fileManager.js'; // Import necessary file ops
import { setEditorValue } from './editorManager.js'; // Import editor update function
import { hideSidebar, isMobileView } from './mobileSidebar.js'; // Import mobile sidebar functions

/* --- UI Rendering and Interaction --- */

export function renderFileTree() {
  const container = document.getElementById('fileTree');
  if (!container) {
      console.error("File tree container not found!");
      return;
  }
  container.innerHTML = '';

  function makeTree(node, path, depth=0) {
    const li = document.createElement('li');
    li.className = 'my-0.5 ml-'+(depth*3);
    if (path !== 'root') {
        li.setAttribute('draggable', 'true');
        li.ondragstart = e => { e.dataTransfer.setData('text/plain', path); };
    }
    if (node.type === 'folder' || path === 'root') {
        li.ondragover = e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); };
        li.ondragleave = e => e.currentTarget.classList.remove('drag-over');
        li.ondrop = e => {
          e.preventDefault();
          e.currentTarget.classList.remove('drag-over');
          const from = e.dataTransfer.getData('text/plain');
          const targetPath = path === 'root' ? 'root' : path;
          moveFile(from, targetPath);
        };
    } else {
        li.ondragover = e => e.preventDefault();
    }

    if (node.type === 'folder') {
      li.innerHTML = `<span class="draggable cursor-pointer font-bold text-blue-300" onclick="window.toggleFolder(this)">${node.expanded!==false?'📂':'📁'} ${path.split('/').slice(-1)[0]}</span>
      <button onclick="window.addFileDialog('${path}')" title="Add file" class="text-blue-400 hover:text-blue-300 text-xl font-bold px-2">+</button>
      <button onclick="window.addFolderDialog('${path}')" title="Add folder" class="text-blue-400 hover:text-blue-300 text-xl font-bold px-1">📁</button>
      ${path !== 'root' ? `<button onclick="window.deleteNode('${path}')" title="Delete folder" class="text-red-400 hover:text-red-300 ml-1">🗑️</button>` : ''}`;
      if(node.expanded!==false) {
        const ul = document.createElement('ul');
        const sortedKeys = Object.keys(node.children).sort((a, b) => {
            const aIsFolder = node.children[a].type === 'folder';
            const bIsFolder = node.children[b].type === 'folder';
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.localeCompare(b);
        });
         for(let sortedKey of sortedKeys) {
             ul.appendChild(makeTree(node.children[sortedKey], path+'/'+sortedKey, depth+1));
         }
        li.appendChild(ul);
      }
    } else {
      li.innerHTML = `<span class="draggable cursor-pointer text-blue-100 hover:underline" onclick="window.openFile('${path}')">${path.split('/').slice(-1)[0]}</span>
      <button onclick="window.deleteNode('${path}')" title="Delete file" class="text-red-400 hover:text-red-300 ml-1">🗑️</button>`;
    }
    return li;
  }

  const rootNode = getNodeByPath('root');
   if (rootNode && rootNode.type === 'folder') {
        const sortedKeys = Object.keys(rootNode.children).sort((a, b) => {
            const aIsFolder = rootNode.children[a].type === 'folder';
            const bIsFolder = rootNode.children[b].type === 'folder';
            if (aIsFolder && !bIsFolder) return -1;
            if (!aIsFolder && bIsFolder) return 1;
            return a.localeCompare(b);
        });
         for(let sortedKey of sortedKeys) {
             container.appendChild(makeTree(rootNode.children[sortedKey], 'root/'+sortedKey, 0));
         }
   }

  container.ondragover = e => { e.preventDefault(); container.classList.add('drag-over'); };
  container.ondragleave = () => container.classList.remove('drag-over');
  container.ondrop = e => {
      e.preventDefault();
      container.classList.remove('drag-over');
      const from = e.dataTransfer.getData('text/plain');
      moveFile(from, 'root');
  };
}

export function toggleFolder(span) {
  const li = span.closest('li');
  if (!li) return;
  const path = li.getAttribute('ondragstart').match(/'(.*?)'/)?.[1];
  if (!path) {
      console.error("Could not determine path for toggleFolder");
      return;
  }

  let curr = getNodeByPath(path);
  if (curr && curr.type === 'folder') {
      curr.expanded = curr.expanded !== false;
      updateState(fs, openFiles, currentFile);
      renderFileTree();
  }
}

export function openFile(path) {
  const file = getNodeByPath(path);
  if(!file || file.type!=='file') {
      console.warn(`Attempted to open non-file path: ${path}`);
      if (currentFile === path) {
           setEditorValue('');
           updateState(fs, openFiles.filter(f => f.path !== path), null);
           renderTabs();
      }
      return;
  }
  if(!openFiles.some(f=>f.path===path)) {
      const maxOpenTabs = 10;
      if (openFiles.length >= maxOpenTabs) {
          const oldestFile = openFiles.shift();
          console.log(`Max tabs reached, closing oldest: ${oldestFile.name}`);
          if (currentFile === oldestFile.path) {
          }
      }
      openFiles.push({path, name: path.split('/').pop()});
  }

  updateState(fs, openFiles, path);

  setEditorValue(file.content, path);

  renderTabs();

  if(path.endsWith('.html')) {
    const outputFrame = document.getElementById("outputFrame");
    if (outputFrame && outputFrame.contentWindow) {
        outputFrame.contentWindow.document.open();
        outputFrame.contentWindow.document.write(file.content);
        outputFrame.contentWindow.document.close();
    } else {
        console.error("Output iframe not found or not accessible.");
    }
  } else {
       const outputFrame = document.getElementById("outputFrame");
        if (outputFrame && outputFrame.contentWindow) {
            outputFrame.contentWindow.document.open();
            outputFrame.contentWindow.document.write('<!-- No preview available for this file type -->');
            outputFrame.contentWindow.document.close();
        }
  }

  if (isMobileView()) {
    hideSidebar();
  }
}

export function renderTabs() {
  const tabs = document.getElementById('tabs');
    if (!tabs) {
      console.error("Tabs container not found!");
      return;
  }
  tabs.innerHTML = '';

  for(const file of openFiles) {
    const isActive = file.path===currentFile;
    const tab = document.createElement('div');
    tab.className = 'inline-block px-3 py-1 mx-1 rounded-t font-semibold cursor-pointer flex-shrink-0 '+(isActive?'bg-blue-800 text-white':'bg-slate-700 text-blue-100 hover:bg-slate-800');
    tab.textContent = file.name;
    tab.onclick = () => openFile(file.path);
    tabs.appendChild(tab);
  }

   if (currentFile === null) {
       tabs.innerHTML = '';
   }
}

window.renderFileTree = renderFileTree;
window.toggleFolder = toggleFolder;
window.openFile = openFile;
window.renderTabs = renderTabs;
