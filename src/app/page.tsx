import { SaansApp } from "@/components/saans-app";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Saans
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {
            "Check today's air where you live, then get a plan for your household."
          }
        </p>
      </div>
      <div className="mt-8">
        <SaansApp />
      </div>
    </div>
  );
}
