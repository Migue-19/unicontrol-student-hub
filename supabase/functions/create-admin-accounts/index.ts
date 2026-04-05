import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Simple secret check
  const { secret } = await req.json().catch(() => ({ secret: "" }));
  if (secret !== serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const admins = [
    {
      email: "admin.ingenierias@uceva.edu.co",
      password: "Admin2026!Ing",
      nombre: "Coordinador Facultad de Ingenierías",
      codigo: "ADMIN-ING-001",
      facultad_id: "f1000000-0000-0000-0000-000000000001",
    },
    {
      email: "admin.economicas@uceva.edu.co",
      password: "Admin2026!Eco",
      nombre: "Coordinador Facultad de Ciencias Económicas",
      codigo: "ADMIN-ECO-001",
      facultad_id: "f1000000-0000-0000-0000-000000000002",
    },
    {
      email: "admin.salud@uceva.edu.co",
      password: "Admin2026!Sal",
      nombre: "Coordinador Facultad de Ciencias de la Salud",
      codigo: "ADMIN-SAL-001",
      facultad_id: "f1000000-0000-0000-0000-000000000003",
    },
    {
      email: "admin.educacion@uceva.edu.co",
      password: "Admin2026!Edu",
      nombre: "Coordinador Facultad de Ciencias de la Educación",
      codigo: "ADMIN-EDU-001",
      facultad_id: "f1000000-0000-0000-0000-000000000004",
    },
    {
      email: "admin.derecho@uceva.edu.co",
      password: "Admin2026!Der",
      nombre: "Coordinador Facultad de Derecho",
      codigo: "ADMIN-DER-001",
      facultad_id: "f1000000-0000-0000-0000-000000000005",
    },
    {
      email: "admin.agropecuarias@uceva.edu.co",
      password: "Admin2026!Agr",
      nombre: "Coordinador Facultad de Ciencias Agropecuarias",
      codigo: "ADMIN-AGR-001",
      facultad_id: "f1000000-0000-0000-0000-000000000006",
    },
  ];

  const results = [];

  for (const admin of admins) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
      });

      if (authError) {
        // User might already exist
        if (authError.message.includes("already been registered")) {
          results.push({ email: admin.email, status: "already_exists" });
          continue;
        }
        results.push({ email: admin.email, status: "error", error: authError.message });
        continue;
      }

      const userId = authData.user.id;

      // Create profile (no carrera_id, no semestre for admins)
      await supabase.from("usuarios").insert({
        id: userId,
        nombre: admin.nombre,
        codigo_estudiantil: admin.codigo,
        carrera_id: null,
        facultad_id: admin.facultad_id,
        semestre_actual: 0,
      });

      // Assign admin role
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });

      results.push({ email: admin.email, status: "created", userId });
    } catch (err) {
      results.push({ email: admin.email, status: "error", error: String(err) });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
