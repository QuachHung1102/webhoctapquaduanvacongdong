import assert from "node:assert/strict";
import test from "node:test";
import { canManageProject, canReviewIn, canUpdateApplication } from "./permissions";
import { isOneOf, parseDate, parseOptionalUrl, passwordError, uniqueUsername, usernameBase } from "./validation";

const mentor = { id: "mentor", role: "MENTOR" };
const learner = { id: "learner", role: "LEARNER" };
const project = { mentorId: mentor.id };
const application = { userId: learner.id, project };

test("project and application permissions", () => {
  assert.equal(canManageProject(mentor, project), true);
  assert.equal(canManageProject({ id: "admin", role: "ADMIN" }, project), true);
  assert.equal(canManageProject(learner, project), false);
  assert.equal(canUpdateApplication(mentor, application, "ACCEPTED"), true);
  assert.equal(canUpdateApplication(learner, application, "WITHDRAWN"), true);
  assert.equal(canUpdateApplication(learner, application, "REJECTED"), false);
  assert.deepEqual(
    ["RECRUITING", "IN_PROGRESS", "REVIEWING", "COMPLETED", "UPCOMING", "CANCELLED"].filter(canReviewIn),
    ["REVIEWING", "COMPLETED"],
  );
});

test("parseOptionalUrl accepts http(s) and site-relative paths only", () => {
  assert.equal(parseOptionalUrl("https://example.com/a?b=1"), "https://example.com/a?b=1");
  assert.equal(parseOptionalUrl("  http://example.com "), "http://example.com");
  assert.equal(parseOptionalUrl("/images/avatars/a.svg"), "/images/avatars/a.svg");
  for (const empty of ["", "   ", null, undefined]) assert.equal(parseOptionalUrl(empty), null);
  for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.com", "/\\evil.com", "example.com", "ftp://x.y", 42, {}]) {
    assert.equal(parseOptionalUrl(bad), undefined, String(bad));
  }
});

test("passwordError enforces length, uppercase and digit", () => {
  assert.equal(passwordError("Abcdefg1"), null);
  assert.match(passwordError("Abc1") ?? "", /8 ký tự/);
  assert.match(passwordError("abcdefg1") ?? "", /chữ hoa/);
  assert.match(passwordError("Abcdefgh") ?? "", /chữ số/);
  assert.match(passwordError(12345678) ?? "", /8 ký tự/);
});

test("username slug and collision suffix", () => {
  assert.equal(usernameBase("Mentor.Hung@example.com"), "mentor-hung");
  assert.equal(usernameBase("a..b+tag_x@example.com"), "a-btagx");
  assert.equal(usernameBase("...@example.com"), "user");
  assert.equal(uniqueUsername("an", []), "an");
  assert.equal(uniqueUsername("an", ["an", "an-2", "anh"]), "an-3");
});

test("parseDate and isOneOf reject junk", () => {
  assert.equal(parseDate("2026-01-02")?.toISOString(), "2026-01-02T00:00:00.000Z");
  for (const bad of ["abc", "", null, 5]) assert.equal(parseDate(bad), null);
  assert.equal(isOneOf({ A: "A", B: "B" }, "A"), true);
  assert.equal(isOneOf({ A: "A", B: "B" }, "C"), false);
});
