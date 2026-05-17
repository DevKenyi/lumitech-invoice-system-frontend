import LandingNav          from "../components/landing/LandingNav";
import LandingHero         from "../components/landing/LandingHero";
import SocialProofBar      from "../components/landing/SocialProofBar";
import ProblemSection      from "../components/landing/ProblemSection";
import HowItWorksSection   from "../components/landing/HowItWorksSection";
import FeaturesSection     from "../components/landing/FeaturesSection";
import CapitalSection      from "../components/landing/CapitalSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import PricingSection      from "../components/landing/PricingSection";
import PosSection          from "../components/landing/PosSection";
import CtaSection          from "../components/landing/CtaSection";
import LandingFooter       from "../components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] font-sans antialiased" style={{ overflowX: "clip" }}>
      <LandingNav />
      <LandingHero />
      <SocialProofBar />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CapitalSection />
      <PosSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
