import Navbar from "@/components/Navbar";
import NewHero from "@/components/NewHero";
import ServicesSection from "@/components/ServicesSection";
import PopularRoutesSection from "@/components/PopularRoutesSection";
import WhyChooseUsSection from "@/components/WhyChooseUsSection";
import AboutStorySection from "@/components/AboutStorySection";
import DiscountsSection from "@/components/DiscountsSection";
import MobileAppSection from "@/components/MobileAppSection";
import SupportSection from "@/components/SupportSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <NewHero />
        <ServicesSection />
        <PopularRoutesSection />
        <WhyChooseUsSection />
        <AboutStorySection />
        <DiscountsSection />
        <MobileAppSection />
        <SupportSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
