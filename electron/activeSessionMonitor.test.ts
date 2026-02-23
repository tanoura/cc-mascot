/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fsMod from "fs";
import * as chokidarMod from "chokidar";

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

vi.mock("chokidar", () => ({
  watch: vi.fn(),
}));

vi.mock("electron", () => ({
  app: {
    getPath: vi.fn(() => "/mock/userData"),
  },
}));

import { createActiveSessionMonitor, clearActiveSessionFile, getActiveSessionFilePath } from "./activeSessionMonitor";

describe("activeSessionMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getActiveSessionFilePath", () => {
    it("userDataディレクトリ配下のactive-sessionパスを返す", () => {
      const filePath = getActiveSessionFilePath();
      expect(filePath).toBe("/mock/userData/active-session");
    });
  });

  describe("createActiveSessionMonitor", () => {
    it("起動時にファイルが存在すればセッションIDをコールバックに渡す", () => {
      const mockCallback = vi.fn();
      const mockWatcher = { on: vi.fn(), close: vi.fn() };

      (fsMod.readFileSync as any).mockReturnValue("session-abc-123");
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      createActiveSessionMonitor(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith("session-abc-123");
    });

    it("起動時にファイルが存在しなければnullをコールバックに渡す", () => {
      const mockCallback = vi.fn();
      const mockWatcher = { on: vi.fn(), close: vi.fn() };

      (fsMod.readFileSync as any).mockImplementation(() => {
        throw new Error("ENOENT");
      });
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      createActiveSessionMonitor(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it("起動時にファイルが空ならnullをコールバックに渡す", () => {
      const mockCallback = vi.fn();
      const mockWatcher = { on: vi.fn(), close: vi.fn() };

      (fsMod.readFileSync as any).mockReturnValue("  ");
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      createActiveSessionMonitor(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it("ファイルの前後の空白をtrimしてセッションIDを返す", () => {
      const mockCallback = vi.fn();
      const mockWatcher = { on: vi.fn(), close: vi.fn() };

      (fsMod.readFileSync as any).mockReturnValue("  session-with-spaces  \n");
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      createActiveSessionMonitor(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith("session-with-spaces");
    });

    it("ファイル作成時（add）にセッションIDを通知する", () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const mockCallback = vi.fn();
      const handlers: Record<string, (...args: any[]) => void> = {};
      const mockWatcher = {
        on: vi.fn((event: string, handler: (...args: any[]) => void) => {
          handlers[event] = handler;
        }),
        close: vi.fn(),
      };

      (fsMod.readFileSync as any).mockImplementation(() => {
        throw new Error("ENOENT");
      });
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      createActiveSessionMonitor(mockCallback);
      mockCallback.mockClear();

      // ファイルが作成される
      (fsMod.readFileSync as any).mockReturnValue("new-session-id");
      handlers["add"]();

      expect(mockCallback).toHaveBeenCalledWith("new-session-id");
    });

    it("ファイル変更時（change）にセッションIDを通知する", () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const mockCallback = vi.fn();
      const handlers: Record<string, (...args: any[]) => void> = {};
      const mockWatcher = {
        on: vi.fn((event: string, handler: (...args: any[]) => void) => {
          handlers[event] = handler;
        }),
        close: vi.fn(),
      };

      (fsMod.readFileSync as any).mockReturnValue("old-session");
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      createActiveSessionMonitor(mockCallback);
      mockCallback.mockClear();

      // ファイルが変更される
      (fsMod.readFileSync as any).mockReturnValue("updated-session");
      handlers["change"]();

      expect(mockCallback).toHaveBeenCalledWith("updated-session");
    });

    it("ファイル削除時（unlink）にnullを通知する", () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      const mockCallback = vi.fn();
      const handlers: Record<string, (...args: any[]) => void> = {};
      const mockWatcher = {
        on: vi.fn((event: string, handler: (...args: any[]) => void) => {
          handlers[event] = handler;
        }),
        close: vi.fn(),
      };

      (fsMod.readFileSync as any).mockReturnValue("some-session");
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      createActiveSessionMonitor(mockCallback);
      mockCallback.mockClear();

      handlers["unlink"]();

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it("closeでwatcherを停止する", async () => {
      const mockCallback = vi.fn();
      const mockWatcher = { on: vi.fn(), close: vi.fn().mockResolvedValue(undefined) };

      (fsMod.readFileSync as any).mockImplementation(() => {
        throw new Error("ENOENT");
      });
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      const monitor = createActiveSessionMonitor(mockCallback);
      monitor.close();

      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it("chokidar.watchに正しいオプションを渡す", () => {
      const mockCallback = vi.fn();
      const mockWatcher = { on: vi.fn(), close: vi.fn() };

      (fsMod.readFileSync as any).mockImplementation(() => {
        throw new Error("ENOENT");
      });
      (chokidarMod.watch as any).mockReturnValue(mockWatcher);

      createActiveSessionMonitor(mockCallback);

      expect(chokidarMod.watch).toHaveBeenCalledWith(
        "/mock/userData/active-session",
        expect.objectContaining({
          ignoreInitial: true,
          awaitWriteFinish: {
            stabilityThreshold: 50,
            pollInterval: 25,
          },
        }),
      );
    });
  });

  describe("clearActiveSessionFile", () => {
    it("active-sessionファイルを削除する", () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      clearActiveSessionFile();

      expect(fsMod.unlinkSync).toHaveBeenCalledWith("/mock/userData/active-session");
    });

    it("ファイルが存在しなくてもエラーにならない", () => {
      (fsMod.unlinkSync as any).mockImplementation(() => {
        throw new Error("ENOENT");
      });

      expect(() => clearActiveSessionFile()).not.toThrow();
    });
  });
});
