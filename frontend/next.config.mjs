/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable standalone output for Docker
    output: 'standalone',
    
    // Disable strict mode for development
    reactStrictMode: true,
    
    // Enable experimental features if needed
    experimental: {
      // Add any experimental features here
    },
    
    // Configure headers for CORS if needed
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
            { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;