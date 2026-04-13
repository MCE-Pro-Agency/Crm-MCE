import { Hero } from "@/components/landing/Hero";
import { Showcase } from "@/components/landing/Showcase";
import { Footer } from "@/components/layout/Footer";

// On enlève le "export" devant "const"
const Index = () => (
  <div>
    <Hero />
    <section id="showcase">
      <Showcase />
    </section>
    <Footer />
  </div>
);

// On ajoute l'export par défaut ici
export default Index;
