const GITHUB_TOKEN = import.meta.env.GH_TOKEN;
const GITHUB_REPO = import.meta.env.GH_REPO;
const GITHUB_BRANCH = import.meta.env.GH_BRANCH ?? 'netlify-staging';
const API_BASE = 'https://api.github.com';

// Récupère le SHA du dernier commit de la branche
async function getLatestCommitSha(): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  const data = await response.json();
  return data.object.sha;
}

// Récupère le SHA du tree du dernier commit
async function getTreeSha(commitSha: string): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/git/commits/${commitSha}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  const data = await response.json();
  return data.tree.sha;
}

// Crée un blob pour un fichier texte
async function createBlob(content: string, encoding: 'utf-8' | 'base64' = 'utf-8'): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/git/blobs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, encoding }),
  });
  const data = await response.json();
  return data.sha;
}

// Crée un tree avec tous les fichiers modifiés
async function createTree(
  baseTreeSha: string,
  files: { path: string; sha: string | null; content?: string }[]
): Promise<string> {
  const tree = files.map(f => f.sha === null
    ? { path: f.path, mode: '100644' as const, type: 'blob' as const, sha: null }
    : { path: f.path, mode: '100644' as const, type: 'blob' as const, sha: f.sha }
  );

  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/git/trees`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  });
  const data = await response.json();
  return data.sha;
}

// Crée un commit
async function createCommit(message: string, treeSha: string, parentSha: string): Promise<string> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/git/commits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
  });
  const data = await response.json();
  return data.sha;
}

// Met à jour la référence de la branche
async function updateRef(commitSha: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/git/refs/heads/${GITHUB_BRANCH}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sha: commitSha }),
  });
  return response.ok;
}

// Lit le contenu d'un fichier (pour gallery.json)
export async function getFileContent(path: string): Promise<string | null> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

export interface FileChange {
  path: string;          // chemin dans le repo ex: "public/images/gallery/gallery-123.jpg"
  content: string;       // contenu base64 (image) ou texte (json)
  encoding: 'utf-8' | 'base64';
  deleted?: boolean;     // true pour supprimer le fichier
}

// Commit unique avec tous les fichiers — le git add . && git commit && git push
export async function commitAll(message: string, changes: FileChange[]): Promise<boolean> {
  try {
    // 1. Récupère le dernier commit
    const latestCommitSha = await getLatestCommitSha();
    const baseTreeSha = await getTreeSha(latestCommitSha);

    // 2. Crée les blobs pour chaque fichier modifié/ajouté
    const treeFiles: { path: string; sha: string | null }[] = [];

    for (const file of changes) {
      if (file.deleted) {
        // sha: null = suppression dans l'API GitHub Trees
        treeFiles.push({ path: file.path, sha: null });
      } else {
        const blobSha = await createBlob(file.content, file.encoding);
        treeFiles.push({ path: file.path, sha: blobSha });
      }
    }

    // 3. Crée le tree
    const newTreeSha = await createTree(baseTreeSha, treeFiles);

    // 4. Crée le commit
    const newCommitSha = await createCommit(message, newTreeSha, latestCommitSha);

    // 5. Met à jour la branche → UN SEUL déploiement Netlify
    return await updateRef(newCommitSha);

  } catch (e) {
    console.error('commitAll error:', e);
    return false;
  }
}