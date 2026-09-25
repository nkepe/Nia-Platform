const SUPABASE_URL = "https://ypaogamdapbvuzwphngh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wI8kuJuKQaH2-JO63Og5wA_LjoiHuJ4";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const ADMIN_EMAILS = [
  "davidkasimilu71@gmail.com",
  "nkepedavid@gmail.com"
];

function showStatusModal(isSuccess, title, message) {
  const modal = document.getElementById("statusModal");
  const modalIcon = document.getElementById("statusModalIcon");
  const modalTitle = document.getElementById("statusModalTitle");
  const modalMsg = document.getElementById("statusModalMessage");

  if (!modal) {
    alert(`${title}: ${message}`);
    return;
  }

  if (modalIcon) modalIcon.textContent = isSuccess ? "✅" : "⚠️";
  if (modalTitle) {
    modalTitle.textContent = title;
    modalTitle.style.color = isSuccess ? "#16a34a" : "#dc2626";
  }
  if (modalMsg) modalMsg.textContent = message;

  modal.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", async () => {
  // Modal close handlers
  const closeModalBtn = document.getElementById("closeStatusModalBtn");
  const statusModal = document.getElementById("statusModal");
  if (closeModalBtn && statusModal) {
    closeModalBtn.addEventListener("click", () => statusModal.classList.add("hidden"));
  }
  window.addEventListener("click", (e) => {
    if (e.target === statusModal) statusModal.classList.add("hidden");
  });

  if (!supabaseClient) {
    alert("Supabase failed to load. Check your internet connection or script CDN tag.");
    return;
  }

  // 1. Verify User and Admin
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError || !session) {
    window.location.href = "index.html";
    return;
  }

  const userEmail = session.user.email ? session.user.email.toLowerCase() : "";
  const isDirectAdmin = ADMIN_EMAILS.includes(userEmail);

  let isProfileAdmin = false;
  try {
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    isProfileAdmin = profile && profile.role === "admin";
  } catch (err) {
    console.error("Profile check error:", err);
  }

  if (!isDirectAdmin && !isProfileAdmin) {
    alert("Access Denied: Admin credentials required.");
    window.location.href = "dashboard.html";
    return;
  }

  const userEmailElem = document.getElementById("userEmail");
  if (userEmailElem) {
    userEmailElem.textContent = `${session.user.email} (Admin)`;
  }

  // 2. Sign Out
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // 3. Form Submission
  const postJobForm = document.getElementById("postJobForm");
  const submitBtn = document.getElementById("submitBtn") || postJobForm?.querySelector("button[type='submit']");

  if (postJobForm) {
    postJobForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = document.getElementById("jobTitle")?.value.trim();
      const company = document.getElementById("companyName")?.value.trim();
      const location = document.getElementById("jobLocation")?.value.trim();
      const type = document.getElementById("jobType")?.value || "Industrial Attachment";
      const description = document.getElementById("jobDesc")?.value.trim();

      if (!title || !company || !location || !description) {
        showStatusModal(false, "Incomplete Form", "Please fill in all fields.");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Publishing...";
      }

      try {
        const { error } = await supabaseClient
          .from("opportunities")
          .insert([
            {
              title,
              company,
              location,
              type,
              description
            }
          ]);

        if (error) {
          console.error("Supabase insert error:", error);
          showStatusModal(false, "Failed to Post", error.message);
          return;
        }

        showStatusModal(true, "Published!", `Opportunity "${title}" is now live for students.`);
        postJobForm.reset();
      } catch (err) {
        console.error("Submission exception:", err);
        showStatusModal(false, "Error", err.message || "Failed to communicate with Supabase.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Publish Opportunity";
        }
      }
    });
  }
});
