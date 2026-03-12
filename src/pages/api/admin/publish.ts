import type { APIRoute } from 'astro';
import { getFileContent, getFileSha, putFile, uploadImage, deleteFile } from '../../../lib/github';

export const POST: APIRoute = async ({ request }) => {
  const { added, updated, deleted } = await request.json();

  try {
    // 1. Upload les nouvelles images
    for (const img of added) {
      if (img.image) {
        const imagePath = `public${img.src}`;
        await uploadImage(imagePath, img.image);
      }
    }

    // 2. Upload les images modifiées
    for (const img of updated) {
      if (img.image) {
        const imagePath = `public${img.src}`;
        await uploadImage(imagePath, img.image);
      }
    }

    // 3. Supprimer les images supprimées
    for (const img of deleted) {
      const imagePath = `public${img.src}`;
      const sha = await getFileSha(imagePath);
      if (sha) {
        await deleteFile(imagePath, `admin: suppression image ${img.id}`, sha);
      }
    }

    // 4. Lit le gallery.json actuel
    const jsonContent = await getFileContent('src/data/gallery.json');
    if (!jsonContent) {
      return new Response(JSON.stringify({ error: 'Erreur lecture gallery.json' }), { status: 500 });
    }

    const gallery = JSON.parse(jsonContent);

    // 5. Applique les suppressions
    for (const img of deleted) {
      gallery.images = gallery.images.filter((i: { id: string }) => i.id !== img.id);
    }

    // 6. Applique les modifications
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

    // 7. Applique les ajouts
    for (const img of added) {
      gallery.images.push({
        id: img.id,
        src: img.src,
        alt: img.alt,
        description: img.description,
        featured: img.featured,
      });
    }

    // 8. Met à jour gallery.json en un seul commit
    const sha = await getFileSha('src/data/gallery.json');
    const updated_ok = await putFile(
      'src/data/gallery.json',
      JSON.stringify(gallery, null, 2),
      `admin: publication ${added.length} ajout(s), ${updated.length} modification(s), ${deleted.length} suppression(s)`,
      sha as string
    );

    if (!updated_ok) {
      return new Response(JSON.stringify({ error: 'Erreur mise à jour gallery.json' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), { status: 500 });
  }
};