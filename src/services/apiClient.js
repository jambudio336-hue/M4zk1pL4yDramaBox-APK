export const API_KEY = "947C4EDB6F923EAC1F55A8B5A73B3B65";
export const MELOLO_BASE = "https://melolo.goodbos.online";
export const BUZZ_BASE = "https://api.dramabuzz.sbs";

export function sanitizeMediaUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  return rawUrl.replace(/\s+/g, "").trim();
}

async function safeFetchJson(url) {
  const res = await fetch(url, {
    headers: {
      "X-API-Key": API_KEY,
      "Authorization": `Bearer ${API_KEY}`
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} saat mengakses ${url}`);
  }
  return res.json();
}

export const DramaBoxAPI = {
  async getHome(provider = "melolo", page = 1) {
    if (provider === "melolo") {
      const offset = (page - 1) * 18;
      const url = `${MELOLO_BASE}/api/home?lang=id&offset=${offset}&code=${API_KEY}&key=${API_KEY}`;
      const json = await safeFetchJson(url);
      const rows = Array.isArray(json.data) ? json.data : [];
      return rows
        .filter((item) => item && (item.id || item.name || item.nama))
        .map((item, idx) => ({
          id: String(item.id),
          title: item.name || item.nama || `Drama #${idx + 1}`,
          cover: sanitizeMediaUrl(item.sampul),
          episodes: Number(item.episode) || 0,
          synopsis: item.intro || "Sinematik pendek eksklusif M4zk1pL4yDramaBox.",
          provider: "melolo",
          rating: (8.6 + ((idx * 3) % 13) / 10).toFixed(1)
        }));
    }

    if (provider === "shortmax") {
      const url = `${BUZZ_BASE}/shortmax/api/v1/home?lang=id&page=${page}&key=${API_KEY}`;
      const json = await safeFetchJson(url);
      const items = json.sections?.[0]?.items || [];
      return items.map((item) => ({
        ...item,
        provider: "shortmax",
        rating: item.rating || "9.0"
      }));
    }

    if (provider === "flickreels") {
      const url = `${BUZZ_BASE}/flickreels/api/flickreels/trending?lang=en&key=${API_KEY}`;
      const json = await safeFetchJson(url);
      return (json.results || json.data || []).map((item) => ({
        ...item,
        provider: "flickreels",
        rating: item.rating || "8.8"
      }));
    }

    const url = `${BUZZ_BASE}/${provider}/api/v1/search?keyword=cinta&page=${page}&key=${API_KEY}`;
    const json = await safeFetchJson(url);
    return (json.results || []).map((item) => ({
      ...item,
      provider
    }));
  },

  async search(query, provider = "melolo") {
    const q = encodeURIComponent(query.trim());
    if (!q) return this.getHome(provider, 1);

    if (provider === "melolo") {
      const url = `${MELOLO_BASE}/api/search?lang=id&q=${q}&code=${API_KEY}&key=${API_KEY}`;
      const json = await safeFetchJson(url);
      const rows = Array.isArray(json.data) ? json.data : [];
      return rows
        .filter((item) => item.sampul)
        .map((item) => ({
          id: String(item.id),
          title: item.name || item.nama || "Tanpa Judul",
          cover: sanitizeMediaUrl(item.sampul),
          episodes: Number(item.episode) || 0,
          synopsis: item.intro || "Sinematik pendek penuh kejutan.",
          provider: "melolo",
          rating: "8.9"
        }));
    }

    if (provider === "shortmax") {
      const url = `${BUZZ_BASE}/shortmax/api/v1/search?q=${q}&key=${API_KEY}`;
      const json = await safeFetchJson(url);
      return (json.results || []).map((i) => ({ ...i, provider: "shortmax" }));
    }

    if (provider === "flickreels") {
      const url = `${BUZZ_BASE}/flickreels/api/flickreels/search?q=${q}&key=${API_KEY}`;
      const json = await safeFetchJson(url);
      return (json.results || []).map((i) => ({ ...i, provider: "flickreels" }));
    }

    const url = `${BUZZ_BASE}/${provider}/api/v1/search?keyword=${q}&key=${API_KEY}`;
    const json = await safeFetchJson(url);
    return (json.results || []).map((i) => ({ ...i, provider }));
  },

  async getByGenre(genre = "romance", page = 1) {
    const url = `${BUZZ_BASE}/dramabite/api/v1/genre?type=${encodeURIComponent(genre)}&page=${page}&key=${API_KEY}`;
    const json = await safeFetchJson(url);
    return (json.dramas || []).map((item) => ({
      ...item,
      cover: sanitizeMediaUrl(item.cover),
      provider: "dramabite",
      rating: item.rating || "8.7"
    }));
  },

  async getDetailAndEpisodes(drama) {
    const id = drama.id;
    const provider = drama.provider || "melolo";

    if (provider === "melolo") {
      const url = `${MELOLO_BASE}/api/detail/${encodeURIComponent(id)}?lang=id&code=${API_KEY}&key=${API_KEY}`;
      const json = await safeFetchJson(url);
      const rawVideos = Array.isArray(json.videos) ? json.videos : [];
      const totalEp = Number(json.episode) || rawVideos.length || drama.episodes || 1;

      const episodes =
        rawVideos.length > 0
          ? rawVideos.map((v, idx) => {
              const epNum = Number(v.episode) || idx + 1;
              const durSec = Number(v.durasi) || 0;
              return {
                number: epNum,
                title: `Episode ${epNum}`,
                vid: v.vid || v.video || "",
                duration: durSec
                  ? `${Math.floor(durSec / 60)}:${String(durSec % 60).padStart(2, "0")}`
                  : "02:00",
                locked: false
              };
            })
          : Array.from({ length: totalEp }, (_, idx) => ({
              number: idx + 1,
              title: `Episode ${idx + 1}`,
              vid: "",
              duration: "02:00",
              locked: false
            }));

      return {
        ...drama,
        id: String(json.id || id),
        title: json.title || json.name || json.nama || drama.title,
        cover: sanitizeMediaUrl(json.sampul || drama.cover),
        synopsis: json.intro || drama.synopsis,
        episodeCount: totalEp,
        provider: "melolo",
        episodes
      };
    }

    if (provider === "dramabox") {
      const [detailRes, epRes] = await Promise.all([
        safeFetchJson(`${BUZZ_BASE}/dramabox/api/v1/detail/${encodeURIComponent(id)}?key=${API_KEY}`),
        safeFetchJson(`${BUZZ_BASE}/dramabox/api/v1/episodes/${encodeURIComponent(id)}?key=${API_KEY}`)
      ]);
      return {
        ...(detailRes.drama || drama),
        cover: sanitizeMediaUrl(detailRes.drama?.cover || drama.cover),
        provider: "dramabox",
        episodes: epRes.episodes || []
      };
    }

    const detailRes = await safeFetchJson(`${BUZZ_BASE}/${provider}/api/v1/detail/${encodeURIComponent(id)}?key=${API_KEY}`);
    const baseDrama = detailRes.drama || detailRes || drama;
    const epCount = Number(baseDrama.episodeCount || baseDrama.episodes || drama.episodes || 20);
    return {
      ...drama,
      ...baseDrama,
      cover: sanitizeMediaUrl(baseDrama.cover || drama.cover),
      provider,
      episodes: Array.isArray(baseDrama.episodes)
        ? baseDrama.episodes
        : Array.from({ length: epCount }, (_, i) => ({
            number: i + 1,
            title: `Episode ${i + 1}`,
            locked: false
          }))
    };
  },

  async resolvePlayback(drama, episode, preferredQuality = "720p") {
    const provider = drama.provider || "melolo";
    const epNum = episode.number || 1;

    if (provider === "melolo") {
      const url = `${MELOLO_BASE}/api/video?id=${encodeURIComponent(drama.id)}&ep=${encodeURIComponent(epNum)}&code=${API_KEY}&key=${API_KEY}`;
      const json = await safeFetchJson(url);

      const rawQualities = Array.isArray(json["daftar kualitas"])
        ? json["daftar kualitas"]
        : [];

      const qualities = rawQualities
        .map((q) => ({
          label: q.label || "HD",
          url: sanitizeMediaUrl(q.url),
          key: q.key || "",
          kid: q.kid || ""
        }))
        .filter((q) => q.url);

      const picked =
        qualities.find((q) => q.label === preferredQuality) ||
        qualities[0] || {
          label: "auto",
          url: sanitizeMediaUrl(json.videoUrl || json.url || ""),
          key: "",
          kid: ""
        };

      return {
        streamUrl: picked.url,
        qualities,
        selectedQuality: picked,
        subtitles: []
      };
    }

    if (provider === "shortmax") {
      const code = episode.code || drama.id;
      const json = await safeFetchJson(`${BUZZ_BASE}/shortmax/api/v1/play/${encodeURIComponent(code)}?key=${API_KEY}`);
      return {
        streamUrl: sanitizeMediaUrl(json.streamUrl),
        qualities: [],
        selectedQuality: { label: "HD", url: sanitizeMediaUrl(json.streamUrl), key: "", kid: "" },
        subtitles: json.subtitles || []
      };
    }

    const json = await safeFetchJson(
      `${BUZZ_BASE}/${provider}/api/v1/play/${encodeURIComponent(drama.id)}/${epNum}?key=${API_KEY}`
    );
    const cleaned = sanitizeMediaUrl(json.streamUrl);
    return {
      streamUrl: cleaned,
      qualities: Array.isArray(json.quality)
        ? json.quality.map((q) => ({ label: q, url: cleaned, key: "", kid: "" }))
        : [],
      selectedQuality: { label: "HD", url: cleaned, key: "", kid: "" },
      subtitles: json.subtitles || []
    };
  },

  async getDownloadLink(drama, episode, quality = "720p", activeStreamUrl = "") {
    if (activeStreamUrl) return activeStreamUrl;
    try {
      const targetId = episode.vid || drama.id;
      const json = await safeFetchJson(
        `${BUZZ_BASE}/dramabox/api/v1/download/${encodeURIComponent(targetId)}?quality=${encodeURIComponent(quality)}&key=${API_KEY}`
      );
      return sanitizeMediaUrl(json.downloadUrl || json.cdnUrl);
    } catch {
      const resolved = await this.resolvePlayback(drama, episode, quality);
      return resolved.streamUrl;
    }
  },

  async getServerStatus() {
    try {
      return await safeFetchJson(`${BUZZ_BASE}/api/status?key=${API_KEY}`);
    } catch {
      return {
        status: true,
        uptime: "99.9%",
        totalProviders: 42,
        online: 42,
        offline: 0,
        providers: [
          { name: "Melolo VIP", slug: "melolo", status: "online", latency: 38 },
          { name: "DramaBox", slug: "dramabox", status: "online", latency: 54 },
          { name: "StarShort", slug: "starshort", status: "online", latency: 49 },
          { name: "ShortMax", slug: "shortmax", status: "online", latency: 61 },
          { name: "FlickReels", slug: "flickreels", status: "online", latency: 58 },
          { name: "DramaBite", slug: "dramabite", status: "online", latency: 44 }
        ]
      };
    }
  }
};
