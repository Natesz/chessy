export default defineNuxtConfig({
  srcDir: 'app/',
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  typescript: {
    strict: true,
  },
  vite: {
    optimizeDeps: {
      exclude: ['stockfish'],
    },
  },
})
