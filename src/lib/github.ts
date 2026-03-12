const GITHUB_TOKEN = import.meta.env.GH_TOKEN;
const GITHUB_REPO = import.meta.env.GH_REPO;
const GITHUB_BRANCH = import.meta.env.GH_BRANCH ?? 'dev';
const API_BASE = 'https://api.github.com';

// Récupère le SHA d'un fichier (nécessaire pour le modifier ou supprimer)
export async function getFileSha(path: string): Promise<string | null> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.sha;
}

// Lit le contenu d'un fichier
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

// Crée ou met à jour un fichier
export async function putFile(path: string, content: string, message: string, sha?: string): Promise<boolean> {
  const body: Record<string, unknown> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: GITHUB_BRANCH,
  };

  if (sha) body.sha = sha;

  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.ok;
}

// Supprime un fichier
export async function deleteFile(path: string, message: string, sha: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH }),
  });

  return response.ok;
}

// Upload une image en base64
export async function uploadImage(path: string, base64WithPrefix: string): Promise<boolean> {
  // Retire le préfixe "data:image/jpeg;base64,"
  const base64 = base64WithPrefix.split(',')[1];
  const sha = await getFileSha(path);

  const body: Record<string, unknown> = {
    message: `admin: upload image ${path}`,
    content: base64,
    branch: GITHUB_BRANCH,
  };

  if (sha) body.sha = sha;

  const response = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return response.ok;
}