import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { InviteAcceptance } from "@/components/auth/invite-acceptance";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

const push = vi.fn();
const refresh = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    refresh,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

const commonCopy = {
  appName: "SiteNgan Pro",
  thai: "ไทย",
  english: "English",
  signOut: "Sign out",
};

const authCopy = {
  welcomeTitle: "Welcome",
  welcomeDescription: "Manage everything in one place",
  loginTitle: "Sign in",
  loginEyebrow: "Access portal",
  productEyebrow: "Construction operations system",
  featureMultiCompany: "Multi-company",
  featureOrganizationFirst: "Organization-first",
  featureFieldReady: "Field-ready",
  featureMobileResponsive: "Mobile responsive",
  featureSecureAccess: "Secure access",
  featurePasswordProtected: "Password protected",
  languageHint: "Thai / English interface",
  registerTitle: "Create account",
  registerEyebrow: "New workspace",
  registerDetailsEyebrow: "Account details",
  registerStepOne: "Step 01",
  registerStepOneTitle: "Create account",
  registerStepTwo: "Step 02",
  registerStepTwoTitle: "Set up company",
  registerStepThree: "Step 03",
  registerStepThreeTitle: "Start tracking",
  email: "Email",
  password: "Password",
  forgotPassword: "Forgot password?",
  forgotPasswordTitle: "Reset your password",
  forgotPasswordDescription: "Enter your email and we will send a reset link",
  forgotPasswordAction: "Send reset link",
  forgotPasswordLoading: "Sending link...",
  forgotPasswordSuccess: "If this email exists, we will send a reset link",
  forgotPasswordDevHint: "Local testing link",
  resetPasswordTitle: "Create a new password",
  resetPasswordDescription: "Set a new password for this account",
  resetPasswordAction: "Save new password",
  resetPasswordLoading: "Saving...",
  resetPasswordSuccess: "Your password has been updated. Please sign in again.",
  resetPasswordInvalid: "Invalid reset link",
  resetPasswordExpired: "Expired reset link",
  newPassword: "New password",
  confirmNewPassword: "Confirm new password",
  name: "Full name",
  confirmPassword: "Confirm password",
  passwordPlaceholder: "At least 6 characters",
  confirmPasswordPlaceholder: "Confirm your password",
  loginAction: "Sign in",
  loginLoading: "Signing in...",
  registerAction: "Create account",
  registerLoading: "Creating account...",
  noAccount: "Don't have an account?",
  hasAccount: "Already have an account?",
  goRegister: "Register",
  goLogin: "Sign in",
  invalidCredentials: "Incorrect email or password",
  signedInAs: "Signed in as",
  genericError: "Something went wrong",
  passwordMismatch: "Passwords do not match",
  passwordTooShort: "Password too short",
  nameRequired: "Please enter your name",
  backToLogin: "Back to sign in",
};

const membersCopy = {
  acceptInviteTitle: "Accept invite",
  acceptInviteDescription: "Review the invite before joining",
  acceptInviteAction: "Join organization",
  acceptingInvite: "Joining...",
  inviteExpired: "This invite has expired",
  inviteUnavailable: "This invite is unavailable",
  inviteEmailMismatch: "Please sign in with the invited email address",
  signInRequired: "Please sign in first",
  invitedEmail: "Invited email",
  organization: "Organization",
  role: "Role",
  backToLogin: "Sign in to accept",
  backToRegister: "Register with this email",
  inviteLink: "Invite link",
};

