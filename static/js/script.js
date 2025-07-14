window.addEventListener("DOMContentLoaded", () => {
  const landing         = document.getElementById("landing-container");
  const appContainer    = document.getElementById("app-container");
  const insertBtn       = document.getElementById("insert-coin");
  const panel           = document.querySelector(".console-panel");
  const output          = document.querySelector(".console-output");
  const title           = document.querySelector(".hero-title");
  const icons           = document.querySelector(".input-icons");
  const folderBtn       = document.querySelector("#folder-btn");
  const fileInput       = document.querySelector("#file-input");
  const uploadBtn       = document.querySelector("#upload-btn");
  const videoOverlay    = document.getElementById("video-overlay");
  const video           = videoOverlay.querySelector("video");
  const typedText       = output.querySelector(".typed-text");
  const cursor          = output.querySelector(".cursor");
  const logo            = document.querySelector(".hourglass-logo");
  const refreshBtn      = document.querySelector("#refresh-btn");
  const volumeBtn       = document.querySelector("#volume-btn");
  const volumeOnIcon    = document.querySelector("#volume-on-icon");
  const volumeOffIcon   = document.querySelector("#volume-off-icon");
  const audioEl         = document.querySelector("#bg-audio");
  const terminalOutput  = document.getElementById("terminal-output");
  const terminalBlock   = document.querySelector(".terminal-console");

  insertBtn.addEventListener("click", () => {
    audioEl.play().catch(() => {});
    landing.style.display = "none";
    appContainer.style.display = "block";

    adjustContainerHeight(); // recalculate height on app start

    title.style.animation = "none";
    void title.offsetWidth;
    title.style.animation = "fadeInOut 2.4s ease-in-out 1s forwards";
  });

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    folderBtn.style.display = "none";
    uploadBtn.style.display = "inline-block";
  } else {
    uploadBtn.style.display = "none";
  }

  let isTyping = false;
  let isMuted = false;
  let mediaStream = null;
  let pollInterval = null;
  let displayedLines = [];
  let pollingLogs = false;

  cursor.style.display = "none";
  videoOverlay.style.display = "none";
  logo.style.display = "none";
  icons.style.opacity = "0";
  refreshBtn.style.opacity = "0";
  volumeBtn.style.opacity = "0";
  terminalBlock.style.display = "none";
  terminalOutput.textContent = "";

  audioEl.volume = 1;
  audioEl.loop = true;
  audioEl.muted = false;

  volumeOnIcon.style.display = "inline";
  volumeOffIcon.style.display = "none";

  function adjustBottomIcons() {
    const inset = window.visualViewport
      ? window.innerHeight - window.visualViewport.height
      : 0;
    const offset = inset > 0 ? inset + 20 : 20;
    refreshBtn.style.bottom = `${offset}px`;
    volumeBtn.style.bottom = `${offset}px`;
  }

  function adjustContainerHeight() {
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.height = `${height}px`;
    document.body.style.height = `${height}px`;
    document.querySelector("#app-container").style.height = `${height}px`;
    document.querySelector(".container").style.height = `${height}px`;
  }

  window.visualViewport?.addEventListener("resize", () => {
    adjustBottomIcons();
    adjustContainerHeight();
  });

  window.addEventListener("load", () => {
    adjustBottomIcons();
    adjustContainerHeight();
  });

  title.addEventListener("animationend", () => {
    panel.style.animation = "dropDown 1.2s ease-out forwards";
    logo.style.display = "block";
    refreshBtn.style.opacity = "1";
    volumeBtn.style.opacity = "1";
    adjustBottomIcons();
  });

  panel.addEventListener("animationend", () => {
    cursor.style.display = "inline-block";
    setTimeout(startTypingSequence, 400);
  });

  function startTypingSequence() {
    if (isTyping) return;
    isTyping = true;
    typeText(getGreeting(), () => {
      setTimeout(() => {
        typeText(
          isMobile
            ? "Please select video source..."
            : "Please select video source or drop file into screen...",
          () => {
            icons.style.transition = "opacity 0.5s ease-in";
            icons.style.opacity = "1";
            stopSpinner();
            isTyping = false;
          }
        );
      }, 600);
    });
  }

  function typeText(text, cb, i = 0) {
    if (i === 0) {
      isTyping = true;
      typedText.textContent = "";
    }
    if (i < text.length) {
      typedText.textContent += text.charAt(i);
      setTimeout(() => typeText(text, cb, i + 1), 60);
    } else {
      isTyping = false;
      cb();
    }
  }

  if ('ontouchstart' in window) {
    document.querySelectorAll('.icon-button').forEach(btn => {
      btn.addEventListener('touchstart', (e) => e.currentTarget.classList.add('pressed'));
      btn.addEventListener('touchend', (e) => e.currentTarget.classList.remove('pressed'));
      btn.addEventListener('touchcancel', (e) => e.currentTarget.classList.remove('pressed'));
    });
  } else {
    document.querySelectorAll('.icon-button').forEach(btn => {
      btn.addEventListener('mousedown', (e) => e.currentTarget.classList.add('pressed'));
      btn.addEventListener('mouseup', (e) => e.currentTarget.classList.remove('pressed'));
      btn.addEventListener('mouseleave', (e) => e.currentTarget.classList.remove('pressed'));
    });
  }

  volumeBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    audioEl.muted = isMuted;
    volumeOnIcon.style.display = isMuted ? "none" : "inline";
    volumeOffIcon.style.display = isMuted ? "inline" : "none";
  });

  refreshBtn.addEventListener("click", () => {
    restartProgram();
  });

  function startSpinner() {
    logo.classList.add("spin");
  }

  function stopSpinner() {
    logo.classList.remove("spin");
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning...";
    if (h < 18) return "Good afternoon...";
    return "Good evening...";
  }

  function restartProgram() {
    if (isTyping) return;
    isTyping = true;
    startSpinner();

    icons.style.transition = "none";
    icons.style.opacity = "0";
    icons.style.pointerEvents = "none";
    displayedLines = [];

    if (pollInterval) clearInterval(pollInterval);
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }

    folderBtn.blur();
    uploadBtn.blur();

    videoOverlay.style.display = "none";
    output.style.visibility = "visible";
    cursor.style.display = "inline-block";
    typedText.textContent = "";
    terminalOutput.textContent = "";
    terminalBlock.style.display = "none";

    typeText("Program restarting...", () => {
      setTimeout(() => {
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

  function hideIphoneIcon() {
    icons.style.opacity = "0";
    icons.style.pointerEvents = "none";
  }

  function showIphoneIcon() {
    icons.style.transition = "opacity 0.5s ease-in";
    icons.style.opacity = "1";
    icons.style.pointerEvents = "auto";
  }

  function handleVideoUpload(file) {
    startSpinner();
    terminalOutput.textContent = "";
    terminalBlock.style.display = "none";

    typeText("Uploading video...", () => {
      hideIphoneIcon();
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
          typeText("Script running...", () => {
            logo.style.display = "block";
            logo.classList.add("spin");
            terminalBlock.style.display = "block";
            startPollingLogs();
          });
        })
        .catch((err) => {
          console.error("Upload error:", err);
          typeText("Upload failed...");
          stopSpinner();
          showIphoneIcon();
        });
    });
  }

  folderBtn.addEventListener("click", () => fileInput.click());
  uploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      showIphoneIcon();
      return;
    }
    handleVideoUpload(file);
  });

  fileInput.addEventListener("blur", () => {
    if (!fileInput.files.length) showIphoneIcon();
  });

  const isDesktop = !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isDesktop) {
    const dropZone = document.querySelector(".container");

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      icons.style.transition = "none";
      icons.style.opacity = "0";
      icons.style.pointerEvents = "none";
      handleVideoUpload(file);
    });
  }

  function startPollingLogs() {
    pollingLogs = true;
    displayedLines = [];

    pollInterval = setInterval(async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/logs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const lines = data.logs.filter(line => line && !displayedLines.includes(line));

        for (const line of lines) {
          displayedLines.push(line);
          terminalOutput.textContent += line + "\n";
          terminalOutput.scrollTop = terminalOutput.scrollHeight;

          if (line.toLowerCase().startsWith("actual gif size:")) {
            clearInterval(pollInterval);
            pollingLogs = false;
            logo.classList.remove("spin");

            typeText("GIF creation complete...", () => {
              setTimeout(() => restartProgram(), 1500);
            });
            break;
          }
        }
      } catch (err) {
        console.error("Log polling error:", err);
        clearInterval(pollInterval);
        pollingLogs = false;
        typeText("Error reading logs.");
      }
    }, 1000);
  }
});
