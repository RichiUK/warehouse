export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },
  ssr: false,
  nitro: {
    prerender: {
      routes: ['/'],
    },
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  app: {
    head: {
      title: 'Mechanic Diagnoser',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
      ],
    },
  },

  compatibilityDate: '2024-11-01',
})
