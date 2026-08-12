const { app, BrowserWindow, globalShortcut, dialog } = require("electron");
const path = require("path");

// Disable hardware acceleration for better compatibility
// app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    // Start in kiosk mode - instant fullscreen, no title bar, no escape
    kiosk: true,
    fullscreen: true,
    alwaysOnTop: true,

    // Remove window decorations (title bar, close/minimize/maximize buttons)
    frame: false,
    titleBarStyle: "hidden",

    // Prevent closing and resizing
    closable: false,
    minimizable: false,
    maximizable: false,
    resizable: false,

    // Don't show until ready (prevents flash)
    show: false,

    // Window size fallback (in case kiosk doesn't work)
    width: 1920,
    height: 1080,

    // Background color while loading
    backgroundColor: "#000000",

    webPreferences: {
      // Security settings
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,

      // Enable audio autoplay without user gesture
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  // Load the app HTML
  mainWindow.loadFile(path.join(__dirname, "src", "index.html"));

  // Show window when ready - ensures instant fullscreen appearance
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();

    // Force kiosk mode again after showing (safety measure)
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true, "screen-saver");
    mainWindow.setFullScreen(true);
  });

  // Prevent the window from being closed via OS shortcuts (Cmd+W, Alt+F4, etc.)
  mainWindow.on("close", (event) => {
    event.preventDefault();
  });

  // If window loses focus, re-focus it
  mainWindow.on("blur", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
          mainWindow.setAlwaysOnTop(true, "screen-saver");
        }
      }, 100);
    }
  });

  // Prevent minimize
  mainWindow.on("minimize", (event) => {
    event.preventDefault();
    mainWindow.restore();
  });

  // If somehow fullscreen exits, re-enter it
  mainWindow.on("leave-full-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setFullScreen(true);
      mainWindow.setKiosk(true);
    }
  });

  // Hide menu bar completely
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  // ==========================================
  // BLOCK ALL DANGEROUS KEYBOARD SHORTCUTS
  // ==========================================

  // Block common escape shortcuts
  const blockedShortcuts = [
    "Escape",
    "CommandOrControl+Q",     // Quit
    "CommandOrControl+W",     // Close window
    "CommandOrControl+M",     // Minimize
    "CommandOrControl+H",     // Hide
    "Alt+F4",                 // Windows close
    "Alt+Tab",                // Window switcher
    "CommandOrControl+Tab",   // Tab switching
    "Super+D",                // Show desktop (Windows)
    "Super+M",                // Minimize all (Windows)
    "CommandOrControl+Shift+Q", // Log out (Mac)
    "F11",                    // Toggle fullscreen
    "CommandOrControl+F",     // Find
  ];

  blockedShortcuts.forEach((shortcut) => {
    try {
      globalShortcut.register(shortcut, () => {
        // Do nothing - just block the shortcut
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
          mainWindow.setAlwaysOnTop(true, "screen-saver");
        }
      });
    } catch (e) {
      // Some shortcuts might fail on certain OS - ignore silently
      console.log(`Could not register shortcut: ${shortcut}`);
    }
  });

  // ==========================================
  // EMERGENCY EXIT: Ctrl+Alt+Shift+Q
  // ==========================================
  try {
    globalShortcut.register("CommandOrControl+Alt+Shift+Q", () => {
      // Remove close prevention before quitting
      if (mainWindow) {
        mainWindow.removeAllListeners("close");
        mainWindow.destroy();
      }
      globalShortcut.unregisterAll();
      app.exit(0);
    });
  } catch (e) {
    console.error("Could not register emergency exit shortcut:", e);
  }

  // Handle macOS activate (clicking dock icon)
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Prevent app from quitting when all windows are closed (macOS behavior)
app.on("window-all-closed", () => {
  // Don't quit - this prevents Cmd+Q from working
});

// Prevent second instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(true, "screen-saver");
    }
  });
}

// Clean up on actual exit
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
