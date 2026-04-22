// supabase/functions/send-password-reset/index.ts
// 
// Edge Function Supabase : permet au superadmin d'envoyer un lien
// de réinitialisation de mot de passe à un utilisateur.
//
// DÉPLOIEMENT :
//   supabase functions deploy send-password-reset
//
// APPEL côté frontend :
//   const { data, error } = await supabase.functions.invoke('send-password-reset', {
//     body: { email: 'user@example.com' }
//   });

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Gérer le preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Vérifier que l'utilisateur appelant est authentifié
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token d\'authentification manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Créer un client Supabase avec le token de l'utilisateur appelant
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // 3. Récupérer l'utilisateur appelant
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Vérifier que l'utilisateur est superadmin
    const { data: profile, error: profileError } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profil introuvable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'Accès refusé. Seul le superadmin peut effectuer cette action.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Récupérer l'email cible depuis le body
    const { email } = await req.json()
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'L\'email de l\'utilisateur cible est requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Utiliser le client admin (service_role) pour générer le lien
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.vercel.app')}/reset-password`,
        // ↑ Adapte cette URL à ton domaine frontend
      },
    })

    if (linkError) {
      return new Response(
        JSON.stringify({ error: `Erreur lors de la génération du lien: ${linkError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Succès — retourner le lien (Supabase envoie aussi l'email automatiquement)
    return new Response(
      JSON.stringify({
        success: true,
        message: `Lien de réinitialisation envoyé à ${email}`,
        // Le lien est aussi disponible dans linkData.properties.action_link
        // si tu veux l'envoyer manuellement via un autre canal
        action_link: linkData.properties?.action_link,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Erreur inattendue: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})