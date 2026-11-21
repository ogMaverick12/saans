import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it, vi } from "vitest";
import { ProfileForm } from "@/components/profile-form";

type User = ReturnType<typeof userEvent.setup>;

/**
 * Fills every required profile answer except language and reading mode.
 */
async function fillRequiredAnswers(user: User) {
  await user.click(screen.getByRole("checkbox", { name: "Young children" }));
  await user.click(screen.getByRole("radio", { name: "Walking" }));
  await user.selectOptions(screen.getByLabelText("Home type"), "apartment");
  await user.click(
    screen.getByRole("switch", { name: "We have an air purifier" }),
  );
  await user.click(screen.getByRole("radio", { name: "LPG cylinder" }));
  await user.click(screen.getByRole("radio", { name: "None" }));
  await user.click(screen.getByRole("radio", { name: "Medium" }));
}

describe("ProfileForm", () => {
  it("focuses the error summary and links each error to its field", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<ProfileForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole("button", { name: "Write my plan" }));

    const summary = screen.getByRole("alert");
    expect(summary).toHaveFocus();
    expect(summary).toHaveTextContent("Please check your answers");
    const commuteLink = screen.getByRole("link", {
      name: "Choose how your household usually travels.",
    });
    expect(commuteLink).toHaveAttribute("href", "#profile-commute");
    expect(document.getElementById("profile-commute")).toHaveAttribute(
      "aria-describedby",
      "profile-commute-error",
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits validated answers with the chosen language and reading mode", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const note = "Keep the bedroom door closed.";
    render(<ProfileForm onSubmit={onSubmit} isSubmitting={false} />);

    await fillRequiredAnswers(user);
    await user.click(screen.getByRole("radio", { name: "हिन्दी" }));
    await user.click(
      screen.getByRole("switch", { name: "Simple reading mode" }),
    );
    await user.type(
      screen.getByLabelText(/Anything else we should know/),
      note,
    );
    expect(
      screen.getByText(`${note.length} of 200 characters`),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Write my plan" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      profile: {
        household: ["young_children"],
        commute: "walk",
        homeType: "apartment",
        hasPurifier: true,
        hasAirConditioner: false,
        cookingFuel: "lpg",
        heating: "none",
        budget: "medium",
        note,
      },
      language: "hi",
      readingMode: "simple",
    });
  }, 15_000);

  it("shows the privacy line and disables submit while writing", () => {
    render(<ProfileForm onSubmit={vi.fn()} isSubmitting />);

    expect(
      screen.getByText(
        "Your answers are used only to write this plan. They are not stored.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Writing your plan…" }),
    ).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ProfileForm onSubmit={vi.fn()} isSubmitting={false} />,
    );

    const results = await axe(container);

    expect(results.violations).toEqual([]);
  });
});
