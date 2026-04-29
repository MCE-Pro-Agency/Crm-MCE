import { ExternalLink } from "lucide-react";

export const Showcase = () => {
  return (
    <section className="py-24 px-6 lg:px-12 bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
          Nos Réalisations
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Découvrez tous les projets que nous avons réalisés pour nos clients sur notre portfolio.
        </p>
        <a
          href="https://portfolio.mce-pro.agency/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#0A6EBD] hover:bg-[#0A1F44] text-white font-semibold px-10 py-4 rounded-2xl text-lg shadow-lg transition-all duration-300 hover:scale-105"
        >
          Voir notre portfolio
          <ExternalLink className="w-5 h-5" />
        </a>
      </div>
    </section>
  );
};
