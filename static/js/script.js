window.addEventListener("DOMContentLoaded", () => {
  const landing         = document.getElementById("landing-container");
  const appContainer    = document.getElementById("app-container");
  const insertBtn       = document.getElementById("insert-coin");
  const devSkipBtn      = document.getElementById("dev-skip-btn");
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
  const downloadBtn     = document.getElementById("download-btn");
  const dropZone        = document.querySelector(".container");

  (() => {
    const canvas = document.getElementById('rain');
    const ctx = canvas.getContext('2d');
    let drops = [];
    const maxDrops = 200;
    const spawnPerFrame = 4;
    const chars = ['0', '1'];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createDrop() {
      const isChar = Math.random() < 0.1;
      return {
        x: Math.floor(Math.random() * canvas.width),
        y: 0,
        size: isChar ? 8 : (Math.random() < 0.85 ? 1 : 2),
        speed: 0.5 + Math.random() * 1.5,
        flickerPhase: Math.random() * 2 * Math.PI,
        char: isChar ? chars[Math.floor(Math.random() * chars.length)] : null
      };
    }

    function drawDrops(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 9px monospace';
      ctx.textBaseline = 'top';

      for (let i = 0; i < spawnPerFrame; i++) {
        if (drops.length < maxDrops) {
          drops.push(createDrop());
        }
      }

      for (const drop of drops) {
        drop.y += drop.speed;
        if (drop.y > canvas.height) {
          drop.y = 0;
          drop.x = Math.floor(Math.random() * canvas.width);
          if (drop.char !== null) {
            drop.char = chars[Math.floor(Math.random() * chars.length)];
          }
        }

        const brightness = 0.7 + 0.3 * Math.sin(time / 500 + drop.flickerPhase);
        ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(2)})`;

        if (drop.char !== null) {
          ctx.fillText(drop.char, drop.x, drop.y);
        } else {
          ctx.fillRect(drop.x, drop.y, drop.size, drop.size);
        }
      }
    }

    window.startRainAnimation = function animate(time = 0) {
      drawDrops(time);
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', () => {
      resize();
      drops = [];
    });

    resize();
  })();

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    folderBtn.style.display = "none";
    uploadBtn.style.display = "inline-block";
  } else {
    uploadBtn.style.display = "none";
    folderBtn.style.display = "inline-block";
  }

  insertBtn.addEventListener("click", () => {
    audioEl.play().catch(() => {});
    const spriteFrame = document.getElementById("sprite-frame");
    if (spriteFrame && spriteFrame.contentWindow) {
      spriteFrame.contentWindow.postMessage({ type: "start-run" }, "*");
    }
  });

  devSkipBtn.addEventListener("click", launchMainApp);

  function launchMainApp() {
    landing.style.display = "none";
    appContainer.style.display = "block";
    adjustContainerHeight();
    title.style.animation = "none";
    void title.offsetWidth;
    title.style.animation = "fadeInOut 2.4s ease-in-out 1s forwards";
  }

  window.addEventListener("message", (event) => {
    if (event.data?.type === "run-complete") {
      launchMainApp();
      const devBtn = document.getElementById("dev-skip-btn");
      if (devBtn) devBtn.style.display = "none";
    }
  });

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
  downloadBtn.style.display = "none";

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
    window.startRainAnimation();
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
      if (typeof cb === "function") cb();
    }
  }

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

    // reset file input value so same file can be selected again
    fileInput.value = '';

    videoOverlay.style.display = "none";
    output.style.visibility = "visible";
    cursor.style.display = "inline-block";
    typedText.textContent = "";
    terminalOutput.textContent = "";
    terminalBlock.style.display = "none";
    downloadBtn.style.display = "none";

    const restartMessage = isMobile
      ? "Please select video source..."
      : "Please select video source or drop file into screen...";

    typeText("Program restarting...", () => {
      setTimeout(() => {
        typeText(restartMessage, () => {
          icons.style.transition = "opacity 0.5s ease-in";
          icons.style.opacity = "1";
          icons.style.pointerEvents = "auto";
          stopSpinner();
          isTyping = false;
        });
      }, 600);
    });
  }

  if (!isMobile && dropZone) {
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleVideoUpload(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    });
  }

  folderBtn.addEventListener("click", () => fileInput.click());
  uploadBtn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) {
      icons.style.opacity = "1";
      return;
    }

    const maxSizeBytes = 100 * 1024 * 1024; // 100 MB

    if (file.size > maxSizeBytes) {
      typeText("File size exceeds 100MB limit...", () => {
        setTimeout(() => {
          typeText(
            isMobile
              ? "Please select video source..."
              : "Please select video source or drop file into screen...",
            () => {
              icons.style.transition = "opacity 0.5s ease-in";
              icons.style.opacity = "1";
              isTyping = false;
            }
          );
        }, 1500);
      });
      return;
    }
    handleVideoUpload(file);
  });

  function handleVideoUpload(file) {
    startSpinner();
    terminalOutput.textContent = "";
    terminalBlock.style.display = "none";

    typeText("Uploading video...", () => {
      icons.style.opacity = "0";
      const formData = new FormData();
      formData.append("video", file);

      const apiUrl = window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "http://hourglass-lite-env.eba-cj44iamr.eu-west-2.elasticbeanstalk.com";

      fetch(`${apiUrl}/upload`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          const sessionId = data.session_id;
          typeText("Script running...", () => {
            logo.classList.add("spin");
            terminalBlock.style.display = "block";
            startPollingLogs(sessionId);
          });
        })
        .catch((err) => {
          console.error("Upload error:", err);
          typeText("Upload failed...");
          stopSpinner();
          icons.style.opacity = "1";
        });
    });
  }

  function startPollingLogs(sessionId) {
    pollingLogs = true;
    displayedLines = [];

    const logsUrlBase = window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:5000"
      : "http://hourglass-lite-env.eba-cj44iamr.eu-west-2.elasticbeanstalk.com";

    pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${logsUrlBase}/logs/${sessionId}`);
        const data = await res.json();

        const lines = data.logs.filter(line => line && !displayedLines.includes(line));
        for (const line of lines) {
          displayedLines.push(line);
          terminalOutput.textContent += line.trim() + "\n";
          terminalOutput.scrollTop = terminalOutput.scrollHeight;

          if (line.toLowerCase().startsWith("actual gif size:")) {
            clearInterval(pollInterval);
            pollingLogs = false;
            logo.classList.remove("spin");
            terminalBlock.style.display = "none";

            typeText("Please click to download your GIF...", () => {
              downloadBtn.style.display = "block";
              downloadBtn.classList.add("fade-in");

              const downloadUrl = `${logsUrlBase}/download/${sessionId}`;
              downloadBtn.onclick = (e) => {
                e.preventDefault();
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = "hourglass.gif";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                setTimeout(() => {
                  fetch(`${logsUrlBase}/cleanup/${sessionId}`, {
                    method: "DELETE"
                  }).catch(console.error);
                  restartProgram();
                }, 1000);
              };
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

  refreshBtn.addEventListener("click", restartProgram);

  volumeBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    audioEl.muted = isMuted;
    volumeOnIcon.style.display = isMuted ? "none" : "inline";
    volumeOffIcon.style.display = isMuted ? "inline" : "none";
  });
});
