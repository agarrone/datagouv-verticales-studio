<script setup lang="ts">
const examples = [
  { label: "Éducation", prompt: "Je souhaite créer un portail consacré aux données de l’éducation, destiné aux collectivités, aux chercheurs et aux familles.", icon: "ri-graduation-cap-line" },
  { label: "Santé environnementale", prompt: "Je souhaite réunir les données publiques sur la qualité de l’air, de l’eau et leurs effets sur la santé.", icon: "ri-heart-pulse-line" },
  { label: "Vie locale", prompt: "Je souhaite créer un portail pour aider les citoyens à comprendre les services, équipements et projets de leur territoire.", icon: "ri-community-line" },
]

const prompt = ref("")
const hasStarted = ref(false)
const framingSaved = ref(false)
const selectionOpened = ref(false)
const catalogLoading = ref(false)
const catalogError = ref("")
const searchQuery = ref("")
const selectedDatasetIds = ref<string[]>([])
type CatalogDataset = { id: string; title: string; description: string; organization: string; organizationLogo?: string; resources: number; lastUpdate?: string; url: string }
const catalogResults = ref<CatalogDataset[]>([])
const audienceInput = ref("")
const framing = reactive({
  title: "",
  purpose: "Rendre un ensemble de données publiques plus facile à trouver, comprendre et réutiliser.",
  audiences: [] as string[],
  objectives: "Permettre aux utilisateurs d’identifier les données utiles, de comprendre leur contexte et d’accéder aux ressources publiées sur data.gouv.fr.",
})

function inferFraming() {
  const education = /éducation|famill|chercheur|collectivit/i.test(prompt.value)
  const health = /santé|air|eau|environnement/i.test(prompt.value)
  const local = /citoyen|territoire|service|équipement/i.test(prompt.value)
  framing.title = education ? "Données de l’éducation" : health ? "Santé environnementale" : local ? "Données de la vie locale" : "Portail thématique"
  framing.audiences = education ? ["Collectivités", "Chercheurs", "Familles"] : health ? ["Citoyens", "Professionnels de santé", "Décideurs publics"] : local ? ["Citoyens", "Agents publics", "Associations"] : ["Citoyens", "Professionnels", "Acteurs publics"]
  framingSaved.value = false
}

function useExample(value: string) {
  prompt.value = value
  hasStarted.value = false
}

function startFraming() {
  if (!prompt.value.trim()) return
  inferFraming()
  hasStarted.value = true
  nextTick(() => document.querySelector("#framing-result")?.scrollIntoView({ behavior: "smooth", block: "center" }))
}

function addAudience() {
  const value = audienceInput.value.trim()
  if (value && !framing.audiences.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) framing.audiences.push(value)
  audienceInput.value = ""
}

function removeAudience(index: number) {
  framing.audiences.splice(index, 1)
}

function saveFraming() {
  framingSaved.value = true
  nextTick(() => document.querySelector("#next-step")?.scrollIntoView({ behavior: "smooth", block: "center" }))
}

async function searchCatalog() {
  const query = searchQuery.value.trim()
  if (!query) return
  catalogLoading.value = true
  catalogError.value = ""
  try {
    const response = await $fetch<{ total: number; datasets: CatalogDataset[] }>("/api/catalog/search", { query: { q: query } })
    catalogResults.value = response.datasets
  } catch {
    catalogError.value = "La recherche data.gouv.fr n’a pas pu aboutir. Réessayez dans quelques instants."
  } finally {
    catalogLoading.value = false
  }
}

