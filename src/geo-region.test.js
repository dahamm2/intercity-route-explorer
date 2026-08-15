import { describe, expect, it } from "vitest";
import { regionCode } from "./geo-region";

describe("region labels for distant same-name cities", () => {
  it("identifies the Springfield examples by state", () => {
    expect(regionCode([-89.64103, 39.80069])).toBe("IL");
    expect(regionCode([-93.29909, 37.20937])).toBe("MO");
    expect(regionCode([-72.59425, 42.10601])).toBe("MA");
    expect(regionCode([-77.17043, 38.76667])).toBe("VA");
  });
});
