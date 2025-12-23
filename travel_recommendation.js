let TRAVEL_DATA = null;

document.addEventListener("DOMContentLoaded", async () => {
  TRAVEL_DATA = await safeFetchJson("./travel_recommendation.json");

  // Background image for each page
  if (TRAVEL_DATA) {
    const page = getPageTypeFromUrl();
    const bgUrl = pickBackgroundImageUrl(TRAVEL_DATA, page);
    if (bgUrl) applyPageBackground(bgUrl);
  } else {
    console.warn("JSON not loaded. Use Live Server / localhost, not file://");
  }

  // Search UI exists ONLY on home page
  const btnSearch = document.getElementById("btnSearch");
  const btnClear = document.getElementById("btnClear");
  const searchInput = document.getElementById("searchInput");

  if (btnSearch && btnClear && searchInput) {
    btnSearch.addEventListener("click", () => runSearch(searchInput.value));

    btnClear.addEventListener("click", () => {
      searchInput.value = "";
      hideMsg();
      renderDefaultCards();
      searchInput.focus();
    });

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runSearch(searchInput.value);
    });
  }

  // Default home cards
  if (getPageTypeFromUrl() === "home") {
    renderDefaultCards();
  }
});

function runSearch(rawQuery) {
  const q = (rawQuery || "").trim().toLowerCase();

  if (!TRAVEL_DATA) {
    showMsg("Data not loaded. Make sure you're using Live Server (localhost).");
    return;
  }

  if (!q) {
    showMsg("Please enter a valid search query.");
    return;
  }

  const results = searchInData(TRAVEL_DATA, q);

  if (results.length === 0) {
    showMsg(`No results found for "${rawQuery}". Try: sydney, beach, tokyo, temple...`);
    renderResults([]);
    return;
  }

  hideMsg();
  renderResults(results);
}

function searchInData(data, q) {
  const found = [];

  // Cities
  (data.countries || []).forEach((country) => {
    const countryMatch = (country.name || "").toLowerCase().includes(q);

    (country.cities || []).forEach((city) => {
      const name = city.name || "";
      const desc = city.description || "";
      const match =
        countryMatch ||
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q);

      if (match) {
        found.push({
          name,
          imageUrl: city.imageUrl,
          description: desc,
          tag: country.name
        });
      }
    });
  });

  // Temples
  (data.temples || []).forEach((t) => {
    const name = t.name || "";
    const desc = t.description || "";
    if (name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || q.includes("temple")) {
      found.push({
        name,
        imageUrl: t.imageUrl,
        description: desc,
        tag: "Temples"
      });
    }
  });

  // Beaches
  (data.beaches || []).forEach((b) => {
    const name = b.name || "";
    const desc = b.description || "";
    if (name.toLowerCase().includes(q) || desc.toLowerCase().includes(q) || q.includes("beach")) {
      found.push({
        name,
        imageUrl: b.imageUrl,
        description: desc,
        tag: "Beaches"
      });
    }
  });

  return found;
}

function renderDefaultCards() {
  if (!TRAVEL_DATA) return;

  const sydney = TRAVEL_DATA?.countries?.[0]?.cities?.[0];
  const rio = TRAVEL_DATA?.countries?.[2]?.cities?.[0];

  const defaults = [];
  if (sydney) defaults.push({ name: sydney.name, imageUrl: sydney.imageUrl, description: sydney.description });
  if (rio) defaults.push({ name: rio.name, imageUrl: rio.imageUrl, description: rio.description });

  renderResults(defaults);
}

function renderResults(items) {
  const list = document.getElementById("resultsList");
  if (!list) return;

  list.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("div");
    img.className = "card__img";
    img.style.backgroundImage =
      `linear-gradient(90deg, rgba(0,0,0,0.25), rgba(0,0,0,0.05)), url("${item.imageUrl}")`;

    const body = document.createElement("div");
    body.className = "card__body";

    const title = document.createElement("h3");
    title.className = "card__title";
    title.textContent = item.name;

    const desc = document.createElement("p");
    desc.className = "card__desc";
    desc.textContent = item.description;

    const btn = document.createElement("button");
    btn.className = "btn btn--small";
    btn.type = "button";
    btn.textContent = "Visit";

    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(btn);

    card.appendChild(img);
    card.appendChild(body);

    list.appendChild(card);
  });
}

function showMsg(text) {
  const el = document.getElementById("resultsMsg");
  if (!el) return;
  el.textContent = text;
  el.style.display = "block";
}

function hideMsg() {
  const el = document.getElementById("resultsMsg");
  if (!el) return;
  el.textContent = "";
  el.style.display = "none";
}

/* Page helpers */
function getPageTypeFromUrl() {
  const path = (window.location.pathname || "").toLowerCase();
  if (path.endsWith("/about.html") || path.endsWith("about.html")) return "about";
  if (path.endsWith("/contact.html") || path.endsWith("contact.html")) return "contact";
  return "home"; // travel_recommendation.html
}

async function safeFetchJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to load JSON:", err);
    return null;
  }
}

function pickBackgroundImageUrl(data, page) {
  if (page === "home") return data?.countries?.[0]?.cities?.[0]?.imageUrl;   // Sydney
  if (page === "about") return data?.countries?.[1]?.cities?.[0]?.imageUrl;  // Tokyo
  if (page === "contact") return data?.beaches?.[0]?.imageUrl;               // Bora Bora
  return data?.beaches?.[0]?.imageUrl;
}

function applyPageBackground(imageUrl) {
  document.body.style.backgroundImage =
    `linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.10)), url("${imageUrl}")`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  document.body.style.backgroundAttachment = "fixed";
}
