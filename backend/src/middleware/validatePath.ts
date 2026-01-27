import { Request, Response, NextFunction } from "express";
import { stat } from "fs/promises";
import { resolve } from "path";

const FORBIDDEN_PATHS = [
  "/etc",
  "/var",
  "/usr",
  "/bin",
  "/sbin",
  "/root",
  "/proc",
  "/sys",
];

export async function validatePath(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const repoPath = req.body.path || req.query.repoPath;

  if (!repoPath || typeof repoPath !== "string") {
    res.status(400).json({ error: "Path is required" });
    return;
  }

  const absolutePath = resolve(repoPath);

  // Check for forbidden system paths
  for (const forbidden of FORBIDDEN_PATHS) {
    if (absolutePath.startsWith(forbidden)) {
      res
        .status(403)
        .json({ error: "Access to system directories is forbidden" });
      return;
    }
  }

  // Verify path exists and is a directory
  try {
    const stats = await stat(absolutePath);
    if (!stats.isDirectory()) {
      res.status(400).json({ error: "Path must be a directory" });
      return;
    }
  } catch {
    res.status(404).json({ error: "Path does not exist" });
    return;
  }

  req.body.validatedPath = absolutePath;
  next();
}
