import { listLeaveTypesSchema } from "./leave.schema";

describe("leave schemas", () => {
  it.each([
    ["false", false],
    ["true", true],
  ])("parses the isActive=%s filter as %s", (queryValue, expected) => {
    const result = listLeaveTypesSchema.parse({
      query: { isActive: queryValue, page: "1" },
    });

    expect(result.query.isActive).toBe(expected);
  });

  it("rejects non-literal boolean query values", () => {
    expect(() =>
      listLeaveTypesSchema.parse({
        query: { isActive: "1", page: "1" },
      }),
    ).toThrow();
  });
});
