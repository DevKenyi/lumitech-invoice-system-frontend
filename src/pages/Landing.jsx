// Landing.jsx — modular marketing page
import LandingNav         from "../components/landing/LandingNav";
import LandingHero        from "../components/landing/LandingHero";
import SocialProofBar     from "../components/landing/SocialProofBar";
import ProblemSection     from "../components/landing/ProblemSection";
import CapitalSection     from "../components/landing/CapitalSection";
import FeaturesSection    from "../components/landing/FeaturesSection";
import HowItWorksSection  from "../components/landing/HowItWorksSection";
import CountriesSection   from "../components/landing/CountriesSection";
import TestimonialsSection from "../components/landing/TestimonialsSection";
import PricingSection     from "../components/landing/PricingSection";
import CtaSection         from "../components/landing/CtaSection";
import LandingFooter      from "../components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased" style={{ overflowX: "clip" }}>
      <LandingNav />
      <LandingHero />
      <SocialProofBar />
      <ProblemSection />
      <CapitalSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CountriesSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}
