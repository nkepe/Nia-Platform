const SUPABASE_URL = "https://ypaogamdapbvuzwphngh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wI8kuJuKQaH2-JO63Og5wA_LjoiHuJ4";

const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const ADMIN_EMAILS = [
  "davidkasimilu71@gmail.com",
  "nkepedavid@gmail.com"
];

document.addEventListener("DOMContentLoaded", async () => {
  if (!supabaseClient) {
    console.error("Supabase client failed to initialize.");
    return;
  }

  // 1. Authentication Check
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError || !session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;
  const userEmail = user.email ? user.email.toLowerCase() : "";

  // 2. Reveal Admin Portal Btn if Admin
  const adminPortalLink = document.getElementById("adminPortalLink");
  if (adminPortalLink && ADMIN_EMAILS.includes(userEmail)) {
    adminPortalLink.classList.remove("hidden");
  }

  // 3. First-Time User Welcome Modal Check
  checkFirstTimeWelcome(user);

  // 4. Logout (Top-Right Icon)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // 5. Load Opportunities & Applications
  await loadOpportunities(user);
});

// Welcome Modal Handler
function checkFirstTimeWelcome(user) {
  const welcomeKey = `nia_welcomed_${user.id}`;
  const alreadyWelcomed = localStorage.getItem(welcomeKey);

  if (!alreadyWelcomed) {
    const welcomeModal = document.getElementById("welcomeModal");
    const welcomeHeading = document.getElementById("welcomeHeading");
    const closeBtn = document.getElementById("closeWelcomeModal");
    const dismissBtn = document.getElementById("dismissWelcomeBtn");

    // Extract first name (from user metadata or email prefix)
    let firstName = "";
    if (user.user_metadata?.first_name) {
      firstName = user.user_metadata.first_name;
    } else if (user.user_metadata?.full_name) {
      firstName = user.user_metadata.full_name.split(" ")[0];
    } else if (user.email) {
      const prefix = user.email.split("@")[0].replace(/[^a-zA-Z]/g, " ").trim();
      firstName = prefix.split(" ")[0] || "User";
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }

    if (welcomeHeading) {
      welcomeHeading.textContent = `Welcome, ${firstName}!`;
    }

    if (welcomeModal) {
      welcomeModal.classList.remove("hidden");

      const hideModal = () => {
        welcomeModal.classList.add("hidden");
        localStorage.setItem(welcomeKey, "true");
      };

      if (closeBtn) closeBtn.addEventListener("click", hideModal);
      if (dismissBtn) dismissBtn.addEventListener("click", hideModal);

      welcomeModal.addEventListener("click", (e) => {
        if (e.target === welcomeModal) hideModal();
      });
    }
  }
}

async function loadOpportunities(user) {
  const container = document.getElementById("opportunitiesList");
  if (!container || !supabaseClient) return;

  const { data: opportunities, error: oppsError } = await supabaseClient
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: applications } = await supabaseClient
    .from("applications")
    .select("opportunity_id")
    .eq("user_id", user.id);

  if (oppsError) {
    container.innerHTML = `<p class="message error">Could not load opportunities: ${oppsError.message}</p>`;
    return;
  }

  if (!opportunities || opportunities.length === 0) {
    container.innerHTML = `<p class="loading-text">No active opportunities found. Check back later.</p>`;
    return;
  }

  const appliedIds = new Set((applications || []).map((app) => app.opportunity_id));

  container.innerHTML = opportunities.map((opp) => {
    const hasApplied = appliedIds.has(opp.id);
    return `
      <div class="card" id="card-${opp.id}">
        <div class="card-body">
          <h3>${opp.title}</h3>
          <div class="card-meta">
            <span><strong>${opp.company}</strong></span>
            <span>•</span>
            <span>${opp.location}</span>
            <span>•</span>
            <span>${opp.type}</span>
          </div>
          <p class="card-desc">${opp.description}</p>
        </div>
        <div class="card-action">
          ${
            hasApplied
              ? `<button class="btn btn-applied" disabled>Applied</button>`
              : `<button class="btn btn-primary" onclick="applyOpportunity('${opp.id}')">Apply</button>`
          }
        </div>
      </div>
    `;
  }).join("");
}

// Apply Function
window.applyOpportunity = async function (opportunityId) {
  if (!supabaseClient) return;

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const { error } = await supabaseClient.from("applications").insert([
    {
      opportunity_id: opportunityId,
      user_id: user.id,
      user_email: user.email,
    },
  ]);

  const statusMsg = document.getElementById("statusMessage");

  if (error) {
    if (statusMsg) {
      statusMsg.className = "message error";
      statusMsg.textContent = "Application failed: " + error.message;
      statusMsg.classList.remove("hidden");
    }
    return;
  }

  if (statusMsg) {
    statusMsg.className = "message success";
    statusMsg.textContent = "Application submitted successfully!";
    statusMsg.classList.remove("hidden");
  }

  const cardAction = document.querySelector(`#card-${opportunityId} .card-action`);
  if (cardAction) {
    cardAction.innerHTML = `<button class="btn btn-applied" disabled>Applied</button>`;
  }
};
