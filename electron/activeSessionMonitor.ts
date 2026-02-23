import * as chokidar from "chokidar";
import * as fs from "fs";
import * as path from "path";
import { app } from "electron";

const ACTIVE_SESSION_FILENAME = "active-session";

type SessionChangedFn = (sessionId: string | null) => void;

export function getActiveSessionFilePath(): string {
  return path.join(app.getPath("userData"), ACTIVE_SESSION_FILENAME);
}

function readSessionFile(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8").trim();
    return content || null;
  } catch {
    return null;
  }
}

/**
 * Create a monitor that watches the active-session file for changes.
 * The file contains a plain-text session ID that determines which Claude Code session to voice.
 * When the file is deleted or empty, all sessions are voiced (default behavior).
 */
export function createActiveSessionMonitor(onSessionChanged: SessionChangedFn) {
  const filePath = getActiveSessionFilePath();

  // Read initial value
  const initial = readSessionFile(filePath);
  onSessionChanged(initial);

  // Watch the file for changes
  const watcher = chokidar.watch(filePath, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 25,
    },
  });

  watcher.on("add", () => {
    const sessionId = readSessionFile(filePath);
    console.log(`[ActiveSession] File created, session: ${sessionId ?? "none"}`);
    onSessionChanged(sessionId);
  });

  watcher.on("change", () => {
    const sessionId = readSessionFile(filePath);
    console.log(`[ActiveSession] File changed, session: ${sessionId ?? "none"}`);
    onSessionChanged(sessionId);
  });

  watcher.on("unlink", () => {
    console.log("[ActiveSession] File deleted, reverting to all sessions");
    onSessionChanged(null);
  });

  watcher.on("error", (error: unknown) => {
    console.error("[ActiveSession] Watcher error:", error);
  });

  return {
    close: () => watcher.close(),
  };
}

/**
 * Delete the active-session file to clear the session filter.
 */
export function clearActiveSessionFile(): void {
  try {
    fs.unlinkSync(getActiveSessionFilePath());
    console.log("[ActiveSession] File cleared");
  } catch {
    // File doesn't exist, nothing to do
  }
}
