// Copyright (c) 2026 Niraj Sharma
// Licensed under CC BY-NC 4.0.
// Commercial use requires a paid license.

import { app } from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Git Visualizer API running on http://localhost:${PORT}`);
});
