import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attendanceFixtures,
  employees,
  leaveFixtures,
  payslipPeriods,
} from "./fixtures";
import { databaseIdentity, targetFingerprint } from "./target";

test("fixture dates, attendance durations, and leave accounting remain valid at year and DST boundaries", () => {
  for (const value of [
    "2026-01-01T08:00:00Z",
    "2026-03-29T12:00:00Z",
    "2026-11-08T22:00:00Z",
    "2026-12-31T22:00:00Z",
  ]) {
    const now = new Date(value);
    for (let index = 0; index < 12; index++) {
      const requests = leaveFixtures(now, index);
      assert.equal(new Set(requests.map((request) => request.status)).size, 4);
      const active = requests.filter((request) =>
        ["APPROVED", "PENDING"].includes(request.status),
      );
      for (const request of requests) {
        assert.equal(
          request.startDate.getUTCFullYear(),
          request.endDate.getUTCFullYear(),
        );
        assert.equal(
          (request.endDate.getTime() - request.startDate.getTime()) /
            86_400_000 +
            1,
          request.totalDays,
        );
        assert.ok(!request.reviewedAt || request.reviewedAt <= now);
      }
      for (let a = 0; a < active.length; a++)
        for (let b = a + 1; b < active.length; b++)
          assert.ok(
            active[a].endDate < active[b].startDate ||
              active[b].endDate < active[a].startDate,
          );
      for (const row of attendanceFixtures(now, index)) {
        assert.ok(![0, 6].includes(row.date.getUTCDay()));
        assert.ok(!row.clockInAt || row.clockInAt <= now);
        assert.ok(!row.clockOutAt || row.clockOutAt <= now);
        if (row.clockInAt && row.clockOutAt) {
          assert.equal(
            row.totalMinutes,
            (row.clockOutAt.getTime() - row.clockInAt.getTime()) / 60_000,
          );
          if (row.status === "LATE") assert.ok(row.totalMinutes! >= 480);
        }
      }
    }
  }
});
test("new employees use a separate code range and pay periods cross January correctly", () => {
  assert.ok(
    employees
      .slice(5)
      .every((person) => person.employeeCode.startsWith("EMP-DEMO-")),
  );
  assert.equal(
    new Set(employees.map((person) => person.employeeCode)).size,
    15,
  );
  assert.deepEqual(payslipPeriods(new Date("2026-01-01T00:00:00Z")), [
    { year: 2025, month: 12 },
    { year: 2025, month: 11 },
    { year: 2025, month: 10 },
  ]);
});
test("database targeting ignores secrets and identifies pooled/direct aliases", () => {
  const pooled =
    "postgresql://one:secret@ep-example-pooler.eu.neon.tech/app?sslmode=require";
  const direct = "postgresql://two:different@ep-example.eu.neon.tech:5432/app";
  assert.equal(databaseIdentity(pooled), databaseIdentity(direct));
  assert.equal(targetFingerprint(pooled), targetFingerprint(direct));
  assert.notEqual(
    targetFingerprint(direct),
    targetFingerprint("postgresql://localhost/other"),
  );
});
