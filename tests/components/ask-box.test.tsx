import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  askQuestion: vi.fn(),
}));

vi.mock("@/lib/client/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/client/client")>();
  return { ...actual, askQuestion: mocks.askQuestion };
});

import { AskBox } from "@/components/ask-box";
import { ClientError } from "@/lib/client/client";
import { buildClientPlan } from "../lib/client/client-test-data";
import { VALID_ASK } from "../lib/llm/test-data";

const PLACE = {
  name: "Delhi",
  latitude: 28.61,
  longitude: 77.21,
  countryCode: "IN",
};
const PLAN = buildClientPlan();
const QUESTION = "Is the purifier enough?";

describe("AskBox", () => {
  beforeEach(() => {
    mocks.askQuestion.mockReset();
  });

  it("posts a question, shows the answer and fills the box from a follow-up", async () => {
    mocks.askQuestion.mockResolvedValue(VALID_ASK);
    const user = userEvent.setup();
    render(<AskBox place={PLACE} plan={PLAN} language="en" />);
    const textarea = screen.getByRole("textbox", { name: "Your question" });

    await user.type(textarea, QUESTION);
    expect(screen.getByText("23 of 300 characters")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ask Saans" }));

    expect(await screen.findByText(VALID_ASK.answer)).toBeInTheDocument();
    expect(mocks.askQuestion).toHaveBeenCalledTimes(1);
    const request = mocks.askQuestion.mock.calls[0]?.[0];
    expect(request).toMatchObject({
      place: PLACE,
      question: QUESTION,
      language: "en",
    });
    expect(request?.plan.dailyRoutine[0]?.factorIds).toEqual(["n95-mask"]);

    const followUp = VALID_ASK.followUps[0];
    if (followUp === undefined) {
      throw new Error("Expected the answer to include a follow-up");
    }
    await user.click(screen.getByRole("button", { name: followUp }));

    expect(textarea).toHaveValue(followUp);
  });

  it("shows the safe message and a retry button when the request fails", async () => {
    mocks.askQuestion.mockRejectedValue(
      new ClientError(
        "RATE_LIMITED",
        "Too many requests. Wait a minute and try again.",
      ),
    );
    const user = userEvent.setup();
    render(<AskBox place={PLACE} plan={PLAN} language="en" />);

    await user.type(
      screen.getByRole("textbox", { name: "Your question" }),
      QUESTION,
    );
    await user.click(screen.getByRole("button", { name: "Ask Saans" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Too many requests. Wait a minute and try again.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
    expect(screen.queryByText(VALID_ASK.answer)).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <AskBox place={PLACE} plan={PLAN} language="en" />,
    );

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
