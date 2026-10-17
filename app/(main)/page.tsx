import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import ProjectTypesSection from "@/components/sections/ProjectTypesSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import ProjectsShowcase from "@/components/sections/ProjectsShowcase";
import RolesSection from "@/components/sections/RolesSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";

// Sections read live counts, projects and reviews from the DB — refresh at most once a minute.
export const revalidate = 60;

export default function Home() {
  return (
    <main id="main">
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <ProjectTypesSection />
      <ProjectsShowcase />
      <FeaturesSection />
      <RolesSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}
