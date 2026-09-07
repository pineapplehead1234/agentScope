import { mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createFilePreviewService } from "../file-preview-service";

describe("FilePreviewService", () => {
  it("reads markdown files inside the workspace", async () => {
    const root = join(process.cwd(), "tmp-preview-test");
    const filePath = join(root, "note.md");
    await mkdir(root, { recursive: true });
    await writeFile(filePath, "# Preview", "utf8");

    const service = createFilePreviewService({ workspaceRoot: root });

    await expect(service.readMarkdownPreview(filePath)).resolves.toEqual({
      path: filePath,
      content: "# Preview",
    });
  });

  it("rejects non-markdown files", async () => {
    const service = createFilePreviewService({ workspaceRoot: process.cwd() });

    await expect(service.readMarkdownPreview(join(process.cwd(), "package.json"))).rejects.toThrow(
      "Only markdown files can be previewed",
    );
  });

  it("rejects sibling directory escapes that share a path prefix", async () => {
    const service = createFilePreviewService({
      workspaceRoot: join(process.cwd(), "agentScope"),
    });

    await expect(service.readMarkdownPreview("../agentScope-other/secret.md")).rejects.toThrow(
      "Preview path must stay inside the workspace",
    );
  });

  it("rejects symlinks that resolve outside the workspace", async () => {
    const workspaceRoot = join(process.cwd(), "tmp-preview-test", "workspace");
    const outsideRoot = join(process.cwd(), "tmp-preview-test", "outside");
    const outsideFile = join(outsideRoot, "secret.md");
    const linkPath = join(workspaceRoot, "linked.md");

    await mkdir(workspaceRoot, { recursive: true });
    await mkdir(outsideRoot, { recursive: true });
    await writeFile(outsideFile, "# Secret", "utf8");
    await rm(linkPath, { force: true });

    try {
      await symlink(outsideFile, linkPath, "file");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") {
        return;
      }
      throw error;
    }

    const service = createFilePreviewService({ workspaceRoot });

    await expect(service.readMarkdownPreview(linkPath)).rejects.toThrow(
      "Preview path must stay inside the workspace",
    );
  });

  it("rejects markdown-named symlinks that target non-markdown files", async () => {
    const workspaceRoot = join(process.cwd(), "tmp-preview-test", "workspace-target-ext");
    const targetFile = join(workspaceRoot, "package.json");
    const linkPath = join(workspaceRoot, "linked.md");

    await mkdir(workspaceRoot, { recursive: true });
    await writeFile(targetFile, "{}", "utf8");
    await rm(linkPath, { force: true });

    try {
      await symlink(targetFile, linkPath, "file");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") {
        return;
      }
      throw error;
    }

    const service = createFilePreviewService({ workspaceRoot });

    await expect(service.readMarkdownPreview(linkPath)).rejects.toThrow(
      "Only markdown files can be previewed",
    );
  });
});
