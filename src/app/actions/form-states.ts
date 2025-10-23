export type AuthFormState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

export const passwordSignInInitialState: AuthFormState = {
  status: "idle",
  message: null,
};

export type AutomationFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  slug?: string;
};

export const automationFormInitialState: AutomationFormState = {
  status: "idle",
  message: null,
};
