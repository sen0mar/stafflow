import {
  getPaginationParams,
  limitQuerySchema,
  MAX_PAGINATION_PAGE,
  pageQuerySchema,
} from "./pagination";

describe("pagination request boundaries", () => {
  it.each([
    ["zero", 0],
    ["a negative page", -1],
    ["a fractional page", 1.5],
    ["an unsafe integer", Number.MAX_SAFE_INTEGER + 1],
    ["the documented maximum plus one", MAX_PAGINATION_PAGE + 1],
    ["numeric overflow", "1e309"],
  ])("rejects %s", (_label, value) => {
    expect(() => pageQuerySchema.parse(value)).toThrow();
  });

  it("accepts the documented maximum and produces a safe Prisma offset", () => {
    const page = pageQuerySchema.parse(String(MAX_PAGINATION_PAGE));
    const limit = limitQuerySchema.parse("100");
    const pagination = getPaginationParams({ limit, page });

    expect(page).toBe(MAX_PAGINATION_PAGE);
    expect(Number.isSafeInteger(pagination.skip)).toBe(true);
    expect(pagination).toEqual({ skip: 999_900, take: 100 });
  });
});
