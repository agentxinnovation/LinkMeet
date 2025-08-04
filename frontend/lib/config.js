// For server-side and API routes
export const getServerSideBaseUrl = () => {
  if (process.env.DOCKER_ENV === 'true') {
    return 'http://linkmeet-backend:5000';
  }
  return process.env.SERVER_SIDE_API_BASE_URL || 'http://localhost:5000';
};

// For client-side (browser)
export const getClientSideBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // When running in browser
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
  }
  return getServerSideBaseUrl();
};