window.addEventListener("DOMContentLoaded", () => {
  // ——— DOM elements ———
  const panel          = document.querySelector(".console-panel");
  const output         = document.querySelector(".console-output");
  const title          = document.querySelector(".hero-title");
  const icons          = document.querySelector(".input-icons");
  const folderBtn      = document.querySelector("#folder-btn");
  const fileInput      = document.querySelector("#file-input");
  const cameraBtn      = document.querySelector("#camera-btn");
  const videoOverlay   = document.getElementById("video-overlay");
  const video          = videoOverlay.querySelector("video");
  const typedText      = output.querySelector(".typed-text");
  const cursor         = output.querySelector(".cursor");
  const logo           = document.querySelector(".hourglass-logo");
  const refreshBtn     = document.querySelector("#refresh-btn");
  const volumeBtn      = document.querySelector("#volume-btn");
  const volumeOnIcon   = document.querySelector("#volume-on-icon");
  const volumeOffIcon  = document.querySelector("#volume-off-icon");
  const audioEl        = document.querySelector("#bg-audio");
  const terminalOutput = document.getElementById("terminal-output");
  const terminalBlock  = document.querySelector(".terminal-console");

  // ——— State variables ———
  let isTyping       = false;
  let isMuted        = false;
  let mediaStream    = null;
  let pollInterval   = null;
  let logComplete    = false;
  let displayedLines = [];
  let pollingLogs    = false;

  // ——— Initial UI states ———
  cursor.style.display       = "none";
  videoOverlay.style.display = "none";
  logo.style.display         = "none";
  icons.style.opacity        = "0";
  refreshBtn.style.opacity   = "0";
  volumeBtn.style.opacity    = "0";
  terminalBlock.style.display = "none";
  terminalOutput.textContent = "";

  // ——— Audio setup ———
  audioEl.volume = 1;
  audioEl.loop   = true;
  audioEl.muted  = true;

  audioEl.play().catch(() => {
    const resume = () => {
      audioEl.play().then(() => {
        if (firstClickOn === "volume") toggleVolume();
      });
      document.removeEventListener("click", resume);
    };
    document.addEventListener("click", resume, { once: true });
  });

  volumeOnIcon.style.display  = "none";
  volumeOffIcon.style.display = "inline";

  // ——— Animations ———
  title.addEventListener("animationend", () => {
    panel.style.animation = "dropDown 1.2s ease-out forwards";
    logo.style.display = "block";
    refreshBtn.style.opacity = "1";
    volumeBtn.style.opacity = "1";
  });

  panel.addEventListener("animationend", () => {
    cursor.style.display = "inline-block";
    setTimeout(startTypingSequence, 400);
  });

  // ——— Typing welcome messages ———
  function startTypingSequence() {
    if (isTyping) return;
    isTyping = true;

    typeText(getGreeting(), () => {
      setTimeout(() => {
        typedText.textContent = "";
        cursor.style.display = "inline-block";
        typeText("Please select video source...", () => {
          icons.style.transition = "opacity 0.5s ease-in";
          icons.style.opacity = "1";
          stopSpinner();
          isTyping = false;
        });
      }, 600);
    });
  }

  function typeText(text, cb, i = 0) {
    if (i < text.length) {
      typedText.textContent += text.charAt(i);
      setTimeout(() => typeText(text, cb, i + 1), 60);
    } else {
      cb();
    }
  }

  // ——— Restart program sequence ———
  function restartProgram() {
    if (isTyping) return;
    isTyping = true;
    startSpinner();

    icons.style.transition = "none";
    icons.style.opacity = "0";
    icons.style.pointerEvents = "none";
    logComplete = false;
    pollingLogs = false;
    displayedLines = [];

    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    folderBtn.blur();
    cameraBtn.blur();

    videoOverlay.style.display = "none";
    output.style.visibility = "visible";
    cursor.style.display = "inline-block";
    typedText.textContent = "";
    terminalOutput.textContent = "";
    terminalBlock.style.display = "none";

    typeText("Program restarting...", () => {
      setTimeout(() => {
        typedText.textContent = "";
        typeText("Please select video source...", () => {
          icons.style.transition = "opacity 0.5s ease-in";
          icons.style.opacity = "1";
          icons.style.pointerEvents = "auto";
          stopSpinner();
          isTyping = false;
        });
      }, 600);
    });
  }

  // ——— Folder button file select ———
  folderBtn.addEventListener("click", () => {
    icons.style.transition = "none";
    icons.style.opacity = "0";
    icons.style.pointerEvents = "none";

    fileInput.value = "";
    fileInput.click();

    const onFocus = () => {
      setTimeout(() => {
        if (!fileInput.files.length) {
          icons.style.transition = "opacity 0.2s ease-in";
          icons.style.opacity = "1";
          icons.style.pointerEvents = "auto";
        }
      }, 100);
      window.removeEventListener("focus", onFocus);
    };

    window.addEventListener("focus", onFocus);
  });

  // ——— File input change (upload) ———
  fileInput.addEventListener("change", async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;

    startSpinner();
    logComplete = false;
    pollingLogs = false;
    displayedLines = [];
    terminalOutput.textContent = "";
    terminalBlock.style.display = "none";

    typedText.textContent = "";
    cursor.style.display = "inline-block";
    typeText("Uploading video...", () => {
      const formData = new FormData();
      formData.append("video", file);

      fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: formData,
      })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        typedText.textContent = "";
        typeText("Script running...", () => {
          logo.style.display = "block";
          logo.classList.add("spin");
          terminalBlock.style.display = "block";
          startPollingLogs();
        });
      })
      .catch((err) => {
        console.error("❌ Upload error:", err);
        typedText.textContent = "";
        typeText("Upload failed...");
        stopSpinner();

        icons.style.transition = "opacity 0.5s ease-in";
        icons.style.opacity = "1";
        icons.style.pointerEvents = "auto";
      });
    });
  });

  // ——— Start polling logs ———
  function startPollingLogs() {
    if (pollingLogs) return;
    pollingLogs = true;

    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/logs");
        const data = await res.json();
        if (!Array.isArray(data.logs)) return;

        const unseen = data.logs.slice(displayedLines.length);
        let i = 0;
        const revealNext = () => {
          if (i < unseen.length) {
            terminalOutput.textContent += unseen[i];
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
            displayedLines.push(unseen[i]);
            i++;
            setTimeout(revealNext, 120);
          }
        };
        if (unseen.length > 0) revealNext();

        const lowerLines = data.logs.map(line => line.toLowerCase());
        const foundSuccess = lowerLines.some(line => line.includes("actual gif size:"));

        if (foundSuccess && !logComplete) {
          logComplete = true;
          clearInterval(pollInterval);
          pollInterval = null;
          pollingLogs = false;

          typedText.textContent = "";
          typeText("GIF successfully created...", () => {
            stopSpinner();
            setTimeout(() => {
              restartProgram();
            }, 3000);
          });
        }
      } catch (e) {
        console.error("Log polling failed", e);
      }
    }, 2000);
  }

  // ——— Camera button ———
  cameraBtn.addEventListener("click", async () => {
    try {
      startSpinner();
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const [track] = mediaStream.getVideoTracks();
      const settings = track.getSettings();

      video.srcObject = mediaStream;
      if (settings.facingMode !== "environment") {
        video.classList.add("mirrored");
      } else {
        video.classList.remove("mirrored");
      }

      await video.play();
      output.style.visibility = "hidden";
      cursor.style.display = "none";
      videoOverlay.style.display = "block";
      stopSpinner();
    } catch (err) {
      typedText.textContent = "";
      cursor.style.display = "inline-block";
      typeText("Please allow permission...", () => {
        stopSpinner();
        isTyping = false;
      });
      console.error(err);
    }
  });

  // ——— Refresh button ———
  refreshBtn.addEventListener("click", () => {
    restartProgram();
  });

  // ——— Volume toggle ———
  volumeBtn.addEventListener("click", () => {
    firstClickOn = "volume";
    if (audioEl.paused) audioEl.play().catch(err => console.error("Play failed:", err));
    toggleVolume();
  });

  function toggleVolume() {
    isMuted = !isMuted;
    audioEl.muted = isMuted;
    volumeOnIcon.style.display = isMuted ? "none" : "inline";
    volumeOffIcon.style.display = isMuted ? "inline" : "none";
  }

  // ——— Spinner control ———
  function startSpinner() {
    logo.classList.add("spin");
  }
  function stopSpinner() {
    logo.classList.remove("spin");
  }

  // ——— Greeting based on time ———
  function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning..."
         : h < 18 ? "Good afternoon..."
         : "Good evening...";
  }
});
