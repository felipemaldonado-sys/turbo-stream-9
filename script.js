const totalSeconds = 15 * 60;
let remainingSeconds = totalSeconds;

function updateTimer() {
  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  const timer = document.getElementById("timer");
  if (timer) {
    timer.textContent = `Turbo ${minutes}:${seconds}`;
  }

  remainingSeconds -= 1;

  if (remainingSeconds < 0) {
    remainingSeconds = totalSeconds;
  }
}

updateTimer();
setInterval(updateTimer, 1000);

const progressFill = document.getElementById("progressFill");
let progress = 54;
let direction = 1;

setInterval(() => {
  progress += direction * 2;
  if (progress >= 70) direction = -1;
  if (progress <= 52) direction = 1;

  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
}, 500);

const STREAM_1 = "felipe_maldonado2";
const STREAM_2 = "felipe_maldonado123";

let player1;
let player2;

function activateTab(streamKey) {
  const tabs = document.querySelectorAll(".stream-tab");
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.stream === streamKey);
  });

  const playerEl1 = document.getElementById("twitch-player-1");
  const playerEl2 = document.getElementById("twitch-player-2");

  if (streamKey === "stream1") {
    playerEl1.classList.remove("hidden-player");
    playerEl1.classList.add("active-player");
    playerEl2.classList.add("hidden-player");
    playerEl2.classList.remove("active-player");
  } else {
    playerEl2.classList.remove("hidden-player");
    playerEl2.classList.add("active-player");
    playerEl1.classList.add("hidden-player");
    playerEl1.classList.remove("active-player");
  }
}

const twitchScript = document.createElement("script");
twitchScript.src = "https://player.twitch.tv/js/embed/v1.js";

twitchScript.onload = () => {
  player1 = new Twitch.Player("twitch-player-1", {
    width: "100%",
    height: "100%",
    channel: STREAM_1,
    parent: ["comfy-paletas-570a13.netlify.app", "localhost"],
    muted: true,
    autoplay: true
  });

  player2 = new Twitch.Player("twitch-player-2", {
    width: "100%",
    height: "100%",
    channel: STREAM_2,
    parent: ["comfy-paletas-570a13.netlify.app", "localhost"],
    muted: true,
    autoplay: false
  });

  activateTab("stream1");

  const tabs = document.querySelectorAll(".stream-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.stream;
      activateTab(target);
    });
  });
};

document.body.appendChild(twitchScript);