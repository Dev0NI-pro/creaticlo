import type { APIRoute } from 'astro';
import { getFileContent, getFileSha, putFile, uploadImage } from '../../../lib/github';

export const PUT: APIRoute = async ({ request }) => {
  const { id, src, alt, description, featured, image } = await request.json();

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID manquant' }), { status: 400 });
  }

  // Lit le gallery.json actuel
  const jsonContent = await getFileContent('src/data/gallery.json');
  if (!jsonContent) {
    return new Response(JSON.stringify({ error: "Erreur lecture gallery.json" }), { status: 500 });
  }

  const gallery = JSON.parse(jsonContent);
  const index = gallery.images.findIndex((img: { id: string }) => img.id === id);

  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Image non trouvée' }), { status: 404 });
  }

  // Met à jour les champs fournis
  if (alt !== undefined) gallery.images[index].alt = alt;
  if (description !== undefined) gallery.images[index].description = description;
  if (featured !== undefined) gallery.images[index].featured = featured;

  // Si une nouvelle image est fournie
  if (image) {
    const imagePath = `public${src}`;
    await uploadImage(imagePath, image);
  }

  // Met à jour gallery.json
  const sha = await getFileSha('src/data/gallery.json');
  const updated = await putFile(
    'src/data/gallery.json',
    JSON.stringify(gallery, null, 2),
    `admin: modification image ${id}`,
    sha as string
  );

  if (!updated) {
    return new Response(JSON.stringify({ error: "Erreur mise à jour gallery.json" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};