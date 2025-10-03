import csurf from 'csurf';

// CSRF via cookie (nécessite cookie-parser au niveau app)
export const csrfProtection = csurf({ cookie: true });
