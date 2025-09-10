import { storage, db } from "../firebase.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 🎤 Start recording
startBtn.addEventListener("click", async () => {
  if (!usernameInput.value.trim()) {
    alert("Please enter your Twitter handle before recording.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
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
    alert("Microphone access denied!");
    console.error(err);
  }
});

// ⏹ Stop recording
stopBtn.addEventListener("click", () => {
  mediaRecorder.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
});

// 💾 Save recording to Firebase
// 💾 Save recording to Firebase
function showModal(message = "✅ Performance saved to the gallery!") {
  const modal = document.getElementById("customModal");
  const modalText = modal.querySelector("p");
  modalText.textContent = message;

  modal.style.display = "flex";

  // Auto close after 2 seconds
  setTimeout(() => {
    modal.style.display = "none";
  }, 2000);

  document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
  };
}

saveBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const title = titleInput.value.trim() || "Untitled Performance";

  if (!audioBlob) {
    alert("Please record something first!");
    return;
  }

  const fileName = `${username || "user"}_${Date.now()}.webm`; // use webm for MediaRecorder
  const storageRef = ref(storage, `performances/${fileName}`);

  try {
    // Upload with correct MIME type
    await uploadBytes(storageRef, audioBlob, {
      contentType: "audio/webm"
    });

    const downloadURL = await getDownloadURL(storageRef);

    // Save metadata in Firestore
    await addDoc(collection(db, "performances"), {
      username: username || "Anonymous",
      title,
      audioUrl: downloadURL,
      timestamp: serverTimestamp(),
      reactions: { laugh: 0, love: 0, kiss: 0 }
    });

    // Reset
    usernameInput.value = "";
    titleInput.value = "";
    saveBtn.disabled = true;
    stoppedIndicator.style.display = "none";
    audioBlob = null;

    showModal();
  } catch (err) {
    console.error("Upload failed:", err);
    alert("Error uploading audio. Try again.");
  }
});

// 🔄 Load all performances

// 🔄 Load all performances
const performancesQuery = query(collection(db, "performances"), orderBy("timestamp", "desc"));

onSnapshot(performancesQuery, snapshot => {
  gallery.innerHTML = ""; // clear before reload
  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    const clipDiv = document.createElement("div");
    clipDiv.classList.add("clip");

    // Header
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

    // Title
    const titleLabel = document.createElement("p");
    titleLabel.classList.add("title-label");
    titleLabel.textContent = data.title;
    clipDiv.appendChild(titleLabel);

    // 🎵 Audio Player (clean)
    const audioElement = document.createElement("audio");
    audioElement.src = data.audioUrl;
    audioElement.controls = true;
    audioElement.preload = "auto";   // ✅ load faster
    audioElement.crossOrigin = "anonymous"; // ✅ prevent blocking
    clipDiv.appendChild(audioElement);

    gallery.appendChild(clipDiv);
  });
});

// Ensure only one audio plays at a time
document.addEventListener("play", function(e){
  if (e.target.tagName === "AUDIO") {
    const audios = document.querySelectorAll("audio");
    audios.forEach(audio => {
      if (audio !== e.target) {
        audio.pause();
      }
    });
  }
}, true);
