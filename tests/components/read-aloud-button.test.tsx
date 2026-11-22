import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReadAloudButton } from "@/components/read-aloud-button";
import { buildClientPlan } from "../lib/api/client-test-data";

const PLAN = buildClientPlan();

describe("ReadAloudButton", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is hidden when the browser has no speech synthesis", () => {
    vi.stubGlobal("speechSynthesis", undefined);

    render(<ReadAloudButton plan={PLAN} language="en" />);

    expect(
      screen.queryByRole("button", { name: "Read the plan aloud" }),
    ).not.toBeInTheDocument();
  });

  it("speaks the plan in the chosen language and toggles stop", async () => {
    const spoken: FakeUtterance[] = [];
    class FakeUtterance {
      lang = "";
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readonly text: string;

      constructor(text: string) {
        this.text = text;
        spoken.push(this);
      }
    }
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
    vi.stubGlobal("speechSynthesis", { speak, cancel });
    const user = userEvent.setup();
    render(<ReadAloudButton plan={PLAN} language="hi" />);

    await user.click(
      screen.getByRole("button", { name: "Read the plan aloud" }),
    );

    expect(speak).toHaveBeenCalledTimes(1);
    expect(spoken[0]?.lang).toBe("hi-IN");
    expect(spoken[0]?.text).toContain(
      "A hazy day, so keep the morning quiet",
    );

    await user.click(screen.getByRole("button", { name: "Stop reading" }));

    expect(cancel).toHaveBeenCalledTimes(2);
    expect(
      screen.getByRole("button", { name: "Read the plan aloud" }),
    ).toBeInTheDocument();
  });
});
