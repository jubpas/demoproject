import "@testing-library/jest-dom";

vi.mock("server-only", () => ({}));

beforeEach(() => {
  vi.restoreAllMocks();
});
