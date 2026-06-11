import { useAppStore } from "../features/useAppStore";
import { plans } from "../data/siteData";

export function useSubscription() {
  const { user, billing, setBilling } = useAppStore();
  return { plan: plans.find((item) => item.name === user?.plan) || plans[1], billing, setBilling };
}
