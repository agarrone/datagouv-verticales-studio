// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Studio des verticales — data.gouv.fr',
      meta: [
        { name: 'description', content: 'Imaginez et configurez un portail thématique à partir des données de data.gouv.fr.' },
      ],
    },
  },
})
