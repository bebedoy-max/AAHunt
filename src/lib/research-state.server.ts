export const researchState: {
  running: boolean;
  cancelRequested: boolean;
  currentJobId: number | null;
} = { running: false, cancelRequested: false, currentJobId: null };

export class ResearchCancelledError extends Error {
  constructor() {
    super("Research dihentikan oleh user");
    this.name = "ResearchCancelledError";
  }
}
