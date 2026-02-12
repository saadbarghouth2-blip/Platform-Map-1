const OV_BASE = "https://api.openverse.org/v1";
const badWords = ["nude","nudity","sex","sexy","porn","erotic","explicit","violence","gore","bloody","drug","weapon"];

function clean(s){ return (s || "").toLowerCase(); }

function kidSafe(item){
  if(item?.mature === true) return false;
  const t = clean(item?.title);
  for(const b of badWords){
    if(t.includes(b)) return false;
  }
  return true;
}

export async function searchOpenverseImages(q, { page=1, page_size=18 } = {}){
  const url = `${OV_BASE}/images/?q=${encodeURIComponent(q)}&page=${page}&page_size=${page_size}`;
  const r = await fetch(url);
  if(!r.ok) throw new Error("Openverse images fetch failed");
  const data = await r.json();
  return (data.results || []).filter(kidSafe).map(x => ({
    id: x.id,
    title: x.title,
    url: x.url,
    thumb: x.thumbnail,
    creator: x.creator,
    creatorUrl: x.creator_url,
    license: x.license,
    licenseUrl: x.license_url,
    source: x.foreign_landing_url,
    mature: x.mature
  }));
}

export async function searchOpenverseAudio(q, { page=1, page_size=10 } = {}){
  const url = `${OV_BASE}/audio/?q=${encodeURIComponent(q)}&page=${page}&page_size=${page_size}`;
  const r = await fetch(url);
  if(!r.ok) throw new Error("Openverse audio fetch failed");
  const data = await r.json();
  return (data.results || []).filter(kidSafe).map(x => ({
    id: x.id,
    title: x.title,
    url: x.url,
    creator: x.creator,
    creatorUrl: x.creator_url,
    license: x.license,
    licenseUrl: x.license_url,
    source: x.foreign_landing_url,
    mature: x.mature
  }));
}
