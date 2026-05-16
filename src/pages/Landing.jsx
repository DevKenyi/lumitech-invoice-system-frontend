// Landing.jsx — modular marketing page
import LandingNav          from "../components/landing/LandingNav";
import LandingHero         from "../components/landing/LandingHero";
import HowItWorksSection   from "../components/landing/HowItWorksSection";
import CapitalSection      from "../components/landing/CapitalSection";
import SocialProofBar      from "../components/landing/SocialProofBar";
import FeaturesSection     from "../components/landing/FeaturesSection";
import PosSection         from "../components/landing/PosSection";
import CountriesSection    from "../components/landing/CountriesSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import PricingSection      from "../components/landing/PricingSection";
import CtaSection          from "../components/landing/CtaSection";
import LandingFooter       from "../components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased" style={{ overflowX: "clip" }}>
      <LandingNav />
      <LandingHero />
      <HowItWorksSection />
      <CapitalSection />
      <SocialProofBar />
      <FeaturesSection />
      <PosSection />
      <CountriesSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
