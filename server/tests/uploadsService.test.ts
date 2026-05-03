import { describe, expect, it } from "vitest";

import { UploadsService } from "../src/services/uploadsService";

describe("UploadsService", () => {
  const svc = new UploadsService();

  it("rejects unknown content types before touching S3", async () => {
    await expect(svc.createCoverPresignedPut("user-1", "application/pdf")).rejects.toThrow(/Tipo de imagen no permitido/);
  });
});
