const SUPABASE_URL = "https://ypaogamdapbvuzwphngh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wI8kuJuKQaH2-JO63Og5wA_LjoiHuJ4";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let currentUser = null;

function showMessage(text, isError = false) {
  const msgElem = document.getElementById("statusMessage");
  if (!msgElem) return;
  msgElem.textContent = text;
  msgElem.className = `message ${isError ? "error" : "success"}`;
  msgElem.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabaseClient) {
    console.error("Supabase failed to initialize.");
    return;
  }

  // 1. Session & Auth Check
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error || !session) {
    window.location.href = "index.html";
    return;
  }

  currentUser = session.user;

  // 2. Setup Top-Right Sign Out
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // 3. Tab Switching
  setupTabs();

  // 4. Load Data
  await loadUserProfile();
  await loadAppliedOpportunities();

  // 5. Form Submit Handler
  setupProfileForm();
});

function setupTabs() {
  const tabBasicInfo = document.getElementById("tabBasicInfo");
  const tabApplications = document.getElementById("tabApplications");
  const basicInfoSection = document.getElementById("basicInfoSection");
  const applicationsSection = document.getElementById("applicationsSection");

  tabBasicInfo.addEventListener("click", () => {
    tabBasicInfo.classList.add("active");
    tabApplications.classList.remove("active");
    basicInfoSection.classList.remove("hidden");
    applicationsSection.classList.add("hidden");
  });

  tabApplications.addEventListener("click", () => {
    tabApplications.classList.add("active");
    tabBasicInfo.classList.remove("active");
    applicationsSection.classList.remove("hidden");
    basicInfoSection.classList.add("hidden");
  });
}

// user profile
async function loadUserProfile() {
  const emailInput = document.getElementById("profileEmail");
  const displayEmail = document.getElementById("displayEmail");
  const displayFullName = document.getElementById("displayFullName");

  if (emailInput) emailInput.value = currentUser.email || "";
  if (displayEmail) displayEmail.textContent = currentUser.email || "";

  try {
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.warn("Could not fetch profile details:", error.message);
    }

    const name = profile?.full_name || currentUser.user_metadata?.full_name || "Graduate";
    if (displayFullName) displayFullName.textContent = name;

    // form fields
    document.getElementById("profileFullName").value = profile?.full_name || currentUser.user_metadata?.full_name || "";
    document.getElementById("profilePhone").value = profile?.phone || "";
    document.getElementById("profileInstitution").value = profile?.institution || "";
    document.getElementById("profileCourse").value = profile?.course || "";
    document.getElementById("profileBio").value = profile?.bio || "";
  } catch (err) {
    console.error("Profile load exception:", err);
  }
}

// Update profile details
function setupProfileForm() {
  const form = document.getElementById("profileForm");
  const saveBtn = document.getElementById("saveProfileBtn");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("profileFullName").value.trim();
    const phone = document.getElementById("profilePhone").value.trim();
    const institution = document.getElementById("profileInstitution").value.trim();
    const course = document.getElementById("profileCourse").value.trim();
    const bio = document.getElementById("profileBio").value.trim();

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      const updates = {
        id: currentUser.id,
        email: currentUser.email,
        full_name: fullName,
        phone: phone,
        institution: institution,
        course: course,
        bio: bio,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from("profiles")
        .upsert(updates);

      if (error) {
        showMessage("Failed to update profile: " + error.message, true);
        return;
      }

      document.getElementById("displayFullName").textContent = fullName || "Graduate";
      showMessage("Profile details updated successfully!");
    } catch (err) {
      showMessage("An unexpected error occurred: " + err.message, true);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save Profile";
    }
  });
}

// Fetch applied opportunities
async function loadAppliedOpportunities() {
  const container = document.getElementById("applicationsList");
  if (!container) return;

  try {
    // 1. Get application records
    const { data: applications, error: appsError } = await supabaseClient
      .from("applications")
      .select("opportunity_id, created_at")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false });

    if (appsError) {
      container.innerHTML = `<p class="message error">Could not load applications: ${appsError.message}</p>`;
      return;
    }

    if (!applications || applications.length === 0) {
      container.innerHTML = `<p class="loading-text">You haven't applied to any opportunities yet.</p>`;
      return;
    }

    // 2. Fetch opportunity details
    const oppIds = applications.map(a => a.opportunity_id);
    const { data: opportunities, error: oppsError } = await supabaseClient
      .from("opportunities")
      .select("*")
      .in("id", oppIds);

    if (oppsError) {
      container.innerHTML = `<p class="message error">Could not load listing details: ${oppsError.message}</p>`;
      return;
    }

    const oppMap = new Map((opportunities || []).map(o => [o.id, o]));

    container.innerHTML = applications.map(app => {
      const opp = oppMap.get(app.opportunity_id);
      const appliedDate = app.created_at ? new Date(app.created_at).toLocaleDateString() : "Recently";

      if (!opp) {
        return `
          <div class="app-card">
            <div class="app-card-header">
              <h3>Archived Opportunity</h3>
              <span class="badge-submitted">Applied</span>
            </div>
            <p class="app-card-date">Submitted on: ${appliedDate}</p>
          </div>
        `;
      }

      return `
        <div class="app-card">
          <div class="app-card-header">
            <h3>${opp.title}</h3>
            <span class="badge-submitted">Submitted</span>
          </div>
          <div class="app-card-meta">
            <span><strong>${opp.company}</strong></span>
            <span>•</span>
            <span>${opp.location}</span>
            <span>•</span>
            <span>${opp.type}</span>
          </div>
          <p class="app-card-date"><i class="fa-regular fa-clock"></i> Applied on ${appliedDate}</p>
        </div>
      `;
    }).join("");
  } catch (err) {
    container.innerHTML = `<p class="message error">Error loading records: ${err.message}</p>`;
  }
}
