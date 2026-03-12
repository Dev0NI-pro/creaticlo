import type { APIRoute } from 'astro';
import { getFileContent } from '../../../lib/github';

export const GET: APIRoute = async () => {
  const jsonContent = await getFileContent('src/data/gallery.json');
  if (!jsonContent) {
    return new Response(JSON.stringify({ error: 'Erreur lecture gallery.json' }), { status: 500 });
  }

  const gallery = JSON.parse(jsonContent);
  const lastImage = gallery.images[gallery.images.length - 1];

  return new Response(JSON.stringify({ id: lastImage.id }), { status: 200 });
};