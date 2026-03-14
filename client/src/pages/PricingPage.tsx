import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

interface PricingPlan {
  id: number;
  name: string;
  price: number;
  period: string;
  description: string;
  features: string[];
  videoLimit: number;
  maxDuration: number;
  maxCharacters: number;
  highlighted: boolean;
  cta: string;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 1,
    name: "Free",
    price: 0,
    period: "Forever",
    description: "Perfect for trying out AI Video Storyteller",
    features: [
      "5 videos per month",
      "Up to 5 minutes per video",
      "Up to 5,000 characters per story",
      "Royalty-free music included",
      "Basic video quality",
      "Community support",
    ],
    videoLimit: 5,
    maxDuration: 300, // 5 minutes
    maxCharacters: 5000,
    highlighted: false,
    cta: "Get Started",
  },
  {
    id: 2,
    name: "Standard",
    price: 10,
    period: "month",
    description: "For content creators and small teams",
    features: [
      "Unlimited videos per month",
      "Up to 5 minutes per video",
      "Up to 5,000 characters per story",
      "Royalty-free music included",
      "Standard video quality",
      "Email support",
      "Video analytics",
    ],
    videoLimit: Infinity,
    maxDuration: 300, // 5 minutes
    maxCharacters: 5000,
    highlighted: false,
    cta: "Subscribe Now",
  },
  {
    id: 3,
    name: "Pro",
    price: 15,
    period: "month",
    description: "For professional creators",
    features: [
      "Unlimited videos per month",
      "Up to 10 minutes per video",
      "Up to 20,000 characters per story",
      "Royalty-free music included",
      "High video quality",
      "Priority email support",
      "Advanced video analytics",
      "Custom branding options",
    ],
    videoLimit: Infinity,
    maxDuration: 600, // 10 minutes
    maxCharacters: 20000,
    highlighted: true,
    cta: "Subscribe Now",
  },
  {
    id: 4,
    name: "Premium",
    price: 30,
    period: "month",
    description: "For professional studios and agencies",
    features: [
      "Unlimited videos per month",
      "Unlimited video duration",
      "Up to 30,000 characters per story",
      "Royalty-free music included",
      "Premium video quality",
      "24/7 priority support",
      "Advanced analytics & reports",
      "Custom branding & watermarks",
      "API access",
      "Dedicated account manager",
    ],
    videoLimit: Infinity,
    maxDuration: Infinity,
    maxCharacters: 30000,
    highlighted: false,
    cta: "Subscribe Now",
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  
  // Fetch subscription data
  const { data: currentSubscription } = trpc.subscription.getCurrentSubscription.useQuery(
    undefined,
    { enabled: !!user }
  );
  
  const { data: allPlans } = trpc.subscription.getAllPlans.useQuery();

  const handleSelectPlan = (planId: number) => {
    if (!user) {
      toast.error("Please log in to upgrade your plan");
      navigate("/");
      return;
    }

    if (planId === 1) {
      navigate("/generate");
    } else {
      // In production, this would redirect to Stripe checkout
      setSelectedPlan(planId);
      toast.info(`Stripe integration coming soon for ${PRICING_PLANS.find(p => p.id === planId)?.name} plan`);
    }
  };

  const isCurrentPlan = (planId: number) => {
    if (!currentSubscription) return planId === 1; // Default to free plan
    return currentSubscription.planId === planId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold text-white">AI Video Storyteller</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="border-slate-600 text-slate-300 hover:text-white"
          >
            Back
          </Button>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-slate-400">
            Choose the perfect plan for your video creation needs
          </p>
          {user && currentSubscription && (
            <div className="mt-4 inline-block bg-purple-600/20 border border-purple-500/50 rounded-lg px-4 py-2">
              <p className="text-purple-300">
                Current Plan: <span className="font-semibold">{currentSubscription.planName}</span>
              </p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-all duration-300 ${
                plan.highlighted
                  ? "border-purple-500 bg-slate-800/80 shadow-2xl shadow-purple-500/20 md:scale-105"
                  : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
              } ${isCurrentPlan(plan.id) ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              {isCurrentPlan(plan.id) && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Current Plan
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                <p className="text-slate-400 text-sm mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
                  <span className="text-slate-400 ml-2">/{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan(plan.id)}
                  className={`w-full ${
                    isCurrentPlan(plan.id)
                      ? "bg-slate-600 text-slate-300 cursor-default"
                      : plan.highlighted
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  {isCurrentPlan(plan.id) ? "Current Plan" : plan.cta}
                  {!isCurrentPlan(plan.id) && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-white mb-8">Feature Comparison</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-800/50">
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">
                    Feature
                  </th>
                  {PRICING_PLANS.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4 text-slate-300 font-semibold">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700 hover:bg-slate-800/30">
                  <td className="py-4 px-4 text-slate-300">Videos per month</td>
                  {PRICING_PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-slate-400">
                      {plan.videoLimit === Infinity ? "Unlimited" : plan.videoLimit}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-700 hover:bg-slate-800/30">
                  <td className="py-4 px-4 text-slate-300">Max video duration</td>
                  {PRICING_PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-slate-400">
                      {plan.maxDuration === Infinity
                        ? "Unlimited"
                        : `${plan.maxDuration / 60} min`}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-700 hover:bg-slate-800/30">
                  <td className="py-4 px-4 text-slate-300">Max characters per story</td>
                  {PRICING_PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-slate-400">
                      {plan.maxCharacters.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-slate-700 hover:bg-slate-800/30">
                  <td className="py-4 px-4 text-slate-300">Video quality</td>
                  {PRICING_PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-slate-400">
                      {plan.id === 1 && "Basic"}
                      {plan.id === 2 && "Standard"}
                      {plan.id === 3 && "High"}
                      {plan.id === 4 && "Premium"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-4 px-4 text-slate-300">Support</td>
                  {PRICING_PLANS.map((plan) => (
                    <td key={plan.id} className="text-center py-4 px-4 text-slate-400">
                      {plan.id === 1 && "Community"}
                      {plan.id === 2 && "Email"}
                      {plan.id === 3 && "Priority Email"}
                      {plan.id === 4 && "24/7 Priority"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h3>
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Can I upgrade or downgrade my plan anytime?
              </h4>
              <p className="text-slate-400">
                Yes! You can change your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Do you offer refunds?
              </h4>
              <p className="text-slate-400">
                We offer a 7-day money-back guarantee for all paid plans. No questions asked.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Is there a contract?
              </h4>
              <p className="text-slate-400">
                No! All plans are month-to-month. Cancel anytime with no penalties.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                What payment methods do you accept?
              </h4>
              <p className="text-slate-400">
                We accept all major credit cards, PayPal, and Apple Pay through Stripe.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">
                Is royalty-free music included?
              </h4>
              <p className="text-slate-400">
                Yes! All plans include access to our curated library of royalty-free music from Incompetech and other sources. Perfect for YouTube, TikTok, and Facebook publishing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