describe("auth flow UI", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    mockSignIn.mockReset();
    mockSignOut.mockReset();
    vi.restoreAllMocks();
  });

  it("preserves callbackUrl on the login to register link", () => {
    render(
      <LoginForm
        locale="th"
        callbackUrl="/th/invite/token-123"
        copy={{ common: commonCopy, auth: authCopy }}
      />,
    );

    expect(screen.getByRole("link", { name: authCopy.goRegister })).toHaveAttribute(
      "href",
      "/th/register?callbackUrl=%2Fth%2Finvite%2Ftoken-123",
    );
  });

  it("links to forgot password from the login form", () => {
    render(<LoginForm locale="th" copy={{ common: commonCopy, auth: authCopy }} />);

    expect(screen.getByRole("link", { name: authCopy.forgotPassword })).toHaveAttribute(
      "href",
      "/th/forgot-password",
    );
  });

  it("preserves callbackUrl on the register to login link", () => {
    render(
      <RegisterForm
        locale="th"
        callbackUrl="/th/invite/token-123"
        copy={{ auth: authCopy }}
      />,
    );

    expect(screen.getByRole("link", { name: authCopy.goLogin })).toHaveAttribute(
      "href",
      "/th/login?callbackUrl=%2Fth%2Finvite%2Ftoken-123",
    );
  });

  it("uses normalized email and auth redirect after successful registration", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    vi.stubGlobal("fetch", fetchMock);
    mockSignIn.mockResolvedValue({ url: "/th/invite/token-123" });

    render(
      <RegisterForm
        locale="th"
        callbackUrl="/th/invite/token-123"
        copy={{ auth: authCopy }}
      />,
    );

    fireEvent.change(screen.getByLabelText(authCopy.name), {
      target: { value: "Somchai" },
    });
    fireEvent.change(screen.getByLabelText(authCopy.email), {
      target: { value: "  USER@Example.COM " },
    });
    fireEvent.change(screen.getByLabelText(authCopy.password), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(authCopy.confirmPassword), {
      target: { value: "123456" },
    });
    fireEvent.submit(screen.getByRole("button", { name: authCopy.registerAction }).closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Somchai",
            email: "user@example.com",
            password: "123456",
            locale: "th",
          }),
        }),
      );
    });

    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({
        email: "user@example.com",
        password: "123456",
        callbackUrl: "/th/invite/token-123",
      }),
    );
    expect(push).toHaveBeenCalledWith("/th/invite/token-123");
    expect(refresh).toHaveBeenCalled();
  });

  it("lets the user sign out to switch accounts from invite mismatch state", async () => {
    mockSignOut.mockResolvedValue(undefined);

    render(
      <InviteAcceptance
        locale="th"
        token="token-123"
        callbackUrl="/th/invite/token-123"
        currentUserEmail="wrong@example.com"
        inviteEmail="right@example.com"
        organizationName="SiteNgan"
        roleLabel="Manager"
        state="EMAIL_MISMATCH"
        copy={{ common: commonCopy, auth: authCopy, members: membersCopy }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: commonCopy.signOut }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({
        redirect: true,
        callbackUrl: "/th/login?callbackUrl=%2Fth%2Finvite%2Ftoken-123",
      });
    });
  });

  it("shows the local reset URL after forgot password submission in mock mode", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: authCopy.forgotPasswordSuccess,
        resetUrl: "http://localhost:3000/th/reset-password/token-123",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ForgotPasswordForm locale="th" copy={{ auth: authCopy }} />);

    fireEvent.change(screen.getByLabelText(authCopy.email), {
      target: { value: "USER@Example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: authCopy.forgotPasswordAction }).closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/forgot-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "user@example.com",
            locale: "th",
          }),
        }),
      );
    });

    expect(screen.getAllByText(authCopy.forgotPasswordSuccess)).toHaveLength(2);
    expect(screen.getByRole("link", { name: "http://localhost:3000/th/reset-password/token-123" })).toBeInTheDocument();
  });

  it("redirects back to login after a successful password reset", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <ResetPasswordForm
        locale="th"
        token="token-123"
        copy={{ auth: authCopy }}
      />,
    );

    fireEvent.change(screen.getByLabelText(authCopy.newPassword), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(authCopy.confirmNewPassword), {
      target: { value: "123456" },
    });
    fireEvent.submit(screen.getByRole("button", { name: authCopy.resetPasswordAction }).closest("form")!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reset-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            token: "token-123",
            password: "123456",
            locale: "th",
          }),
        }),
      );
    });

    expect(push).toHaveBeenCalledWith("/th/login?reset=success");
    expect(refresh).toHaveBeenCalled();
  });
});
