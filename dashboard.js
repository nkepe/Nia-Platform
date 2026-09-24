const SUPABASE_URL = "https://ypaogamdapbvuzwphngh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wI8kuJuKQaH2-JO63Og5wA_LjoiHuJ4";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = "davidkasimilu71@gmail.com";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Auth Guard: Ensure session exists
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "index.html";
    return;
  }

  const user = session.user;
  document.getElementById("userEmail").textContent = user.email;

  // Reveal admin button if user is the admin
  if (user.email === ADMIN_EMAIL) {
    document.getElementById("adminPortalLink").classList.remove("hidden");
  }

  // 2. Logout listener
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });

  // 3. Load opportunities & existing applications
  await loadOpportunities(user);
});

async function loadOpportunities(user) {
  const container = document.getElementById("opportunitiesList");
  
  // Fetch opportunities
  const { data: opportunities, error: oppsError } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch student's existing applications
  const { data: applications, error: appsError } = await supabase
    .from("applications")
    .select("opportunity_id")
    .eq("user_id", user.id);

  if (oppsError) {
    container.innerHTML = `<p class="message error">Could not load opportunities.</p>`;
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
              : `<button class="btn btn-primary" onclick="applyOpportunity('${opp.id}')">Apply Now</button>`
          }
        </div>
      </div>
    `;
  }).join("");
}

// Global apply action
window.applyOpportunity = async function (opportunityId) {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from("applications").insert([
    {
      opportunity_id: opportunityId,
      user_id: user.id,
      user_email: user.email,
    },
  ]);

  const statusMsg = document.getElementById("statusMessage");

  if (error) {
    statusMsg.className = "message error";
    statusMsg.textContent = "Application failed: " + error.message;
    statusMsg.classList.remove("hidden");
    return;
  }

  statusMsg.className = "message success";
  statusMsg.textContent = "Application submitted successfully!";
  statusMsg.classList.remove("hidden");

  // Update card button state dynamically
  const cardAction = document.querySelector(`#card-${opportunityId} .card-action`);
  if (cardAction) {
    cardAction.innerHTML = `<button class="btn btn-applied" disabled>Applied</button>`;
  }
};
