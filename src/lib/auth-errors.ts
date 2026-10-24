export function authErrorMessage(error: { code?: string; message?: string }, action: "login" | "reset" | "setup" = "login"): string {
  const code = error.code;
  if (action === "reset" && (code === "auth/user-not-found" || code === "auth/invalid-email")) {
    return "If this email has a login, you will receive a password reset link shortly.";
  }
  if (code === "UNAUTHENTICATED" && error.message?.includes("Verify your email")) {
    return "Verify your email address using the link we sent, then sign in again.";
  }
  if (code === "FORBIDDEN") {
    return "This email is not linked to an active distributor account. Contact NexaShopping support.";
  }
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(code ?? "")) {
    return "Email or password is incorrect. Please try again.";
  }
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/weak-password") return "Choose a stronger password with at least 8 characters.";
  if (code === "auth/email-already-in-use") return "This email already has a login. Sign in or reset your password.";
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later or reset your password.";
  if (code === "auth/operation-not-allowed") return "Email sign-in is unavailable right now. Contact NexaShopping support.";
  if (code === "auth/unauthorized-domain") return "Google sign-in is unavailable on this website. Contact NexaShopping support.";
  if (code === "auth/popup-blocked") return "Your browser blocked Google sign-in. Allow pop-ups and try again.";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "Google sign-in was cancelled.";
  if (code === "auth/account-exists-with-different-credential") return "This email already has a password login. Sign in with your password first.";
  if (code === "auth/network-request-failed" || code === "INTERNAL") return "Could not reach the sign-in service. Check your connection and try again.";
  return action === "reset" ? "Could not send the reset email. Please try again." : action === "setup" ? "Could not set up your password. Please try again." : "Sign-in failed. Please try again.";
}
