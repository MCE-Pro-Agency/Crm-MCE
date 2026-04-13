import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProjectStatus } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  Check,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Info,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
  Users,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// --- INTERFACES ---
interface Profile { id: string; first_name: string; last_name: string; role: string; }
interface Client { id: string; first_name: string; last_name: string; company: string; status: string; }

// Composant local pour le badge si vous ne voulez pas utiliser le shared partout
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    "en_cours": "bg-blue-50 text-blue-600 border-blue-100",
    "termine": "bg-green-50 text-green-600 border-green-100",
    "en_attente": "bg-amber-50 text-amber-600 border-amber-100",
    "annule": "bg-red-50 text-red-600 border-red-100",
  };
  const label: Record<string, string> = {
    "en_cours": "En cours",
    "termine": "Terminé",
    "en_attente": "En attente",
    "annule": "Annulé"
  };
  return (
    <Badge variant="outline" className={`${styles[status] || styles["en_cours"]} border font-medium`}>
      {label[status] || status}
    </Badge>
  );
};

export default function Collaboration() {
  const { profile: currentUser } = useProfile();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // États pour les fenêtres (Modals)
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // États du formulaire (copiés de Projects.tsx)
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [confirmedClients, setConfirmedClients] = useState<Client[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    client_name: "",
    deadline: "",
    created_at: new Date().toISOString().split('T')[0],
    status: "en_attente" as ProjectStatus,
    real_delivery_date: "",
    description: "",
    performance_comments: "",
    country: "Sénégal",
    progress: 0
  });

  useEffect(() => {
    if (currentUser) {
      fetchCollaboratedProjects();
      fetchAuxiliaryData();
    }
  }, [currentUser]);

  const fetchAuxiliaryData = async () => {
    const { data: profs } = await supabase.from('profiles').select('*');
    if (profs) setAvailableProfiles(profs);

    const { data: cls } = await supabase.from('clients').select('*').ilike('status', 'confirmé');
    if (cls) setConfirmedClients(cls);
  };

  const fetchCollaboratedProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner (profile_id),
          all_members:project_members (
            profile_id,
            profiles (first_name, last_name)
          )
        `)
        .eq('project_members.profile_id', currentUser?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map(proj => ({
        ...proj,
        project_members: proj.all_members
      }));

      setProjects(formatted || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleEdit = (project: any) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      client_name: project.client_name,
      deadline: project.deadline,
      created_at: project.created_at.split('T')[0],
      status: project.status,
      real_delivery_date: project.real_delivery_date || "",
      description: project.description || "",
      performance_comments: project.performance_comments || "",
      country: project.country,
      progress: project.progress || 0
    });

    const memberIds = project.project_members?.map((m: any) => m.profile_id) || [];
    setSelectedMemberIds(memberIds);

    if (project.client_id) {
      setSelectedClientId(project.client_id);
      setIsManualEntry(false);
    } else {
      setIsManualEntry(true);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const newFileUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const folderName = formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        for (const file of selectedFiles) {
          const filePath = `${folderName}/${Date.now()}-${file.name}`;
          await supabase.storage.from('project-files').upload(filePath, file);
          const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(filePath);
          newFileUrls.push(publicUrl);
        }
      }

      const finalClientName = isManualEntry 
        ? formData.client_name 
        : confirmedClients.find(c => c.id === selectedClientId)
          ? `${confirmedClients.find(c => c.id === selectedClientId)?.first_name} ${confirmedClients.find(c => c.id === selectedClientId)?.last_name}`
          : formData.client_name;

      const payload = {
        ...formData,
        client_name: finalClientName,
        client_id: isManualEntry ? null : selectedClientId,
        attachments: selectedProject ? [...(selectedProject.attachments || []), ...newFileUrls] : newFileUrls,
      };

      const { error: uError } = await supabase.from('projects').update(payload).eq('id', selectedProject.id);
      if (uError) throw uError;

      // Gestion des membres et notifications (logique identique à Projects.tsx)
      const oldMemberIds = selectedProject.project_members?.map((m: any) => m.profile_id) || [];
      await supabase.from('project_members').delete().eq('project_id', selectedProject.id);
      if (selectedMemberIds.length > 0) {
        const membersData = selectedMemberIds.map(id => ({ project_id: selectedProject.id, profile_id: id }));
        await supabase.from('project_members').insert(membersData);
      }

      // Notifications
      const notifications: any[] = [];
      selectedMemberIds.filter(id => !oldMemberIds.includes(id)).forEach(id => {
        if (id !== currentUser?.id) notifications.push({ profile_id: id, title: "🚀 Nouveau projet", message: `Ajouté au projet : ${formData.name}`, project_id: selectedProject.id });
      });
      // ... (Autres types de notifications si besoin)
      if (notifications.length > 0) await supabase.from('notifications').insert(notifications);

      toast.success("Projet mis à jour !");
      setIsDialogOpen(false);
      fetchCollaboratedProjects();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Collaboration</h1>
          <p className="text-muted-foreground">Projets sur lesquels vous travaillez en équipe.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10 bg-white" placeholder="Rechercher un projet..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id}
                project={project}
                onViewDetails={() => { setSelectedProject(project); setIsDetailsOpen(true); }}
                onEdit={() => handleEdit(project)}
                onDelete={() => {}} 
                canEdit={true}
                canDelete={project.created_by === currentUser?.id}
              />
            ))}
          </div>
        )}

        {/* DIALOG DE MODIFICATION (Pareil à Projects.tsx) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Modifier : {selectedProject?.name}</DialogTitle></DialogHeader>
            <div className="flex gap-2 p-1 bg-muted rounded-md mb-4">
              <Button variant={!isManualEntry ? "secondary" : "ghost"} className="flex-1 text-xs" onClick={() => setIsManualEntry(false)}>Lier Client</Button>
              <Button variant={isManualEntry ? "secondary" : "ghost"} className="flex-1 text-xs" onClick={() => setIsManualEntry(true)}>Manuel</Button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nom du projet</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Pays du projet</Label>
                <Select value={formData.country} onValueChange={v => setFormData({...formData, country: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sénégal">Sénégal</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                    <SelectItem value="Maroc">Maroc</SelectItem>
                    <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 space-y-2">
                <Label>{isManualEntry ? "Client" : "Client lié"}</Label>
                {isManualEntry ? (
                  <Input required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} />
                ) : (
                  <Select onValueChange={setSelectedClientId} value={selectedClientId}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>
                      {confirmedClients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Deadline (Prévue)</Label>
                <Input type="date" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Statut actuel</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_attente">En attente</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="termine">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Membres de l'équipe (Logique Popover/Command) */}
              <div className="col-span-2 space-y-2">
                <Label>Membres de l'équipe</Label>
                <div className="flex flex-col gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-11" type="button">
                        <div className="flex items-center gap-2"><Users className="w-4 h-4" /> {selectedMemberIds.length} membre(s) sélectionné(s)</div>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Chercher un membre..." />
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {availableProfiles.map((p) => (
                            <CommandItem key={p.id} onSelect={() => toggleMember(p.id)}>
                              <Check className={`mr-2 h-4 w-4 ${selectedMemberIds.includes(p.id) ? "opacity-100" : "opacity-0"}`} />
                              {p.first_name} {p.last_name} ({p.role})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedMemberIds.map(id => {
                      const p = availableProfiles.find(ap => ap.id === id);
                      return p && (
                        <div key={id} className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md text-xs font-medium">
                          {p.first_name} {p.last_name}
                          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => toggleMember(id)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Upload de fichiers */}
              <div className="col-span-2 space-y-2">
                <Label>Ajouter des documents</Label>
                <div className="border-2 border-dashed border-muted rounded-lg p-6 hover:bg-muted/50 transition-all cursor-pointer flex flex-col items-center gap-2" onClick={() => document.getElementById('collab-file-upload')?.click()}>
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Cliquez pour ajouter des fichiers</p>
                  <input type="file" id="collab-file-upload" className="hidden" multiple accept=".pdf,.xlsx,.xls,image/*" onChange={handleFileChange} />
                </div>
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-md text-xs border">
                        <FileText className="w-3 h-3" /> <span className="max-w-[150px] truncate">{file.name}</span>
                        <X className="w-3 h-3 text-destructive cursor-pointer" onClick={() => removeFile(idx)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Description / Besoins</Label>
                <Textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Commentaires de performance</Label>
                <Textarea rows={2} value={formData.performance_comments} onChange={e => setFormData({...formData, performance_comments: e.target.value})} />
              </div>

              <div className="col-span-2 flex justify-end gap-3 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-primary" disabled={uploading}>{uploading ? "Envoi..." : "Enregistrer les modifications"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG DE DÉTAILS (Strictement identique à votre code) */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> Détails du Projet</DialogTitle>
            </DialogHeader>
            {selectedProject && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-muted-foreground">Nom du projet</Label><p className="font-bold">{selectedProject.name}</p></div>
                  <div><Label className="text-muted-foreground">Client</Label><p className="font-bold">{selectedProject.client_name}</p></div>
                  <div><Label className="text-muted-foreground">Pays</Label><p className="flex items-center gap-1 font-bold"><Globe className="w-3 h-3" />{selectedProject.country}</p></div>
                  <div><Label className="text-muted-foreground">Statut</Label><div><StatusBadge status={selectedProject.status} /></div></div>
                  <div><Label className="text-muted-foreground">Date de création</Label><p className="font-medium">{new Date(selectedProject.created_at).toLocaleDateString()}</p></div>
                  <div><Label className="text-muted-foreground">Deadline prévue</Label><p className="font-medium">{new Date(selectedProject.deadline).toLocaleDateString()}</p></div>
                  <div><Label className="text-muted-foreground">Livraison réelle</Label><p className="font-medium">{selectedProject.real_delivery_date ? new Date(selectedProject.real_delivery_date).toLocaleDateString() : "Non livrée"}</p></div>
                </div>

                {selectedProject.attachments && selectedProject.attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Documents du projet</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedProject.attachments.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2 text-sm font-medium"><FileText className="w-4 h-4 text-primary" /> Document #{i+1}</div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Équipe ({selectedProject.project_members?.length || 0} membres)</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.project_members?.map((m: any, i: number) => (
                      <span key={i} className="bg-secondary px-3 py-1 rounded-full text-xs font-medium">
                        {m.profiles.first_name} {m.profiles.last_name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Description / Cahier des charges</Label>
                  <p className="text-sm border p-3 rounded-md bg-muted/30 whitespace-pre-wrap">{selectedProject.description || "Aucune description"}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Commentaires de performance</Label>
                  <p className="text-sm border p-3 rounded-md bg-muted/30 whitespace-pre-wrap">{selectedProject.performance_comments || "Aucun commentaire"}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// --- PROJECT CARD ---
const ProjectCard = ({ project, onViewDetails, onDelete, onEdit, canEdit, canDelete }: any) => (
  <div className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{project.country}</span>
        </div>
        <h3 className="font-bold text-lg Leadsing-none">{project.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{project.client_name}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!canEdit} onClick={onEdit} className={!canEdit ? "opacity-50" : ""}><Pencil className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
          <DropdownMenuItem disabled={!canDelete} onClick={onDelete} className={!canDelete ? "opacity-50 text-destructive/50" : "text-destructive"}><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <StatusBadge status={project.status} />
        <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(project.deadline).toLocaleDateString()}</div>
      </div>
      <Progress value={project.progress || 0} className="h-1.5" />
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex -space-x-2">
          {project.project_members?.slice(0, 4).map((m: any, i: number) => (
            <div key={i} title={`${m.profiles.first_name} ${m.profiles.last_name}`} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary uppercase">
              {m.profiles.first_name[0]}{m.profiles.last_name[0]}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={onViewDetails} className="h-8 text-xs gap-1"><Eye className="w-3 h-3" /> Détails</Button>
      </div>
    </div>
  </div>
);