document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("popup");
  const audio = document.getElementById("background-audio");
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  async function openFullscreen(elem) {
    try {
      if (!isIOS) {  // For non-iOS devices
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
      } else {
        // For iOS, apply full-screen styles
        elem.classList.add("ios-fullscreen");
      }
    } catch (error) {
      console.error("Failed to enter fullscreen mode:", error);
    }
  }

  function tryPlayAudio() {
    if (audio) {
      audio.play().catch((error) => {
        console.log("Autoplay was prevented:", error);
      });
    }
  }

  document.body.addEventListener("click", async () => {
    await openFullscreen(popup);
    tryPlayAudio();
  });

  document.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      await openFullscreen(document.documentElement);
    }
    if (e.key === "F11") {
      e.preventDefault();
      console.log("F11 key press detected and prevented.");
    }
    tryPlayAudio();
  });
});
