import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(({cookies, url, redirect}, next) => {
    const isAdminRoute = url.pathname.startsWith('/admin');
    const isLoginPage = url.pathname === '/admin';
    const isAuthenticated = cookies.get('admin_session')?.value === 'authenticated';

    if(isAdminRoute && !isLoginPage && !isAuthenticated) {
        return redirect('/admin');
    }

    return next();
})