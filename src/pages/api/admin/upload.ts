import type { APIRoute } from 'astro';
import { getFileContent, putFile, uploadImage } from '../../../lib/github';

export const POST: APIRoute = async ({ request }) => {
  const { image, alt, description, featured } = await request.json();

  if (!image || !alt) {
    return new Response(JSON.stringify({ error: 'Données manquantes' }), { status: 400 });
  }

  // Génère un id unique basé sur le timestamp
  const id = Date.now().toString();
  const imagePath = `public/images/gallery/gallery-${id}.jpg`;
  const imageSrc = `/images/gallery/gallery-${id}.jpg`;

  // Upload l'image
  const imageUploaded = await uploadImage(imagePath, image);
  if (!imageUploaded) {
    return new Response(JSON.stringify({ error: "Erreur upload image" }), { status: 500 });
  }

  // Lit le gallery.json actuel
  const jsonContent = await getFileContent('src/data/gallery.json');
  if (!jsonContent) {
    return new Response(JSON.stringify({ error: "Erreur lecture gallery.json" }), { status: 500 });
  }

  const gallery = JSON.parse(jsonContent);
  gallery.images.push({ id, src: imageSrc, alt, description, featured });

  // Met à jour gallery.json
  const updated = await putFile(
    'src/data/gallery.json',
    JSON.stringify(gallery, null, 2),
    `admin: ajout image ${alt}`,
    await import('../../../lib/github').then(m => m.getFileSha('src/data/gallery.json')) as string
  );

  if (!updated) {
    return new Response(JSON.stringify({ error: "Erreur mise à jour gallery.json" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};