// Landing.jsx — modular marketing page
import LandingNav          from "../components/landing/LandingNav";
import LandingHero         from "../components/landing/LandingHero";
import HowItWorksSection   from "../components/landing/HowItWorksSection";
import CapitalSection      from "../components/landing/CapitalSection";
import FeaturesSection     from "../components/landing/FeaturesSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import PricingSection      from "../components/landing/PricingSection";
import PosSection          from "../components/landing/PosSection";
import CtaSection          from "../components/landing/CtaSection";
import LandingFooter       from "../components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased" style={{ overflowX: "clip" }}>
      <LandingNav />
      <LandingHero />
      <HowItWorksSection />
      <CapitalSection />
      <FeaturesSection />
      <TestimonialsSection />
      <PricingSection />
      <PosSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
