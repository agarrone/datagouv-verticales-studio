type DatagouvDataset = {
  id: string
  title: string
  slug: string
  description?: string
  last_update?: string
  resources?: unknown[]
  organization?: { name?: string; logo?: string }
  owner?: { first_name?: string; last_name?: string }
}

type DatagouvResponse = { total: number; data: DatagouvDataset[] }

export default defineEventHandler(async (event) => {
  const query = getQuery(event).q
  const q = typeof query === "string" ? query.trim().slice(0, 120) : ""
  if (q.length < 2) throw createError({ statusCode: 400, statusMessage: "La recherche doit contenir au moins deux caractères." })

  const response = await $fetch<DatagouvResponse>("https://www.data.gouv.fr/api/1/datasets/", {
    query: { q, page_size: 8, sort: "-last_update" },
    headers: { "user-agent": "datagouv-verticales-studio/0.1" },
  })

  return {
    total: response.total,
    datasets: response.data.map(dataset => ({
      id: dataset.id,
      title: dataset.title.trim(),
      description: (dataset.description ?? "").replace(/[#*_`>\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 280),
      organization: dataset.organization?.name ?? ([dataset.owner?.first_name, dataset.owner?.last_name].filter(Boolean).join(" ") || "Producteur individuel"),
      organizationLogo: dataset.organization?.logo,
      resources: dataset.resources?.length ?? 0,
      lastUpdate: dataset.last_update,
      url: `https://www.data.gouv.fr/datasets/${dataset.slug}/`,
    })),
  }
})
