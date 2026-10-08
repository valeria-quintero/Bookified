import { PricingTable } from "@clerk/nextjs";

export default function SubscriptionsPage() {
  return (
    <main className="wrapper container">
      <section className="mx-auto flex w-full max-w-7xl flex-col items-center gap-10">
        <header className="flex max-w-3xl flex-col items-center gap-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand)]">
            Bookified plans
          </p>
          <h1 className="page-title-xl">More books. Deeper conversations.</h1>
          <p className="subtitle">
            Choose the plan that fits your reading habit. You can change your
            subscription at any time.
          </p>
        </header>

        <div className="clerk-pricing-table-wrapper w-full">
          <PricingTable
            for="user"
            highlightedPlan="pro"
            appearance={{
              variables: {
                colorPrimary: "#663820",
                colorBackground: "#fff6e5",
              },
            }}
            checkoutProps={{
              appearance: {
                variables: {
                  colorPrimary: "#663820",
                  colorBackground: "#fff6e5",
                },
              },
            }}
          />
        </div>
      </section>
    </main>
  );
}
