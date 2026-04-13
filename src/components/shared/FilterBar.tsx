import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, X } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  selectedCountry: string;
  additionalFilters?: React.ReactNode;
}

export const FilterBar = ({
  searchPlaceholder = "Rechercher par nom, email, téléphone...",
  onSearchChange,
  onCountryChange,
  selectedCountry,
  additionalFilters,
}: FilterBarProps) => {
  const [searchValue, setSearchValue] = useState("");

  // Helper pour afficher le label propre avec drapeau dans les badges
  const getCountryDisplay = (val: string) => {
    const countries: { [key: string]: string } = {
      "Sénégal": "🇸🇳 Sénégal",
      "France": "🇫🇷 France",
      "Maroc": "🇲🇦 Maroc",
      "Côte d'Ivoire": "🇨🇮 Côte d'Ivoire"
    };
    return countries[val] || val;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearchChange(e.target.value);
  };

  const clearSearch = () => {
    setSearchValue("");
    onSearchChange("");
  };

  const clearCountry = () => {
    onCountryChange("all");
  };

  const hasActiveFilters = searchValue || selectedCountry !== "all";

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Barre de recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={handleSearchChange}
            className="pl-10 pr-10 h-11"
          />
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtre Pays - Valeurs synchronisées avec la DB */}
        <Select value={selectedCountry} onValueChange={onCountryChange}>
          <SelectTrigger className="w-full lg:w-56 h-11">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Filtrer par pays" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pays</SelectItem>
            <SelectItem value="Sénégal">
              <div className="flex items-center gap-2">
                <span>🇸🇳</span>
                <span>Sénégal</span>
              </div>
            </SelectItem>
            <SelectItem value="France">
              <div className="flex items-center gap-2">
                <span>🇫🇷</span>
                <span>France</span>
              </div>
            </SelectItem>
            <SelectItem value="Maroc">
              <div className="flex items-center gap-2">
                <span>🇲🇦</span>
                <span>Maroc</span>
              </div>
            </SelectItem>
            <SelectItem value="Côte d'Ivoire">
              <div className="flex items-center gap-2">
                <span>🇨🇮</span>
                <span>Côte d'Ivoire</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Autres filtres injectés (Statuts, etc.) */}
        {additionalFilters}
      </div>

      {/* Affichage des badges de filtres actifs */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap border-t border-border/50 pt-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filtres :</span>
          
          {searchValue && (
            <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1 font-normal">
              Recherche: <span className="font-semibold text-foreground">{searchValue}</span>
              <button 
                onClick={clearSearch}
                className="ml-1 p-0.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {selectedCountry !== "all" && (
            <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1 font-normal">
              Pays: <span className="font-semibold text-foreground">{getCountryDisplay(selectedCountry)}</span>
              <button 
                onClick={clearCountry}
                className="ml-1 p-0.5 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { clearSearch(); clearCountry(); }}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            Réinitialiser
          </Button>
        </div>
      )}
    </div>
  );
};