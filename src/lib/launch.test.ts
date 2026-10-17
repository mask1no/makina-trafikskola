import { describe, expect, it } from "vitest";

import {
  guaranteeConfirmed,
  productLaunchApproved,
  risk2Confirmed,
} from "./launch";

describe("client confirmation launch gates", () => {
  it("keeps Risk 2 and guarantee products hidden by default", () => {
    expect(risk2Confirmed({})).toBe(false);
    expect(guaranteeConfirmed({})).toBe(false);
    expect(
      productLaunchApproved(
        { kind: "PACKAGE", includesRisk2: true },
        {},
      ),
    ).toBe(false);
    expect(
      productLaunchApproved(
        { kind: "GUARANTEE", includesRisk2: false },
        {},
      ),
    ).toBe(false);
  });

  it("allows each offering only after its explicit approval flag", () => {
    expect(
      productLaunchApproved(
        { kind: "PACKAGE", includesRisk2: true },
        { RISK2_CONFIRMED: "1" },
      ),
    ).toBe(true);
    expect(
      productLaunchApproved(
        { kind: "GUARANTEE", includesRisk2: false },
        { GUARANTEE_CONFIRMED: "1" },
      ),
    ).toBe(true);
    expect(
      productLaunchApproved(
        { kind: "SINGLE_LESSON", includesRisk2: false },
        {},
      ),
    ).toBe(true);
    expect(
      productLaunchApproved(
        { kind: "COURSE_SEAT", includesRisk2: true },
        {},
      ),
    ).toBe(true);
    expect(
      productLaunchApproved(
        { kind: "PACKAGE", includesRisk2: true },
        {},
      ),
    ).toBe(false);
  });
});
