import { storage, db } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let mediaRecorder;
let audioChunks = [];
let audioBlob;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const saveBtn = document.getElementById("saveBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const themeToggle = document.getElementById("themeToggle");
const gallery = document.getElementById("gallery");
const usernameInput = document.getElementById("username");
const titleInput = document.getElementById("titleInput");
const recordingIndicator = document.getElementById("recordingIndicator");
const stoppedIndicator = document.getElementById("stoppedIndicator");

/* ------------------ NOTIFICATION BANNER ------------------ */
function showNotification(message, type = "success") {
  let banner = document.getElementById("notification");

  if (!banner) {
    banner = document.createElement("div");
    banner.id = "notification";
    document.body.appendChild(banner);
  }

  banner.textContent = message;
  banner.className = `notification ${type} show`;

  // Auto hide after 2.5s
  setTimeout(() => {
    banner.classList.remove("show");
  }, 2500);
}

/* ------------------ RECORDING ------------------ */
startBtn.addEventListener("click", async () => {
  if (!usernameInput.value.trim()) {
    showNotification("⚠️ Please enter your Twitter handle before recording.", "error");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      saveBtn.disabled = false;
      audioChunks = [];
      recordingIndicator.style.display = "none";
      stoppedIndicator.style.display = "block";
    };

    mediaRecorder.start();
    startBtn.disabled = true;
    stopBtn.disabled = false;
    recordingIndicator.style.display = "block";
    stoppedIndicator.style.display = "none";
  } catch (err) {
    showNotification("🎤 Microphone access denied!", "error");
    console.error(err);
  }
});

/* ------------------ STOP RECORDING ------------------ */
stopBtn.addEventListener("click", () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

/* ------------------ SAVE TO FIREBASE ------------------ */
saveBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const title = titleInput.value.trim() || "Untitled Performance";

  if (!audioBlob) {
    showNotification("⚠️ Please record something first!", "error");
    return;
  }

  const fileName = `${username || "user"}_${Date.now()}.webm`;
  const storageRef = ref(storage, `performances/${fileName}`);

  try {
    await uploadBytes(storageRef, audioBlob, { contentType: "audio/webm" });
    const downloadURL = await getDownloadURL(storageRef);

    await addDoc(collection(db, "performances"), {
      username: username || "Anonymous",
      title,
      audioUrl: downloadURL,
      timestamp: serverTimestamp(),
      reactions: { laugh: 0, love: 0, kiss: 0 }
    });

    usernameInput.value = "";
    titleInput.value = "";
    saveBtn.disabled = true;
    stoppedIndicator.style.display = "none";
    audioBlob = null;

    showNotification("✅ Performance saved!");
  } catch (err) {
    console.error("Upload failed:", err);
    showNotification("❌ Error uploading audio. Try again.", "error");
  }
});

/* ------------------ LOAD PERFORMANCES ------------------ */
const performancesQuery = query(collection(db, "performances"), orderBy("timestamp", "desc"));

const colors = [
  "linear-gradient(135deg, #2a003f, #120022)",
  "linear-gradient(135deg, #003f2a, #001a12)",
  "linear-gradient(135deg, #3f002a, #1a0012)",
  "linear-gradient(135deg, #1e0033, #120022)",
  "linear-gradient(135deg, #001f3f, #000814)"
];

onSnapshot(performancesQuery, snapshot => {
  gallery.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const clipDiv = document.createElement("div");
    clipDiv.classList.add("clip");
    clipDiv.style.background = colors[Math.floor(Math.random() * colors.length)];

    const headerDiv = document.createElement("div");
    headerDiv.classList.add("clip-header");

    const recordedLabel = document.createElement("span");
    recordedLabel.classList.add("label-recorded");
    recordedLabel.textContent = "RECORDED BY";

    const userLabel = document.createElement("a");
    userLabel.classList.add("label-username");
    userLabel.textContent = data.username;
    userLabel.href = "https://twitter.com/" + data.username.replace("@", "");
    userLabel.target = "_blank";

    headerDiv.appendChild(recordedLabel);
    headerDiv.appendChild(userLabel);
    clipDiv.appendChild(headerDiv);

    const titleLabel = document.createElement("p");
    titleLabel.classList.add("title-label");
    titleLabel.textContent = data.title;
    clipDiv.appendChild(titleLabel);

    const audioElement = document.createElement("audio");
    audioElement.src = data.audioUrl;
    audioElement.controls = true;
    audioElement.preload = "auto";
    audioElement.crossOrigin = "anonymous";
    clipDiv.appendChild(audioElement);

    gallery.appendChild(clipDiv);
  });
});

/* ------------------ ONLY ONE AUDIO AT A TIME ------------------ */
document.addEventListener("play", function (e) {
  if (e.target.tagName === "AUDIO") {
    const audios = document.querySelectorAll("audio");
    audios.forEach(audio => {
      if (audio !== e.target) {
        audio.pause();
      }
    });
  }
}, true);