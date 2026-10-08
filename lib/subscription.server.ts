import { auth } from "@clerk/nextjs/server";
import { getPlanFromBillingStatus, PLAN_SLUGS } from "./subscription-constants";

export const getCurrentUserPlan = async () => {
    const { has } = await auth();

    return getPlanFromBillingStatus(
        has({ plan: PLAN_SLUGS.standard }),
        has({ plan: PLAN_SLUGS.pro }),
    );
};
