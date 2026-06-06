const CATEGORIES = [
  { id: "african-cdc",     query: "Africa CDC African Union disease control health outbreak news 2026" },
  { id: "ama",             query: "African Medicines Agency AMA pharmaceutical regulation Africa news 2026" },
  { id: "manufacture",     query: "vaccine manufacturing Africa biologics local production AVMI news 2026" },
  { id: "unicef-gavi",     query: "UNICEF GAVI vaccines immunization Africa campaign news 2026" },
  { id: "sante-maroc",     query: "santé Maroc actualités système santé publique réformes 2026" },
  { id: "vaccins-monde",   query: "vaccines world WHO immunization news outbreak 2026" },
];

async function searchTavily(query) {
  const resp = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: "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",
      query,
      search_depth: "advanced",
      max_results: 6,
      include_answer: false,
    }),
  });
  if (!resp.ok) throw new Error(`Tavily error: ${resp.status}`);
  const data = await resp.json();
  return (data.results || []).map((r) => ({
    title:   r.title || "Sans titre",
    url:     r.url   || "#",
    content: (r.content || r.raw_content || "").slice(0, 500),
    date:    r.published_date || null,
  }));
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const catId = req.query.cat;
  const cat = catId ? CATEGORIES.find((c) => c.id === catId) : null;
  const targets = cat ? [cat] : CATEGORIES;

  try {
    const results = {};
    await Promise.all(
      targets.map(async (c) => {
        try {
          results[c.id] = await searchTavily(c.query);
        } catch (e) {
          results[c.id] = [];
        }
      })
    );
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json(results);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
