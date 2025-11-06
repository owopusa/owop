console.log("firebase.js is loaded!"); // Debugging

// ✅ Import Firebase modules dynamically
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Initializing Firebase...");

    try {
        // ✅ Dynamically import Firebase modules (ES6 Modules)
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
        const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");

        // ✅ Firebase Configuration
        const firebaseConfig = {
            apiKey: "AIzaSyB3NM4tnVIoN3TFV7DrelzpBcwYFl_jqmU",
            authDomain: "our-wallets-our-power.firebaseapp.com",
            projectId: "our-wallets-our-power",
            storageBucket: "our-wallets-our-power.appspot.com",
            messagingSenderId: "109507287783",
            appId: "1:109507287783:web:0ff7ec45fe1dff15906042",
            measurementId: "G-ZMS07V2XWE"
        };

        // ✅ Initialize Firebase
        const app = initializeApp(firebaseConfig);
        console.log("Firebase Initialized:", app);

        // ✅ Initialize Firestore
        const db = getFirestore(app);
        console.log("Firestore Initialized:", db);

        // ✅ Set Firestore globally
        window.db = db;

    } catch (error) {
        console.error("❌ Firebase Initialization Error:", error);
    }
});
