import { Router, Request, Response } from "express";
import multer from "multer";
import AdmZip from "adm-zip";
import { mkdtemp, rm, mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { gitService } from "../services/git.service.js";

export const uploadRoutes = Router();

// Essential .git files needed for visualization
// Skips: hooks/, logs/, index, info/, description, temp files, lock files
const ESSENTIAL_GIT_PATTERNS = [
  /\.git\/HEAD$/,
  /\.git\/config$/,
  /\.git\/packed-refs$/,
  /\.git\/objects\/.+/, // All objects (commits, trees, blobs)
  /\.git\/refs\/heads\/.+/, // Branch pointers
  /\.git\/refs\/tags\/.+/, // Tag pointers
  /\.git\/refs\/remotes\/.+/, // Remote tracking branches
];

function isEssentialGitFile(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");
  // Must contain .git folder
  if (!normalized.includes(".git/")) return false;
  return ESSENTIAL_GIT_PATTERNS.some((p) => p.test(normalized));
}

// Configure multer for memory storage (zip files)
const uploadZip = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      file.originalname.endsWith(".zip")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed"));
    }
  },
});

// Configure multer for folder uploads (multiple files)
// Frontend already filters to essential .git files only
const uploadFolder = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10000, // Max 10000 files
  },
});

// Upload a zip file containing a git repository
uploadRoutes.post(
  "/upload",
  uploadZip.single("gitZip"),
  async (req: Request, res: Response) => {
    let tempDir: string | null = null;

    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      // Create temp directory
      tempDir = await mkdtemp(join(tmpdir(), "git-visualizer-"));

      // Extract only essential .git files (skip hooks, logs, index, etc.)
      const zip = new AdmZip(req.file.buffer);
      const entries = zip.getEntries();

      for (const entry of entries) {
        if (isEssentialGitFile(entry.entryName) && !entry.isDirectory) {
          const targetPath = join(tempDir, entry.entryName);
          await mkdir(dirname(targetPath), { recursive: true });
          await writeFile(targetPath, entry.getData());
        }
      }

      // Find the git repository in extracted files
      // It could be:
      // 1. A .git folder directly in the zip
      // 2. A folder containing a .git folder
      // 3. The extracted folder itself is a repo

      const repoPath = await findGitRepo(tempDir);

      if (!repoPath) {
        res
          .status(400)
          .json({ error: "No valid git repository found in the uploaded zip" });
        return;
      }

      // Validate it's a git repo
      const isValid = await gitService.validateRepository(repoPath);
      if (!isValid) {
        res
          .status(400)
          .json({
            error: "The uploaded content is not a valid git repository",
          });
        return;
      }

      // Get repository data
      const repository = await gitService.getRepository(repoPath);

      // Override the name with the uploaded filename
      repository.name = req.file.originalname.replace(".zip", "");
      repository.path = "(uploaded)";

      res.json({ success: true, data: repository });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: (error as Error).message });
    } finally {
      // Clean up temp directory
      if (tempDir) {
        try {
          await rm(tempDir, { recursive: true, force: true });
        } catch (e) {
          console.error("Failed to clean up temp dir:", e);
        }
      }
    }
  },
);

// Upload a folder (multiple files with relative paths)
uploadRoutes.post(
  "/upload-folder",
  uploadFolder.array("files"),
  async (req: Request, res: Response) => {
    let tempDir: string | null = null;

    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: "No files uploaded" });
        return;
      }

      // Get folder name from the first file's path
      const firstPath = (files[0] as any).originalname;
      const folderName = firstPath.split("/")[0] || "repository";

      // Create temp directory
      tempDir = await mkdtemp(join(tmpdir(), "git-visualizer-"));

      // Reconstruct folder structure
      for (const file of files) {
        const relativePath = (file as any).originalname;
        const fullPath = join(tempDir, relativePath);

        // Create directory structure
        await mkdir(dirname(fullPath), { recursive: true });

        // Write file
        await writeFile(fullPath, file.buffer);
      }

      // Find the git repository
      const repoPath = await findGitRepo(tempDir);

      if (!repoPath) {
        res
          .status(400)
          .json({ error: "No .git folder found in the selected directory" });
        return;
      }

      // Validate it's a git repo
      const isValid = await gitService.validateRepository(repoPath);
      if (!isValid) {
        res
          .status(400)
          .json({ error: "The selected folder is not a valid git repository" });
        return;
      }

      // Get repository data
      const repository = await gitService.getRepository(repoPath);

      // Override the name with the folder name
      repository.name = folderName;
      repository.path = "(uploaded)";

      res.json({ success: true, data: repository });
    } catch (error) {
      console.error("Folder upload error:", error);
      res.status(500).json({ error: (error as Error).message });
    } finally {
      // Clean up temp directory
      if (tempDir) {
        try {
          await rm(tempDir, { recursive: true, force: true });
        } catch (e) {
          console.error("Failed to clean up temp dir:", e);
        }
      }
    }
  },
);

async function findGitRepo(basePath: string): Promise<string | null> {
  const { readdir, stat } = await import("fs/promises");
  const { join } = await import("path");

  // Check if basePath itself is a git repo
  try {
    await stat(join(basePath, ".git"));
    return basePath;
  } catch {
    // Not a direct repo, check subdirectories
  }

  // Check first level subdirectories
  try {
    const entries = await readdir(basePath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = join(basePath, entry.name);

        // Check if this subdirectory is a git repo
        try {
          await stat(join(subPath, ".git"));
          return subPath;
        } catch {
          // Not a repo, continue
        }

        // Check if this IS the .git folder
        if (entry.name === ".git") {
          return basePath;
        }
      }
    }
  } catch (e) {
    console.error("Error scanning for git repo:", e);
  }

  return null;
}
