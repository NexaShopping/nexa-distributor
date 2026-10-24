import assert from "node:assert/strict";
import test from "node:test";
import { authErrorMessage } from "./auth-errors.ts";

test("invalid password gives a clear retry message", () => {
  assert.equal(authErrorMessage({ code: "auth/invalid-credential" }), "Email or password is incorrect. Please try again.");
});

test("unapproved distributor email explains who can help", () => {
  assert.equal(authErrorMessage({ code: "FORBIDDEN" }), "This email is not linked to an active distributor account. Contact NexaShopping support.");
});

test("unverified email tells the distributor what to do", () => {
  assert.equal(authErrorMessage({ code: "UNAUTHENTICATED", message: "Verify your email address before signing in" }), "Verify your email address using the link we sent, then sign in again.");
});

test("reset requests avoid confirming whether an address has an account", () => {
  assert.equal(authErrorMessage({ code: "auth/user-not-found" }, "reset"), "If this email has a login, you will receive a password reset link shortly.");
});

test("provider setup failures tell the distributor to contact support", () => {
  assert.equal(authErrorMessage({ code: "auth/operation-not-allowed" }), "Email sign-in is unavailable right now. Contact NexaShopping support.");
  assert.equal(authErrorMessage({ code: "auth/unauthorized-domain" }), "Google sign-in is unavailable on this website. Contact NexaShopping support.");
});
