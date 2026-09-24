document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const authModal = document.getElementById("authModal");

  const tabSignIn = document.getElementById("tabSignIn");
  const tabSignUp = document.getElementById("tabSignUp");
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const authMessage = document.getElementById("authMessage");

  // --- Helper Functions ---
  function showMessage(text, isError = false) {
    if (!authMessage) return;
    authMessage.textContent = text;
    authMessage.className = `message ${isError ? "error" : "info"}`;
    authMessage.classList.remove("hidden");
  }

  function clearMessage() {
    if (!authMessage) return;
    authMessage.textContent = "";
    authMessage.className = "message hidden";
  }

  // --- Modal Open/Close Controls ---
  function openModal() {
    if (authModal) {
      authModal.classList.remove("hidden");
      clearMessage();
    }
  }

  function closeModal() {
    if (authModal) {
      authModal.classList.add("hidden");
      clearMessage();
    }
  }

  if (openModalBtn) {
    openModalBtn.addEventListener("click", openModal);
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  // Close when clicking overlay backdrop
  window.addEventListener("click", (e) => {
    if (e.target === authModal) {
      closeModal();
    }
  });

  // --- Tab Switching ---
  if (tabSignIn && tabSignUp && signInForm && signUpForm) {
    tabSignIn.addEventListener("click", () => {
      tabSignIn.classList.add("active");
      tabSignUp.classList.remove("active");
      signInForm.classList.remove("hidden");
      signUpForm.classList.add("hidden");
      clearMessage();
    });

    tabSignUp.addEventListener("click", () => {
      tabSignUp.classList.add("active");
      tabSignIn.classList.remove("active");
      signUpForm.classList.remove("hidden");
      signInForm.classList.add("hidden");
      clearMessage();
    });
  }

  const SUPABASE_URL = "https://ypaogamdapbvuzwphngh.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_wI8kuJuKQaH2-JO63Og5wA_LjoiHuJ4";

  let supabase = null;

  const isConfigured = 
    SUPABASE_URL !== "https://ypaogamdapbvuzwphngh.supabase.co" && 
    SUPABASE_ANON_KEY !== "sb_publishable_wI8kuJuKQaH2-JO63Og5wA_LjoiHuJ4" &&
    SUPABASE_URL.startsWith("https://");

  if (window.supabase && isConfigured) {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.error("Supabase failed to initialize:", err);
    }
  }

  // --- Sign In Handler ---
  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessage();

      if (!supabase) {
        showMessage("Enter valid Supabase URL & Key in app.js", true);
        return;
      }

      const email = document.getElementById("signinEmail").value.trim();
      const password = document.getElementById("signinPassword").value;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          showMessage(error.message, true);
          return;
        }

        window.location.href = "dashboard.html";
      } catch (err) {
        showMessage(err.message || "An unexpected error occurred", true);
      }
    });
  }

  // --- Sign Up Handler ---
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessage();

      if (!supabase) {
        showMessage("Enter valid Supabase URL & Key in app.js", true);
        return;
      }

      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value;

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          showMessage(error.message, true);
          return;
        }

        if (data.session) {
          window.location.href = "dashboard.html";
        } else {
          showMessage("Account created! Check your email to confirm.", false);
        }
      } catch (err) {
        showMessage(err.message || "An unexpected error occurred", true);
      }
    });
  }
});
