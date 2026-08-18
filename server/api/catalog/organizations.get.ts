type DatagouvOrganization = {
  id: string
  name: string
  acronym?: string
  description?: string
  logo_thumbnail?: string
  slug: string
  metrics?: { datasets?: number }
}

type DatagouvResponse = { data: DatagouvOrganization[] }

export default defineEventHandler(async (event) => {
  const query = getQuery(event).q
  const q = typeof query === "string" ? query.trim().slice(0, 120) : ""
  if (q.length < 2) throw createError({ statusCode: 400, statusMessage: "La recherche doit contenir au moins deux caractères." })

  const response = await $fetch<DatagouvResponse>("https://www.data.gouv.fr/api/1/organizations/", {
    query: { q, page_size: 8 },
    headers: { "user-agent": "datagouv-verticales-studio/0.1" },
  })

  return {
    organizations: response.data.map(organization => ({
      id: organization.id,
      name: organization.name,
      acronym: organization.acronym,
      description: (organization.description ?? "").replace(/[#*_`>\[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 260),
      logo: organization.logo_thumbnail,
      datasets: organization.metrics?.datasets ?? 0,
      url: `https://www.data.gouv.fr/organizations/${organization.slug}/`,
    })),
  }
})
