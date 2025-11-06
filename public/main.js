  // ✅ FINAL VERSION — Popular vote container only has background color, votes update smoothly
  document.addEventListener("DOMContentLoaded", async function () {
    console.log("🚀 Initializing App...");

    const { initializeApp, getApps } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getFirestore, doc, getDoc, updateDoc, collection, getDocs } =
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

    window.toggleCityField = function () {
      const stateSelect = document.getElementById("state");
      const cityField = document.getElementById("city");
      if (!stateSelect || !cityField) return;
      cityField.style.display = stateSelect.value && stateSelect.value !== "all" ? "block" : "none";
    };

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

    await loadDropdownData("categories.json", "filter-category");
    await loadDropdownData("states.json", "filter-state");
    await loadDropdownData("types.json", "filter-type");
    await loadDropdownData("categories.json", "category");
    await loadDropdownData("states.json", "state");
    await loadDropdownData("types.json", "type");

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
          <div class="segment oppose" style="width:${opposePct}%">
            <span class="segment-count">${votes.oppose}</span>
          </div>
          <div class="segment neutral" style="width:${neutralPct}%">
            <span class="segment-count">${votes.neutral}</span>
          </div>
          <div class="segment pro" style="width:${proPct}%">
            <span class="segment-count">${votes.support}</span>
          </div>
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

    // === Handle Brand Submission ===
  const brandForm = document.getElementById("brandForm");
  if (brandForm) {
    brandForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("brandName")?.value.trim();
      const logoUrl = document.getElementById("brandLogo")?.value.trim();
      const category = document.getElementById("category")?.value;
      const type = document.getElementById("type")?.value;
      const state = document.getElementById("state")?.value;
      const description = document.getElementById("brandDescription")?.value.trim() || "";
      
      if (!name) {
        alert("Brand name is required.");
        return;
      }

      try {
        const { addDoc, collection } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        await addDoc(collection(db, "Brands"), {
          "Brand Name": name,
          logoUrl: logoUrl || "",
          Category: category || "Uncategorized",
          Type: type || "General",
          State: state || "All",
          description,
          votes: { support: 0, neutral: 0, oppose: 0 },
          editorial: { owop_status: "no-rank" },
          createdAt: new Date().toISOString(),
        });

        alert("✅ Brand added successfully!");
        brandForm.reset();
        fetchBrands(); // reload grid
      } catch (err) {
        console.error("Error adding brand:", err);
        alert("Error adding brand. Check console for details.");
      }
    });
  }
    async function fetchBrands() {
      const snapshot = await getDocs(collection(db, "Brands"));
      const brands = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderBrands(brands);
    }

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
    data-editorial="${brand.editorial?.owop_status || 'no-rank'}">

    <div class="tile-header">
      <span class="our-view-label">Our View:</span>
      ${renderEditorialLight(brand.editorial)}
      <span class="info-icon" data-blurb="${brand.description || 'No additional info.'}">ℹ️</span>
    </div>

    <div class="brand-core">
      <img class="brand-logo" src="${brand.logoUrl}" alt="${brand.name} logo">
      <h3 class="brand-name">${brand["Brand Name"] || "Unknown Brand"}</h3>
      <p class="category-line">Category: ${
        Array.isArray(brand.Category)
          ? brand.Category[0] || "Uncategorized"
          : brand.Category || "Uncategorized"
      }</p>
    </div>

    <!-- ✅ FIXED POPULAR VOTE block -->
    <div class="popular-vote-container"
        data-dominant="${status.includes('Supports') ? 'support' :
                        status.includes('Opposes') ? 'oppose' : 'neutral'}">
      <div class="vote-header">POPULAR VOTE</div>
      ${renderVoteBlock(votes, brand.id)}
      <p class="opinion-line">Community Opinion: <strong class="status">${status}</strong></p>
    </div>
  </div>`;
    }).join("");

    attachVotingHandlers();
    attachInfoModalHandlers();
    filterBrands();
  }


    function attachVotingHandlers() {
  const voteCooldowns = new Map(); // brandId → timestamp

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

    async function updateVote(brandId, type) {
      const ref = doc(db, "Brands", brandId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      let votes = normalizeVotes(snap.data().votes);
      votes[type] = (votes[type] || 0) + 1;

      const status = getStatusLabel(votes);
      const bgColor = getBackgroundColorByDominant(votes);

      await updateDoc(ref, { votes, status });

      const el = document.querySelector(`[data-brand-id="${brandId}"]`);
      if (!el) return;
      const container = el.querySelector(".popular-vote-container");
      if (container) {
    // Determine dominant again and set attribute (this drives the CSS color)
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
        const totalVotes = votes.support + votes.neutral + votes.oppose;
        bar.querySelector(".segment.pro").style.width = (votes.support / totalVotes) * 100 + "%";
        bar.querySelector(".segment.neutral").style.width = (votes.neutral / totalVotes) * 100 + "%";
        bar.querySelector(".segment.oppose").style.width = (votes.oppose / totalVotes) * 100 + "%";
        bar.querySelector(".segment.pro .segment-count").textContent = votes.support;
        bar.querySelector(".segment.neutral .segment-count").textContent = votes.neutral;
        bar.querySelector(".segment.oppose .segment-count").textContent = votes.oppose;
      }
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

    function filterBrands() {
      const search = document.getElementById("search-input")?.value.toLowerCase() || "";
      const type = document.getElementById("filter-type")?.value;
      const category = document.getElementById("filter-category")?.value;
      const state = document.getElementById("filter-state")?.value;
      const minVotes = Number(document.getElementById("minVotes")?.value || 0);
      document.querySelectorAll(".brand-item").forEach(b => {
        const name = b.querySelector(".brand-name")?.textContent.toLowerCase();
        const categoryList = (b.dataset.category || "").split(",").map(c => c.trim().toLowerCase());
        const totalVotes =
          Number(b.querySelector(".segment.pro .segment-count")?.textContent || 0) +
          Number(b.querySelector(".segment.neutral .segment-count")?.textContent || 0) +
          Number(b.querySelector(".segment.oppose .segment-count")?.textContent || 0);
        const match =
          name.includes(search) &&
          (type === "all" || b.dataset.type === type) &&
          (category === "all" || categoryList.includes(category.toLowerCase())) &&
          (state === "all" || b.dataset.state === state) &&
          (totalVotes >= minVotes);
        b.style.display = match ? "block" : "none";
      });
    }

    document.getElementById("search-input")?.addEventListener("input", filterBrands);
    document.getElementById("filter-type")?.addEventListener("change", filterBrands);
    document.getElementById("filter-category")?.addEventListener("change", filterBrands);
    document.getElementById("filter-state")?.addEventListener("change", filterBrands);
    document.getElementById("filter-editorial")?.addEventListener("change", filterBrands);

    fetchBrands();
  });
