import type { APIRoute } from 'astro';
import { getFileContent, getFileSha, putFile, deleteFile } from '../../../lib/github';

export const DELETE: APIRoute = async ({ request }) => {
  const { id, src } = await request.json();

  if (!id || !src) {
    return new Response(JSON.stringify({ error: 'Données manquantes' }), { status: 400 });
  }

  // Supprime l'image
  const imagePath = `public${src}`;
  const imageSha = await getFileSha(imagePath);
  if (imageSha) {
    await deleteFile(imagePath, `admin: suppression image ${id}`, imageSha);
  }

  // Lit le gallery.json actuel
  const jsonContent = await getFileContent('src/data/gallery.json');
  if (!jsonContent) {
    return new Response(JSON.stringify({ error: "Erreur lecture gallery.json" }), { status: 500 });
  }

  const gallery = JSON.parse(jsonContent);
  gallery.images = gallery.images.filter((img: { id: string }) => img.id !== id);

  // Met à jour gallery.json
  const sha = await getFileSha('src/data/gallery.json');
  const updated = await putFile(
    'src/data/gallery.json',
    JSON.stringify(gallery, null, 2),
    `admin: suppression image ${id}`,
    sha as string
  );

  if (!updated) {
    return new Response(JSON.stringify({ error: "Erreur mise à jour gallery.json" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};