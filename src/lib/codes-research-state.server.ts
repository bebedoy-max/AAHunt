export interface CodeResearchStatus {
  status: "idle" | "running" | "completed" | "failed";
  message: string;
  codesFound: number;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

export const codeResearchState: { status: CodeResearchStatus; running: boolean } = {
  status: {
    status: "idle",
    message: "No code research run yet. Click 'Hunt Codes' to start.",
    codesFound: 0,
    startedAt: null,
    completedAt: null,
    errorMessage: null,
  },
  running: false,
};
