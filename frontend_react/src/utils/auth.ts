/**
 * Utilitaires pour la gestion de l'authentification
 */

/**
 * Récupère le token d'authentification
 * Cherche d'abord dans sessionStorage (session temporaire)
 * puis dans localStorage (remember me)
 * 
 * @returns Le token JWT ou null si aucun token n'est trouvé
 */
export const getAuthToken = (): string | null => {
  // Priorité au sessionStorage (session courte)
  const sessionToken = sessionStorage.getItem('authToken');
  if (sessionToken) {
    return sessionToken;
  }
  
  // Sinon chercher dans localStorage (remember me 24h)
  const localToken = localStorage.getItem('authToken');
  if (localToken) {
    return localToken;
  }
  
  return null;
};

/**
 * Stocke le token selon la préférence rememberMe
 * 
 * @param token - Le token JWT à stocker
 * @param rememberMe - true pour localStorage (24h), false pour sessionStorage (session)
 */
export const setAuthToken = (token: string, rememberMe: boolean): void => {
  if (rememberMe) {
    localStorage.setItem('authToken', token);
    sessionStorage.removeItem('authToken');
  } else {
    sessionStorage.setItem('authToken', token);
    localStorage.removeItem('authToken');
  }
};

/**
 * Supprime le token d'authentification de tous les storages
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
};

