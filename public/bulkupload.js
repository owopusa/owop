import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function initBulkUpload() {
  const uploadBtn = document.getElementById("uploadCsvBtn");
  const fileInput = document.getElementById("csvUpload");

  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a CSV file first.");
      return;
    }

    // ⏳ Wait until Firebase has been initialized and db is set
    await waitForDbReady();

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
        const brands = results.data;
        let successCount = 0;

        for (const brandRaw of brands) {
          const brand = cleanKeys(brandRaw); // Normalize headers

          try {
            await addDoc(collection(window.db, "Brands"), brand);
            console.log("✅ Uploaded:", brand.name || brand.brand_name);
            successCount++;
          } catch (error) {
            console.error("❌ Error uploading brand:", error.message, brand);
          }
        }

        alert(`Uploaded ${successCount} brands successfully.`);
      },
    });
  });
}

function cleanKeys(obj) {
  return {
    "Brand Name": obj["Brand Name"] || obj["brand_name"],
    Category: obj["Category"] || obj["category"],
    Type: obj["Type"] || obj["type"],
    State: obj["State"] || obj["state"],
    City: obj["City"] || obj["city"],
    logoUrl: obj["Logo URL"] || obj["logo_url"],
    votes: { upvotes: 0, downvotes: 0 },
    status: "N/A"
  };
}

// 🕒 Wait for window.db to be set by firebase.js
function waitForDbReady() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.db) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}
