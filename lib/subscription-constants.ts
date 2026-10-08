export const PLAN_SLUGS = {
    standard: "standard",
    pro: "pro",
} as const;

export const PLANS = {
    free: {
        maxBooks: 3,
        maxSessionsPerMonth: 5,
        maxSessionMinutes: 5,
        hasSessionHistory: false,
    },
    standard: {
        maxBooks: 10,
        maxSessionsPerMonth: 100,
        maxSessionMinutes: 15,
        hasSessionHistory: true,
    },
    pro: {
        maxBooks: 100,
        maxSessionsPerMonth: null,
        maxSessionMinutes: 60,
        hasSessionHistory: true,
    },
} as const;

export type PlanType = keyof typeof PLANS;
export type PlanLimits = (typeof PLANS)[PlanType];

export const getPlanFromBillingStatus = (hasStandardPlan: boolean, hasProPlan: boolean): PlanType => {
    if (hasProPlan) return "pro";
    if (hasStandardPlan) return "standard";
    return "free";
};

export const getCurrentBillingPeriodStart = (): Date => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};
