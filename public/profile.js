document.addEventListener("DOMContentLoaded", async function () {
  await loadProfileData();

  document
    .getElementById("photo-upload")
    .addEventListener("change", handlePhotoUpload);
  document
    .getElementById("nameInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") saveName();
    });
  document
    .getElementById("profile-form")
    .addEventListener("submit", saveProfileChanges);
  document
    .getElementById("change-password-form")
    .addEventListener("submit", changePassword);
});

async function loadProfileData() {
  const res = await fetch("/profile-data");
  const data = await res.json();

  document.getElementById("user-name-display").innerText =
    data.username || "User";
  document.getElementById("email").value = data.email || "";
  document.getElementById("dob").value = data.dob || "";
  document.getElementById("bio").value = data.bio || "";

  if (data.profilePhoto) {
    const avatar = document.getElementById("avatar-container");
    avatar.classList.add("has-image");
    document.getElementById("profile-photo").src = data.profilePhoto;
  }
}

async function saveProfileChanges(event) {
  event.preventDefault();

  const username = document.getElementById("user-name-display").innerText;
  const email = document.getElementById("email").value;
  const dob = document.getElementById("dob").value;
  const bio = document.getElementById("bio").value;
  const profilePhoto = document.getElementById("profile-photo").src;

  await fetch("/update-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, dob, bio, profilePhoto }),
  });

  alert("Profile updated successfully!");
}

async function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (file && file.size <= 2 * 1024 * 1024) {
    // 2MB limit
    const reader = new FileReader();
    reader.onload = function (e) {
      const photoSrc = e.target.result;
      document.getElementById("profile-photo").src = photoSrc;
    };
    reader.readAsDataURL(file);
  } else {
    alert("File size should be less than 2MB.");
  }
}

function openNameModal() {
  const currentName = document.getElementById("user-name-display").innerText;
  document.getElementById("nameInput").value = currentName;
  document.getElementById("nameEditModal").style.display = "flex";
  document.getElementById("nameInput").focus();
}

function closeNameModal() {
  document.getElementById("nameEditModal").style.display = "none";
}

function saveName() {
  const newName = document.getElementById("nameInput").value.trim();
  if (newName) {
    document.getElementById("user-name-display").innerText = newName;
  }
  closeNameModal();
}

async function changePassword(event) {
  event.preventDefault();

  const oldPassword = document.getElementById("old-password").value;
  const newPassword = document.getElementById("new-password").value;

  if (!oldPassword || !newPassword) {
    alert("Please fill out both password fields.");
    return;
  }

  if (newPassword.length < 6) {
    alert("New password must be at least 6 characters long.");
    return;
  }

  const res = await fetch("/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  const result = await res.json();
  if (result.error) {
    alert(result.error);
  } else {
    alert("Password changed successfully!");
    document.getElementById("old-password").value = "";
    document.getElementById("new-password").value = "";
  }
}

function openResetModal() {
  document.getElementById("resetModal").style.display = "flex";
}

function closeResetModal() {
  document.getElementById("resetModal").style.display = "none";
}
