// ✅ FINAL FIXED VERSION — Stable filters, clean spacing, consistent rendering
document.addEventListener("DOMContentLoaded", async function () {
  console.log("🚀 Initializing App...");

// ✅ Detect mobile and auto-enable logo-only view
if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  document.body.classList.add("logo-only");
  console.log("📱 Mobile detected — starting in logo-only view");
}

  const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
  const { getFirestore, doc, getDoc, updateDoc, collection, getDocs, addDoc } =
    await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

  const firebaseConfig = {
    apiKey: "AIzaSyB3NM4tnVIoN3TFV7DrelzpBcwYFl_jqmU",
    authDomain: "our-wallets-our-power.firebaseapp.com",
    projectId: "our-wallets-our-power",
    storageBucket: "our-wallets-our-power.appspot.com",
    messagingSenderId: "109507287783",
    appId: "1:109507287783:web:0ff7ec45fe1dff15906042",
    measurementId: "G-ZMS07V2XWE"
  };

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  window.db = db;

  // === Helper Functions ===
  function normalizeVotes(v) {
    if (!v || typeof v !== "object") return { support: 0, neutral: 0, oppose: 0 };
    return {
      support: Number(v.support) || 0,
      neutral: Number(v.neutral) || 0,
      oppose: Number(v.oppose) || 0
    };
  }

  async function loadDropdownData(url, elementId) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      const select = document.getElementById(elementId);
      let label = "All";
      if (elementId.includes("category")) label = "All Categories";
      else if (elementId.includes("type")) label = "All Types";
      else if (elementId.includes("state")) label = "All States";
      select.innerHTML = `<option value="all">${label}</option>`;
      data.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        select.appendChild(option);
      });
    } catch (err) {
      console.error(`Error loading ${elementId}:`, err);
    }
  }

  function getBackgroundColorByDominant(votes) {
    const total = votes.support + votes.neutral + votes.oppose;
    if (!total) return "#f7f7f7";
    const max = Math.max(votes.support, votes.neutral, votes.oppose);
    if (max === votes.support) return "#ffe5e5";
    if (max === votes.oppose) return "#e5efff";
    return "#f0f0f0";
  }

  function getStatusLabel(votes) {
    const total = votes.support + votes.neutral + votes.oppose;
    if (!total) return "No Votes Yet";
    const max = Math.max(votes.support, votes.neutral, votes.oppose);
    if (max === votes.support) return "Supports Trump Policies";
    if (max === votes.oppose) return "Opposes Trump Policies";
    return "No Political Leaning";
  }

  function renderVoteBlock(votes, brandId) {
    const total = votes.support + votes.neutral + votes.oppose;
    if (!total) {
      return `
        <div class="vote-wrapper">
          <div class="vote-bar">
            <div class="segment oppose" style="width:33.3%"><span class="segment-count">0</span></div>
            <div class="segment neutral" style="width:33.3%"><span class="segment-count">0</span></div>
            <div class="segment pro" style="width:33.3%"><span class="segment-count">0</span></div>
          </div>
          <div class="vote-buttons">
            <button class="vote-btn" data-brand-id="${brandId}" data-type="oppose">🔵</button>
            <button class="vote-btn" data-brand-id="${brandId}" data-type="neutral">⚪</button>
            <button class="vote-btn" data-brand-id="${brandId}" data-type="support">🔴</button>
          </div>
        </div>`;
    }

    const proPct = (votes.support / total) * 100;
    const neutralPct = (votes.neutral / total) * 100;
    const opposePct = (votes.oppose / total) * 100;

    return `
      <div class="vote-wrapper">
        <div class="vote-bar">
          <div class="segment oppose" style="width:${opposePct}%"><span class="segment-count">${votes.oppose}</span></div>
          <div class="segment neutral" style="width:${neutralPct}%"><span class="segment-count">${votes.neutral}</span></div>
          <div class="segment pro" style="width:${proPct}%"><span class="segment-count">${votes.support}</span></div>
        </div>
        <div class="vote-buttons">
          <button class="vote-btn" data-brand-id="${brandId}" data-type="oppose">🔵</button>
          <button class="vote-btn" data-brand-id="${brandId}" data-type="neutral">⚪</button>
          <button class="vote-btn" data-brand-id="${brandId}" data-type="support">🔴</button>
        </div>
      </div>`;
  }

  function renderEditorialLight(editorial) {
    const status = editorial?.owop_status || "no-rank";
    let color = "#bdc3c7";
    let label = "Not Rated";
    if (status === "support") {
      color = "#2ecc71";
      label = "Support";
    } else if (status === "stay-away") {
      color = "#e74c3c";
      label = "Do Not Support";
    }
    return `
      <div class="editorial-light">
        <span class="light" style="background-color:${color}"></span>
        <span class="light-label">${label}</span>
      </div>`;
  }

  // === Voting and Info ===
  function attachVotingHandlers() {
    const voteCooldowns = new Map();
    document.querySelectorAll(".vote-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const brandId = btn.dataset.brandId;
        const now = Date.now();
        const lastVote = voteCooldowns.get(brandId) || 0;
        if (now - lastVote < 5000) {
          alert("⏳ Please wait 5 seconds before voting again.");
          return;
        }
        voteCooldowns.set(brandId, now);
        updateVote(brandId, btn.dataset.type);
      });
    });
  }

  function attachInfoModalHandlers() {
    document.querySelectorAll(".info-icon").forEach(icon =>
      icon.addEventListener("click", () => {
        const modal = document.getElementById("infoModal");
        document.getElementById("modalText").innerHTML = `<p>${icon.dataset.blurb || "No info available."}</p>`;
        modal.style.display = "block";
      })
    );
    document.getElementById("closeModal")?.addEventListener("click", () =>
      (document.getElementById("infoModal").style.display = "none")
    );
    window.addEventListener("click", e => {
      if (e.target === document.getElementById("infoModal")) {
        document.getElementById("infoModal").style.display = "none";
      }
    });
  }

  async function updateVote(brandId, type) {
    const ref = doc(db, "Brands", brandId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    let votes = normalizeVotes(snap.data().votes);
    votes[type] = (votes[type] || 0) + 1;

    const status = getStatusLabel(votes);
    await updateDoc(ref, { votes, status });

    const el = document.querySelector(`[data-brand-id="${brandId}"]`);
    if (!el) return;
    const container = el.querySelector(".popular-vote-container");
    if (container) {
      const dominant = status.includes("Supports")
        ? "support"
        : status.includes("Opposes")
        ? "oppose"
        : "neutral";
      container.setAttribute("data-dominant", dominant);
    }
    el.querySelector(".status").textContent = status;

    const bar = el.querySelector(".vote-bar");
    if (bar) {
      const total = votes.support + votes.neutral + votes.oppose;
      bar.querySelector(".segment.pro").style.width = (votes.support / total) * 100 + "%";
      bar.querySelector(".segment.neutral").style.width = (votes.neutral / total) * 100 + "%";
      bar.querySelector(".segment.oppose").style.width = (votes.oppose / total) * 100 + "%";
      bar.querySelector(".segment.pro .segment-count").textContent = votes.support;
      bar.querySelector(".segment.neutral .segment-count").textContent = votes.neutral;
      bar.querySelector(".segment.oppose .segment-count").textContent = votes.oppose;
    }
  }

  // === Brand Rendering ===
  function renderBrands(brands) {
    const container = document.getElementById("brandList");
    container.innerHTML = brands.map(brand => {
      const votes = normalizeVotes(brand.votes);
      const status = getStatusLabel(votes);
      const bgColor = getBackgroundColorByDominant(votes);
      return `
      <div class="brand-item"
  data-brand-id="${brand.id}"
  data-type="${brand.Type || ''}"
  data-category="${brand.Category || ''}"
  data-state="${brand.State || ''}"
  data-dominant="${status.includes('Supports') ? 'support' :
                  status.includes('Opposes') ? 'oppose' : 'neutral'}">
        <div class="tile-header">
          <span class="our-view-label">Our View:</span>
          ${renderEditorialLight(brand.editorial)}
          <span class="info-icon" data-blurb="${brand.description || 'No additional info.'}">ℹ️</span>
        </div>
        <div class="brand-core">
          <div class="logo-box">
            <img class="brand-logo" src="${brand.logoUrl}" alt="${brand.name} logo">
          </div>
          <h3 class="brand-name">${brand["Brand Name"] || "Unknown Brand"}</h3>
          <p class="category-line">Category: ${
            Array.isArray(brand.Category)
              ? brand.Category[0] || "Uncategorized"
              : brand.Category || "Uncategorized"
          }</p>
        </div>
        <div class="popular-vote-container" data-dominant="${status.includes('Supports') ? 'support' :
            status.includes('Opposes') ? 'oppose' : 'neutral'}">
          <div class="vote-header">POPULAR VOTE</div>
          ${renderVoteBlock(votes, brand.id)}
          <p class="opinion-line">Community Opinion: <strong class="status">${status}</strong></p>
        </div>
      </div>`;
    }).join("");

    attachVotingHandlers();
    attachInfoModalHandlers();

    // Keep filters applied after rendering
    if (typeof window.filterBrands === "function") {
      setTimeout(() => window.filterBrands(), 0);
    }
  }

  async function fetchBrands() {
    const snapshot = await getDocs(collection(db, "Brands"));
    const brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderBrands(brands);
  }

  // === Filtering ===
function filterBrands() {
  const search = document.getElementById("search-input")?.value.toLowerCase() || "";
  const type = document.getElementById("filter-type")?.value || "all";
  const category = document.getElementById("filter-category")?.value || "all";
  const state = document.getElementById("filter-state")?.value || "all";
  const minVotes = Number(document.getElementById("minVotes")?.value || 0);

  console.log("🔍 filterBrands called with:", { search, type, category, state, minVotes });

  const inLogoOnly = document.body.classList.contains("logo-only");

  document.querySelectorAll(".brand-item").forEach(b => {
    const brandName = b.querySelector(".brand-name")?.textContent.toLowerCase() || "";
    const brandCategory = (b.dataset.category || "").toLowerCase();
    const brandType = (b.dataset.type || "").toLowerCase();
    const brandState = (b.dataset.state || "").toLowerCase();

    const totalVotes =
      Number(b.querySelector(".segment.pro .segment-count")?.textContent || 0) +
      Number(b.querySelector(".segment.neutral .segment-count")?.textContent || 0) +
      Number(b.querySelector(".segment.oppose .segment-count")?.textContent || 0);

    const match =
      (!search || brandName.includes(search)) &&
      (type === "all" || brandType === type.toLowerCase()) &&
      (category === "all" || brandCategory.includes(category.toLowerCase())) &&
      (state === "all" || brandState === state.toLowerCase()) &&
      totalVotes >= minVotes;

    // ✅ Remove from layout if not matched
    b.classList.toggle("hidden", !match);
  });

  // ✅ Trigger layout refresh (this reorders and closes gaps)
refreshGridLayout();

// ✅ Physically remove hidden tiles to prevent ghost cells
document.querySelectorAll(".brand-item.hidden").forEach(el => el.remove());
}
window.filterBrands = filterBrands;
// ✅ Ensures grid reflows after filter or toggle
window.refreshGridLayout = function refreshGridLayout() {
  const list = document.getElementById("brandList");
  if (!list) return;

  // Force browser to repaint the grid
  list.style.display = "none";
  void list.offsetHeight; // trigger reflow
  list.style.display = "grid";

  // Force the visible tiles to reorder smoothly
  const visibleItems = [...list.querySelectorAll(".brand-item:not(.hidden)")];
  visibleItems.forEach((item, i) => {
    item.style.order = i;
  });

  console.log("🧩 Grid refreshed & reordered");
};



  // === Initialize ===
  await Promise.all([
    loadDropdownData("categories.json", "filter-category"),
    loadDropdownData("states.json", "filter-state"),
    loadDropdownData("types.json", "filter-type"),
    loadDropdownData("categories.json", "category"),
    loadDropdownData("states.json", "state"),
    loadDropdownData("types.json", "type")
  ]);

  const filterIds = ["filter-type", "filter-category", "filter-state", "minVotes", "search-input"];
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", filterBrands);
      el.addEventListener("change", filterBrands);
    }
    // === ✅ Tap-to-vote modal in logo-only mode ===
