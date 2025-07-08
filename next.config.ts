import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */

  // Handle server-only modules that might cause build errors
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to bundle these node modules (used by server-side code) in client-side builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        http2: false,
        dns: false,
        child_process: false,
        'firebase-admin': false,
        'firebase-functions': false,
        'node-fetch': false,
        'data-uri-to-buffer': false,
        'fetch-blob': false,
        'formdata-polyfill': false,
      };
    }
    return config;
  },

  // Exclude certain node modules from being bundled on the server side
  serverExternalPackages: ['@opentelemetry/exporter-jaeger', 'node-fetch', 'data-uri-to-buffer', 'fetch-blob', 'formdata-polyfill'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