async function openSelection() {
  selectionOpened.value = true
  searchQuery.value = framing.title.replace(/^Données (de |des |du |d’|d')?/i, "").trim()
  await nextTick()
  document.querySelector("#dataset-selection")?.scrollIntoView({ behavior: "smooth", block: "start" })
  await searchCatalog()
}

function toggleDataset(id: string) {
  selectedDatasetIds.value = selectedDatasetIds.value.includes(id) ? selectedDatasetIds.value.filter(item => item !== id) : [...selectedDatasetIds.value, id]
}

function formatDate(value?: string) {
  if (!value) return "Date inconnue"
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <a class="brand" href="#" aria-label="Studio des verticales, accueil">
        <span class="brand-mark">data.gouv.fr</span><span class="brand-divider" aria-hidden="true" /><span class="brand-product">Studio des verticales</span>
      </a>
      <nav class="header-actions" aria-label="Navigation principale">
        <a href="#about">À propos</a>
        <a class="github-link" href="https://github.com/agarrone/datagouv-verticales-studio" target="_blank" rel="noreferrer"><i class="ri-github-line" aria-hidden="true" /> GitHub</a>
      </nav>
    </header>

    <main>
      <section class="hero" aria-labelledby="page-title">
        <div class="eyebrow"><i class="ri-sparkling-line" aria-hidden="true" /> Prototype assisté par IA</div>
        <h1 id="page-title">Imaginez votre portail thématique de données publiques.</h1>
        <p class="hero-intro">Décrivez votre projet. Le studio vous aide à cadrer sa thématique, sélectionner les données de data.gouv.fr et préparer une verticale cohérente.</p>

        <form class="prompt-card" @submit.prevent="startFraming">
          <label for="portal-intent">Quelle verticale souhaitez-vous créer&nbsp;?</label>
          <div class="prompt-surface">
            <textarea id="portal-intent" v-model="prompt" rows="4" placeholder="Décrivez la thématique, les personnes concernées et ce que vous souhaitez leur permettre de faire…" @input="hasStarted = false" />
            <div class="prompt-footer">
              <span><i class="ri-information-line" aria-hidden="true" /> Vous pourrez tout modifier avant de générer la configuration.</span>
              <button type="submit" :disabled="!prompt.trim()">Commencer le cadrage <i class="ri-arrow-right-line" aria-hidden="true" /></button>
            </div>
          </div>
        </form>

        <div class="examples" aria-labelledby="examples-title">
          <p id="examples-title">Ou partir d’un exemple</p>
          <div class="example-list">
            <button v-for="example in examples" :key="example.label" type="button" @click="useExample(example.prompt)">
              <i :class="example.icon" aria-hidden="true" /><span>{{ example.label }}</span><i class="ri-arrow-right-up-line example-arrow" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <Transition name="framing">
        <section v-if="hasStarted" id="framing-result" class="framing-result" aria-live="polite">
          <div class="result-heading">
            <span class="step-number">01</span>
            <div><p class="section-kicker">Cadrage proposé</p><h2>Commençons par préciser l’intention.</h2></div>
            <span class="status"><i class="ri-checkbox-circle-line" aria-hidden="true" /> Brouillon</span>
          </div>
          <blockquote>{{ prompt }}</blockquote>
          <div class="framing-form">
            <label class="field field-wide">
              <span><i class="ri-layout-top-line" aria-hidden="true" /> Nom de travail</span>
              <input v-model="framing.title" type="text" @input="framingSaved = false">
              <small>Ce nom reste provisoire. L’identité définitive sera travaillée plus tard.</small>
            </label>
            <label class="field field-wide">
              <span><i class="ri-focus-3-line" aria-hidden="true" /> Finalité</span>
              <textarea v-model="framing.purpose" rows="3" @input="framingSaved = false" />
              <small>Pourquoi cette verticale doit-elle exister&nbsp;?</small>
            </label>
            <div class="field field-wide">
              <span><i class="ri-team-line" aria-hidden="true" /> Publics prioritaires</span>
              <div class="tag-editor">
                <span v-for="(audience, index) in framing.audiences" :key="audience" class="audience-tag">{{ audience }}<button type="button" :aria-label="`Retirer ${audience}`" @click="removeAudience(index); framingSaved = false"><i class="ri-close-line" aria-hidden="true" /></button></span>
                <input v-model="audienceInput" type="text" placeholder="Ajouter un public" @keydown.enter.prevent="addAudience">
                <button class="add-tag" type="button" :disabled="!audienceInput.trim()" @click="addAudience"><i class="ri-add-line" aria-hidden="true" /> Ajouter</button>
              </div>
              <small>Ajoutez les groupes qui utiliseront réellement le portail.</small>
            </div>
            <label class="field field-wide">
              <span><i class="ri-flag-line" aria-hidden="true" /> Objectifs pour les utilisateurs</span>
              <textarea v-model="framing.objectives" rows="3" @input="framingSaved = false" />
              <small>Que doivent-ils pouvoir trouver, comprendre ou accomplir&nbsp;?</small>
            </label>
          </div>
          <div class="result-actions">
            <button class="secondary-button" type="button" @click="hasStarted = false"><i class="ri-edit-line" aria-hidden="true" /> Modifier</button>
            <button class="primary-button" type="button" :disabled="!framing.title.trim() || !framing.purpose.trim() || !framing.audiences.length || !framing.objectives.trim()" @click="saveFraming">Enregistrer le cadrage <i class="ri-check-line" aria-hidden="true" /></button>
          </div>
        </section>
      </Transition>

      <Transition name="framing">
        <section v-if="framingSaved" id="next-step" class="next-step" aria-live="polite">
          <div class="next-icon"><i class="ri-search-eye-line" aria-hidden="true" /></div>
          <div><p class="section-kicker">Étape suivante</p><h2>Identifier les données de la verticale</h2><p>Le cadrage est enregistré localement. Nous pouvons maintenant rechercher les organisations et jeux de données pertinents sur data.gouv.fr.</p></div>
          <button type="button" @click="openSelection">Commencer la sélection <i class="ri-arrow-right-line" aria-hidden="true" /></button>
        </section>
      </Transition>

      <Transition name="framing">
        <section v-if="selectionOpened" id="dataset-selection" class="dataset-selection" aria-labelledby="selection-title">
          <header class="selection-header">
            <div><p class="section-kicker">02 · Sélectionner</p><h2 id="selection-title">Identifier les données pertinentes</h2><p>Les résultats proviennent directement du catalogue public data.gouv.fr. Rien n’est copié dans le studio.</p></div>
            <span class="selection-count">{{ selectedDatasetIds.length }} sélectionné{{ selectedDatasetIds.length > 1 ? 's' : '' }}</span>
          </header>
          <form class="catalog-search" @submit.prevent="searchCatalog">
            <i class="ri-search-line" aria-hidden="true" />
            <label class="sr-only" for="catalog-query">Rechercher dans data.gouv.fr</label>
            <input id="catalog-query" v-model="searchQuery" type="search" placeholder="Éducation, établissements scolaires, réussite…">
            <button type="submit" :disabled="catalogLoading || !searchQuery.trim()"><span v-if="catalogLoading" class="spinner" aria-hidden="true" />{{ catalogLoading ? 'Recherche…' : 'Rechercher' }}</button>
          </form>
          <p v-if="catalogError" class="catalog-error" role="alert"><i class="ri-error-warning-line" aria-hidden="true" /> {{ catalogError }}</p>
          <div v-else-if="catalogLoading" class="catalog-loading" role="status"><span class="spinner" aria-hidden="true" /> Interrogation du catalogue data.gouv.fr…</div>
          <div v-else-if="catalogResults.length" class="dataset-list">
            <article v-for="dataset in catalogResults" :key="dataset.id" :class="{ selected: selectedDatasetIds.includes(dataset.id) }">
              <div class="dataset-logo"><img v-if="dataset.organizationLogo" :src="dataset.organizationLogo" alt=""><i v-else class="ri-government-line" aria-hidden="true" /></div>
              <div class="dataset-content">
                <div class="dataset-title-row"><h3><a :href="dataset.url" target="_blank" rel="noreferrer">{{ dataset.title }} <i class="ri-external-link-line" aria-hidden="true" /></a></h3><span>{{ dataset.resources }} ressource{{ dataset.resources > 1 ? 's' : '' }}</span></div>
                <p class="dataset-organization">{{ dataset.organization }} · Mis à jour le {{ formatDate(dataset.lastUpdate) }}</p>
                <p class="dataset-description">{{ dataset.description || 'Aucune description disponible.' }}</p>
              </div>
              <button class="dataset-select" type="button" :aria-pressed="selectedDatasetIds.includes(dataset.id)" @click="toggleDataset(dataset.id)">
                <i :class="selectedDatasetIds.includes(dataset.id) ? 'ri-checkbox-circle-fill' : 'ri-add-circle-line'" aria-hidden="true" />
                {{ selectedDatasetIds.includes(dataset.id) ? 'Sélectionné' : 'Ajouter' }}
              </button>
            </article>
          </div>
          <div v-else class="empty-results"><i class="ri-folder-search-line" aria-hidden="true" /><p>Aucun jeu de données trouvé.</p><span>Essayez un terme plus précis ou un synonyme.</span></div>
          <footer class="selection-footer">
            <p><strong>{{ selectedDatasetIds.length }}</strong> jeu{{ selectedDatasetIds.length > 1 ? 'x' : '' }} de données dans le périmètre provisoire</p>
            <button type="button" :disabled="!selectedDatasetIds.length">Valider la sélection <i class="ri-arrow-right-line" aria-hidden="true" /></button>
          </footer>
        </section>
      </Transition>

      <section id="about" class="how-it-works" aria-labelledby="how-title">
        <div><p class="section-kicker">Un parcours guidé</p><h2 id="how-title">De l’intention à une configuration vérifiable.</h2></div>
        <ol>
          <li><span>01</span><div><strong>Cadrer</strong><p>Définir la thématique, les publics et les objectifs.</p></div></li>
          <li><span>02</span><div><strong>Sélectionner</strong><p>Identifier les données déjà publiées sur data.gouv.fr.</p></div></li>
          <li><span>03</span><div><strong>Composer</strong><p>Structurer l’accueil, les contenus et l’identité visuelle.</p></div></li>
          <li><span>04</span><div><strong>Prévisualiser</strong><p>Contrôler le portail et exporter sa configuration YAML.</p></div></li>
        </ol>
      </section>
    </main>

    <footer><span>Un prototype expérimental de l’écosystème data.gouv.fr</span><span>Aucune donnée n’est dupliquée ni publiée.</span></footer>
  </div>
</template>
