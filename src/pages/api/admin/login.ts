import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies }) => {
    const data = await request.formData();
    const password = data.get('password');

    if (password !== import.meta.env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Mot de passe incorrect' }), { status: 401 });
    }

    cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, //8 heures
        path: '/'
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
};