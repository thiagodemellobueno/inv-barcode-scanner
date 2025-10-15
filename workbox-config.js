export default {
  globDirectory: 'dist',
  globPatterns: ['**/*.{html,js,css,png,svg,csv,jpg,gif,json,woff,woff2,eot,ico,webmanifest,map}'],
  swDest: 'dist/service-worker.js',
  clientsClaim: true,
  skipWaiting: true
};
