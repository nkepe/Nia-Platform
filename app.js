document.addEventListener("DOMContentLoaded", () => {
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const authModal = document.getElementById("authModal");

  const tabSignIn = document.getElementById("tabSignIn");
  const tabSignUp = document.getElementById("tabSignUp");
  const signInForm = document.getElementById("signInForm");
  const signUpForm = document.getElementById("signUpForm");
  const authMessage = document.getElementById("authMessage");

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

  if (openModalBtn) openModalBtn.addEventListener("click", openModal);
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === authModal) closeModal();
  });

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
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  const ADMIN_EMAILS = [
    "davidkasimilu71@gmail.com",
    "nkepedavid@gmail.com"
  ];

  async function routeUser(user) {
    const email = user.email ? user.email.toLowerCase() : "";
    if (ADMIN_EMAILS.includes(email)) {
      window.location.href = "admin.html";
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && profile.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } catch {
      window.location.href = "dashboard.html";
    }
  }

  // --- Sign In ---
  if (signInForm) {
    signInForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessage();

      if (!supabase) {
        showMessage("Supabase client is not loaded.", true);
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

        if (data?.user) {
          await routeUser(data.user);
        }
      } catch (err) {
        showMessage(err.message || "An unexpected error occurred", true);
      }
    });
  }

  // --- Sign Up ---
  if (signUpForm) {
    signUpForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearMessage();

      if (!supabase) {
        showMessage("Supabase client is not loaded.", true);
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

        if (data?.session && data?.user) {
          await routeUser(data.user);
        } else {
          showMessage("Account registered! Please sign in.", false);
        }
      } catch (err) {
        showMessage(err.message || "An unexpected error occurred", true);
      }
    });
  }
});
