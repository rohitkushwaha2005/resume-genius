import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, content, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "generate-summary":
        systemPrompt = `You are a professional resume writer. Generate a compelling professional summary for a resume. 
The summary should be 2-4 sentences, highlight key strengths, and be written in first person implied (no "I" statements). 
Focus on value the person brings to employers. Be specific and avoid generic phrases.`;
        userPrompt = `Generate a professional summary for:
Name: ${context.name || "Professional"}
Current/Target Role: ${context.position}
Key Skills: ${context.skills?.join(", ") || "Not specified"}
Experience Level: ${context.yearsExperience || 0} position(s) listed

Write a compelling 2-4 sentence summary.`;
        break;

      case "improve-experience":
        systemPrompt = `You are a professional resume writer. Improve the given work experience bullet points to be more impactful.
Use action verbs, quantify achievements when possible, and focus on impact and results.
Keep each bullet point concise (under 20 words ideally).
Return ONLY the improved bullet points, one per line, without numbers or bullet characters.`;
        userPrompt = `Improve these experience bullet points for a ${context.position || "professional"} at ${context.company || "a company"}:

${content}

Return the improved version of each bullet point, one per line.`;
        break;

      case "suggest-skills":
        systemPrompt = `You are a career advisor. Suggest relevant technical and soft skills for a resume.
Focus on skills that are in-demand and relevant to the job role.
Return ONLY a JSON object with a "skills" array containing 5-8 skill strings.`;
        userPrompt = `Suggest skills for someone in the role of: ${context.jobRole}
They already have these skills: ${context.existingSkills?.join(", ") || "None listed"}

Suggest 5-8 additional relevant skills they should add. Return as JSON: {"skills": ["skill1", "skill2", ...]}`;
        break;

      default:
        throw new Error("Invalid enhancement type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiContent = data.choices?.[0]?.message?.content || "";

    let result: any = {};

    switch (type) {
      case "generate-summary":
        result = { summary: aiContent.trim() };
        break;

      case "improve-experience":
        result = { improved: aiContent.trim() };
        break;

      case "suggest-skills":
        try {
          // Try to parse JSON from the response
          const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            result = { skills: parsed.skills || [] };
          } else {
            // Fallback: split by newlines or commas
            const skills = aiContent
              .split(/[\n,]/)
              .map((s: string) => s.replace(/^[-•*\d.)\s]+/, "").trim())
              .filter((s: string) => s.length > 0 && s.length < 50);
            result = { skills };
          }
        } catch {
          result = { skills: [] };
        }
        break;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-enhance error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
