"use client";

import { useAuth } from "@clerk/nextjs";
import { getPlanFromBillingStatus, PLAN_SLUGS, PLANS } from "./subscription-constants";

export const useUserPlan = () => {
    const { has, isLoaded } = useAuth();
    const plan = isLoaded
        ? getPlanFromBillingStatus(
            has({ plan: PLAN_SLUGS.standard }),
            has({ plan: PLAN_SLUGS.pro }),
        )
        : null;

    return {
        isLoaded,
        plan,
        limits: plan ? PLANS[plan] : null,
    };
};
