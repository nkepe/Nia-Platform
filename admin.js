const SUPABASE_URL = "https://ypaogamdapbvuzwphngh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_wI8kuJuKQaH2-JO63Og5wA_LjoiHuJ4";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ADMIN_EMAIL = "davidkasimilu71@gmail.com";

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Check Auth & Admin Authorization
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "index.html";
    return;
  }

  if (session.user.email !== ADMIN_EMAIL) {
    alert("Unauthorized: Admin credentials required.");
    window.location.href = "dashboard.html";
    return;
  }

  document.getElementById("userEmail").textContent = session.user.email;

  // 2. Sign Out
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html";
  });

  // 3. Post Job Form Handler
  const postJobForm = document.getElementById("postJobForm");
  const adminMessage = document.getElementById("adminMessage");

  postJobForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("jobTitle").value.trim();
    const company = document.getElementById("companyName").value.trim();
    const location = document.getElementById("jobLocation").value.trim();
    const type = document.getElementById("jobType").value;
    const description = document.getElementById("jobDesc").value.trim();

    const { error } = await supabase.from("opportunities").insert([
      { title, company, location, type, description }
    ]);

    if (error) {
      adminMessage.className = "message error";
      adminMessage.textContent = "Failed to post job: " + error.message;
      adminMessage.classList.remove("hidden");
      return;
    }

    adminMessage.className = "message success";
    adminMessage.textContent = "Opportunity posted successfully!";
    adminMessage.classList.remove("hidden");

    postJobForm.reset();
  });
});
