const SUPABASE_URL = "https://ypaogamdapbvuzwphngh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wI8kuJuKQaH2-JO63Og5wA_LjoiHuJ4";

// Avoid name collision with window.supabase from the CDN script
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

  // 1. Auth Guard
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();

  if (sessionError || !session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;
  const userEmail = user.email ? user.email.toLowerCase() : "";

  const userEmailElem = document.getElementById("userEmail");
  if (userEmailElem) {
    userEmailElem.textContent = user.email;
  }

  // 2. Reveal Admin Portal Button if Admin
  const adminPortalLink = document.getElementById("adminPortalLink");
  if (adminPortalLink && ADMIN_EMAILS.includes(userEmail)) {
    adminPortalLink.classList.remove("hidden");
  }

  // 3. Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });
  }

  // 4. Load Opportunities & Existing Applications
  await loadOpportunities(user);
});

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

// Global Apply Function
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