document.addEventListener("click", e => {
  if (!document.body.classList.contains("logo-only")) return;
  const brandEl = e.target.closest(".brand-item");
  if (!brandEl) return;

  const name = brandEl.querySelector(".brand-name")?.textContent || "Unknown Brand";
  const logo = brandEl.querySelector(".brand-logo")?.src || "";
  const blurb = brandEl.querySelector(".info-icon")?.dataset.blurb || "No additional information.";
  const brandId = brandEl.dataset.brandId;

  // ✅ Only clone the vote-bar (not the full wrapper with buttons)
  const voteBar = brandEl.querySelector(".vote-bar")?.outerHTML || `
    <div class="vote-bar">
      <div class="segment oppose" style="width:33%"><span class="segment-count">0</span></div>
      <div class="segment neutral" style="width:33%"><span class="segment-count">0</span></div>
      <div class="segment pro" style="width:33%"><span class="segment-count">0</span></div>
    </div>`;

  const modal = document.getElementById("infoModal");
  const modalText = document.getElementById("modalText");

  modalText.innerHTML = `
    <div style="text-align:center;">
      <img src="${logo}" alt="${name}" style="max-width:120px;margin-bottom:10px;"><br>
      <strong style="font-size:1.1rem;">${name}</strong>
      <p style="margin-top:8px;">${blurb}</p>
      <div style="margin-top:12px; display:flex; justify-content:center;">
        ${voteBar}
      </div>
      <div style="margin-top:14px; display:flex; justify-content:center; gap:12px;">
        <button class="vote-btn" data-brand-id="${brandId}" data-type="oppose">🔵 Anti-Trump</button>
        <button class="vote-btn" data-brand-id="${brandId}" data-type="neutral">⚪ Neutral</button>
        <button class="vote-btn" data-brand-id="${brandId}" data-type="support">🔴 Pro-Trump</button>
      </div>
    </div>
  `;
  modal.style.display = "block";
});


// Close modal when user clicks outside or presses X
window.addEventListener("click", e => {
  const modal = document.getElementById("infoModal");
  if (e.target === modal) modal.style.display = "none";
});
document.getElementById("closeModal")?.addEventListener("click", () => {
  document.getElementById("infoModal").style.display = "none";
});

  });

  // ✅ DEBUG: Watch filter changes live in console
filterIds.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("input", e => {
      console.log(`🟢 ${id} changed to:`, e.target.value);
    });
    el.addEventListener("change", e => {
      console.log(`🟢 ${id} changed to:`, e.target.value);
    });
  }
});

  await fetchBrands();
});

// ✅ Auto-hide header when scrolling in logo-only view
let lastScrollTop = 0;
const header = document.getElementById("mainHeader");

window.addEventListener("scroll", () => {
  if (!document.body.classList.contains("logo-only")) return;
  const st = window.scrollY || document.documentElement.scrollTop;
  if (st > lastScrollTop + 10) {
    header?.classList.add("hidden-header");   // hide when scrolling down
  } else if (st < lastScrollTop - 10) {
    header?.classList.remove("hidden-header"); // show when scrolling up
  }
  lastScrollTop = st <= 0 ? 0 : st;
});