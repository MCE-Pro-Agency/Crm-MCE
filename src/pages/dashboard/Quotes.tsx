import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge, QuoteStatus } from "@/components/shared/StatusBadge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  FileText,
  Eye,
  Send,
  Download,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Interfaces
interface QuoteItem {
  id: string;
  quote_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  subtotal: number;
}

interface Quote {
  id: string;
  number: string;
  client_id: string;
  client_name: string;
  created_at: string;
  expiration_date: string;
  status: QuoteStatus;
  description?: string;
  terms?: string;
  internal_notes?: string;
  total_amount: number;
  tax_amount: number;
  amount_excluding_tax: number;
  items?: QuoteItem[];
  salesperson_id?: string;
  salesperson_name?: string;
  website_url?: string;
  created_by?: string;
}

const Quotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewQuoteDialog, setShowNewQuoteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newQuote, setNewQuote] = useState({
    number: "",
    client_name: "",
    expiration_date: "",
    status: "draft" as QuoteStatus,
    country: "",
  });
  const [newItem, setNewItem] = useState({
    product_name: "",
    quantity: 1,
    unit_price: 0,
    tax_rate: 0,
  });

  // Charger les devis depuis Supabase au chargement du composant ou lors du filtrage pays
  useEffect(() => {
    const fetchQuotes = async () => {
      setIsLoading(true);
      let query = supabase.from("quotes").select("*").order("created_at", { ascending: false });
      if (countryFilter) {
        query = query.eq("country", countryFilter);
      }
      const { data, error } = await query;
      if (error) {
        toast.error("Erreur lors du chargement des devis");
      } else {
        setQuotes(data || []);
      }
      setIsLoading(false);
    };
    fetchQuotes();
  }, [countryFilter]);

  // Filtrer les devis par recherche texte
  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.number.toLowerCase().includes(search.toLowerCase()) ||
      quote.client_name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Créer un nouveau devis (Supabase)
  const handleCreateQuote = async () => {
    if (!newQuote.number || !newQuote.client_name) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    const quoteToInsert = {
      number: newQuote.number,
      client_name: newQuote.client_name,
      client_id: Math.random().toString(),
      created_at: new Date().toISOString(),
      expiration_date: newQuote.expiration_date,
      status: newQuote.status,
      total_amount: 0,
      tax_amount: 0,
      amount_excluding_tax: 0,
      salesperson_name: "MCE",
      website_url: "",
    };

    setIsLoading(true);
    const { data, error } = await supabase.from("quotes").insert([quoteToInsert]).select();
    setIsLoading(false);
    if (error) {
      toast.error("Erreur lors de la création du devis");
      return;
    }
    if (data && data[0]) {
      setQuotes([data[0], ...quotes]);
      setSelectedQuote(data[0]);
      setShowNewQuoteDialog(false);
      setNewQuote({ number: "", client_name: "", expiration_date: "", status: "draft", country: "" });
      toast.success("Devis créé avec succès");
    }
  };

  // Modifier un devis (Supabase)
  const handleUpdateQuote = async (updatedQuote: Quote) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("quotes")
      .update(updatedQuote)
      .eq("id", updatedQuote.id)
      .select();
    setIsLoading(false);
    if (error) {
      toast.error("Erreur lors de la modification du devis");
      return;
    }
    if (data && data[0]) {
      setQuotes(quotes.map((q) => (q.id === updatedQuote.id ? data[0] : q)));
      setSelectedQuote(data[0]);
      toast.success("Devis modifié avec succès");
    }
  };

  // Ajouter un article au devis
  const handleAddItem = () => {
    if (!selectedQuote || !newItem.product_name || newItem.unit_price <= 0) {
      toast.error("Veuillez remplir tous les champs correctement");
      return;
    }

    const subtotal = newItem.quantity * newItem.unit_price;
    const tax = subtotal * (newItem.tax_rate / 100);
    const item: QuoteItem = {
      id: Math.random().toString(),
      quote_id: selectedQuote.id,
      product_name: newItem.product_name,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      tax_rate: newItem.tax_rate,
      subtotal: subtotal + tax,
    };

    const updatedItems = [...(selectedQuote.items || []), item];
    const totalAmount = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
    const taxAmount = updatedItems.reduce(
      (sum, i) => sum + i.quantity * i.unit_price * (i.tax_rate / 100),
      0
    );

    const updatedQuote = {
      ...selectedQuote,
      items: updatedItems,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      amount_excluding_tax: totalAmount - taxAmount,
    };

    setQuotes(quotes.map((q) => (q.id === selectedQuote.id ? updatedQuote : q)));
    setSelectedQuote(updatedQuote);
    setNewItem({ product_name: "", quantity: 1, unit_price: 0, tax_rate: 0 });
    toast.success("Article ajouté au devis");
  };

  // Supprimer un article
  const handleDeleteItem = (itemId: string) => {
    if (!selectedQuote) return;

    const updatedItems = selectedQuote.items?.filter((i) => i.id !== itemId) || [];
    const totalAmount = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
    const taxAmount = updatedItems.reduce(
      (sum, i) => sum + i.quantity * i.unit_price * (i.tax_rate / 100),
      0
    );

    const updatedQuote = {
      ...selectedQuote,
      items: updatedItems,
      total_amount: totalAmount,
      tax_amount: taxAmount,
      amount_excluding_tax: totalAmount - taxAmount,
    };

    setQuotes(quotes.map((q) => (q.id === selectedQuote.id ? updatedQuote : q)));
    setSelectedQuote(updatedQuote);
    toast.success("Article supprimé");
  };

  // Supprimer un devis (Supabase)
  const handleDeleteQuote = async () => {
    if (!selectedQuote) return;
    setIsLoading(true);
    const { error } = await supabase.from("quotes").delete().eq("id", selectedQuote.id);
    setIsLoading(false);
    if (error) {
      toast.error("Erreur lors de la suppression du devis");
      return;
    }
    setQuotes(quotes.filter((q) => q.id !== selectedQuote.id));
    setSelectedQuote(null);
    setShowDeleteDialog(false);
    toast.success("Devis supprimé");
  };

  // Changer le statut
  const handleStatusChange = (newStatus: QuoteStatus) => {
    if (!selectedQuote) return;

    const updatedQuote = { ...selectedQuote, status: newStatus };
    setQuotes(quotes.map((q) => (q.id === selectedQuote.id ? updatedQuote : q)));
    setSelectedQuote(updatedQuote);
    toast.success(`Statut changé à ${newStatus}`);
  };

  // Colonnes du tableau
  const columns: Column<Quote>[] = [
    {
      key: "number",
      header: "Numéro",
      render: (quote) => (
        <span className="font-semibold text-primary">{quote.number}</span>
      ),
    },
    {
      key: "created_at",
      header: "Date de création",
      render: (quote) => <span className="text-sm">{quote.created_at}</span>,
    },
    {
      key: "client_name",
      header: "Client",
      render: (quote) => <span className="text-sm">{quote.client_name}</span>,
    },
    {
      key: "website_url",
      header: "Site Web",
      render: (quote) => (
        <span className="text-sm text-muted-foreground">
          {quote.website_url || "-"}
        </span>
      ),
    },
    {
      key: "salesperson_name",
      header: "Vendeur",
      render: (quote) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
            {quote.salesperson_name?.charAt(0) || "M"}
          </div>
          <span className="text-sm">{quote.salesperson_name || "MCE"}</span>
        </div>
      ),
    },
    {
      key: "description",
      header: "Activités",
      render: () => (
        <button className="text-muted-foreground hover:text-foreground transition">
          ○
        </button>
      ),
    },
    {
      key: "total_amount",
      header: "Total",
      render: (quote) => (
        <span className="font-semibold">
          {quote.total_amount.toLocaleString("fr-FR")} CFA
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      render: (quote) => <StatusBadge status={quote.status} />,
    },
    {
      key: "actions",
      header: "",
      render: (quote) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedQuote(quote)}>
              <Eye className="w-4 h-4 mr-2" />
              Voir
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="w-4 h-4 mr-2" />
              Télécharger PDF
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="w-4 h-4 mr-2" />
              Envoyer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="grid grid-cols-12 gap-6">
        {/* LISTE DES DEVIS */}
        <div className="col-span-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Gestion des Devis</h1>
              <p className="text-muted-foreground">
                Créez et gérez les devis envoyés aux clients
              </p>
            </div>

            <Dialog open={showNewQuoteDialog} onOpenChange={setShowNewQuoteDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau devis
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau devis</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Numéro du devis</Label>
                    <Input
                      placeholder="Ex: S00977"
                      value={newQuote.number}
                      onChange={(e) =>
                        setNewQuote({ ...newQuote, number: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Client</Label>
                    <Input
                      placeholder="Nom du client"
                      value={newQuote.client_name}
                      onChange={(e) =>
                        setNewQuote({ ...newQuote, client_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Date d'expiration</Label>
                    <Input
                      type="date"
                      value={newQuote.expiration_date}
                      onChange={(e) =>
                        setNewQuote({
                          ...newQuote,
                          expiration_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <Select
                      value={newQuote.status}
                      onValueChange={(value) =>
                        setNewQuote({
                          ...newQuote,
                          status: value as QuoteStatus,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="envoye">Envoyé</SelectItem>
                        <SelectItem value="accepte">Accepté</SelectItem>
                        <SelectItem value="refuse">Refusé</SelectItem>
                        <SelectItem value="expire">Expiré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewQuoteDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleCreateQuote}>Créer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* BARRE DE RECHERCHE */}
          <div className="bg-white border rounded-lg p-4 mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Filtrer par pays..."
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              />
            </div>
          </div>

          {/* TABLEAU DES DEVIS */}
          <DataTable
            columns={columns}
            data={filteredQuotes}
            isLoading={isLoading}
            emptyMessage="Aucun devis trouvé"
            onRowClick={(quote) => setSelectedQuote(quote)}
          />
        </div>

        {/* DÉTAIL DU DEVIS SÉLECTIONNÉ */}
        {selectedQuote && (
          <div className="col-span-full border-t pt-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedQuote.number}</h2>
                  <p className="text-muted-foreground text-sm">
                    {selectedQuote.client_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Send className="w-4 h-4" />
                    Envoyer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleUpdateQuote(selectedQuote)}
                    disabled={isLoading}
                  >
                    Sauvegarder
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="lines">Lignes</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                {/* ONGLET DÉTAILS */}
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Client</Label>
                      <p className="text-sm mt-1">{selectedQuote.client_name}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Date de création</Label>
                      <p className="text-sm mt-1">{selectedQuote.created_at}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Date d'expiration</Label>
                      <p className="text-sm mt-1">{selectedQuote.expiration_date}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Statut</Label>
                      <div className="mt-1">
                        <Select
                          value={selectedQuote.status}
                          onValueChange={handleStatusChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Brouillon</SelectItem>
                            <SelectItem value="envoye">Envoyé</SelectItem>
                            <SelectItem value="accepte">Accepté</SelectItem>
                            <SelectItem value="refuse">Refusé</SelectItem>
                            <SelectItem value="expire">Expiré</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold">Site Web</Label>
                      <p className="text-sm mt-1">
                        {selectedQuote.website_url || "-"}
                      </p>
                    </div>
                    <div>
                      <Label className="font-semibold">Vendeur</Label>
                      <p className="text-sm mt-1">
                        {selectedQuote.salesperson_name || "MCE"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Description</Label>
                    <Textarea
                      placeholder="Description du devis..."
                      value={selectedQuote.description || ""}
                      onChange={(e) =>
                        setSelectedQuote({
                          ...selectedQuote,
                          description: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                {/* ONGLET LIGNES */}
                <TabsContent value="lines" className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Produit</th>
                          <th className="px-4 py-2 text-center">Quantité</th>
                          <th className="px-4 py-2 text-right">Prix unitaire</th>
                          <th className="px-4 py-2 text-right">Taxes</th>
                          <th className="px-4 py-2 text-right">Montant</th>
                          <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedQuote.items?.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="px-4 py-2">{item.product_name}</td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">
                              {item.unit_price.toLocaleString("fr-FR")} CFA
                            </td>
                            <td className="px-4 py-2 text-right">{item.tax_rate}%</td>
                            <td className="px-4 py-2 text-right font-semibold">
                              {item.subtotal.toLocaleString("fr-FR")} CFA
                            </td>
                            <td className="px-4 py-2 text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* AJOUTER UN ARTICLE */}
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <h3 className="font-semibold mb-4">Ajouter un article</h3>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-xs mb-1 block">Produit</Label>
                        <Input
                          placeholder="Nom produit"
                          value={newItem.product_name}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              product_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Quantité</Label>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={newItem.quantity}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          min="1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Prix unitaire</Label>
                        <Input
                          type="number"
                          placeholder="Prix"
                          value={newItem.unit_price}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              unit_price: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Taxes %</Label>
                        <Input
                          type="number"
                          placeholder="Taxes"
                          value={newItem.tax_rate}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              tax_rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddItem} className="w-full gap-2">
                      <Plus className="w-4 h-4" />
                      Ajouter l'article
                    </Button>
                  </div>

                  {/* RÉSUMÉ FINANCIER */}
                  <div className="bg-slate-50 border rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Montant HT:</span>
                        <span className="font-semibold">
                          {selectedQuote.amount_excluding_tax.toLocaleString("fr-FR")} CFA
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>TVA:</span>
                        <span className="font-semibold">
                          {selectedQuote.tax_amount.toLocaleString("fr-FR")} CFA
                        </span>
                      </div>
                      <div className="border-t pt-2 flex justify-between text-base font-bold">
                        <span>Total:</span>
                        <span>
                          {selectedQuote.total_amount.toLocaleString("fr-FR")} CFA
                        </span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ONGLET NOTES */}
                <TabsContent value="notes" className="space-y-4">
                  <div>
                    <Label className="font-semibold">Conditions de paiement</Label>
                    <Textarea
                      placeholder="Conditions de paiement..."
                      value={selectedQuote.terms || ""}
                      onChange={(e) =>
                        setSelectedQuote({
                          ...selectedQuote,
                          terms: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">Notes internes</Label>
                    <Textarea
                      placeholder="Notes internes (non visibles au client)..."
                      value={selectedQuote.internal_notes || ""}
                      onChange={(e) =>
                        setSelectedQuote({
                          ...selectedQuote,
                          internal_notes: e.target.value,
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedQuote(null)}
              className="mt-4 gap-2"
            >
              <X className="w-4 h-4" />
              Fermer
            </Button>
          </div>
        )}
      </div>

      {/* DIALOG DE SUPPRESSION */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le devis {selectedQuote?.number} sera
            définitivement supprimé.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Quotes;