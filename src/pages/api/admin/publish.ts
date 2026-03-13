import type { APIRoute } from 'astro';
import { getFileContent, commitAll, type FileChange } from '../../../lib/github';

export const POST: APIRoute = async ({ request }) => {
  const { added, updated, deleted } = await request.json();

  try {
    const changes: FileChange[] = [];

    // 1. Images ajoutées
    for (const img of added) {
      if (img.image) {
        changes.push({
          path: `public${img.src}`,
          content: img.image.split(',')[1], // retire le préfixe data:image/jpeg;base64,
          encoding: 'base64',
        });
      }
    }

    // 2. Images modifiées (si nouvelle photo)
    for (const img of updated) {
      if (img.image) {
        changes.push({
          path: `public${img.src}`,
          content: img.image.split(',')[1],
          encoding: 'base64',
        });
      }
    }

    // 3. Images supprimées
    for (const img of deleted) {
      changes.push({
        path: `public${img.src}`,
        content: '',
        encoding: 'utf-8',
        deleted: true,
      });
    }

    // 4. Lit et met à jour gallery.json
    const jsonContent = await getFileContent('src/data/gallery.json');
    if (!jsonContent) {
      return new Response(JSON.stringify({ error: 'Erreur lecture gallery.json' }), { status: 500 });
    }

    const gallery = JSON.parse(jsonContent);

    for (const img of deleted) {
      gallery.images = gallery.images.filter((i: { id: string }) => i.id !== img.id);
    }

    for (const img of updated) {
      const index = gallery.images.findIndex((i: { id: string }) => i.id === img.id);
      if (index !== -1) {
        gallery.images[index] = {
          ...gallery.images[index],
          alt: img.alt,
          description: img.description,
          featured: img.featured,
          src: img.src,
        };
      }
    }

    for (const img of added) {
      gallery.images.push({
        id: img.id,
        src: img.src,
        alt: img.alt,
        description: img.description,
        featured: img.featured,
      });
    }

    // 5. Ajoute gallery.json aux changements
    changes.push({
      path: 'src/data/gallery.json',
      content: JSON.stringify(gallery, null, 2),
      encoding: 'utf-8',
    });

    // 6. UN SEUL commit pour tout
    const success = await commitAll(
      `admin: publication ${added.length} ajout(s), ${updated.length} modification(s), ${deleted.length} suppression(s)`,
      changes
    );

    if (!success) {
      return new Response(JSON.stringify({ error: 'Erreur commit GitHub' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (e) {
    console.error('publish error:', e);
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
};