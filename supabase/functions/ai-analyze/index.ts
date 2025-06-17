// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeRequest {
  text: string
  persona?: 'general' | 'sales'
  document_id?: string
}

interface Suggestion {
  type: 'grammar' | 'style' | 'vocabulary' | 'spelling'
  original: string
  suggestion: string
  confidence: number
  position_start: number
  position_end: number
  persona_tag?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { text, persona = 'general', document_id }: AnalyzeRequest = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create persona-specific prompt
    const basePrompt = `You are Wordwise, an AI writing assistant. Analyze the following text for grammar, spelling, style, and vocabulary improvements.

Instructions:
1. Find specific issues and provide concrete suggestions
2. Focus on clarity, conciseness, and readability
3. Return suggestions as a JSON array
4. Each suggestion should have: type, original, suggestion, confidence (0-1), position_start, position_end

Text to analyze: "${text}"`

    const personaPrompts = {
      general: basePrompt + `\n\nFocus on universal writing quality: grammar, spelling, clarity, and readability.`,
      sales: basePrompt + `\n\nAdditional focus for sales context:
- Conciseness and impact
- Professional tone
- Clear value propositions
- Action-oriented language
- Persuasive structure`
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are Wordwise, an expert writing assistant. Return only valid JSON arrays of suggestions.'
          },
          {
            role: 'user',
            content: personaPrompts[persona]
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const aiResponse = openaiData.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Parse AI response as JSON
    let suggestions: Suggestion[]
    try {
      suggestions = JSON.parse(aiResponse)
      if (!Array.isArray(suggestions)) {
        suggestions = []
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', aiResponse)
      suggestions = []
    }

    // Add persona tags and save to database if document_id provided
    if (document_id && suggestions.length > 0) {
      const suggestionsWithPersona = suggestions.map(s => ({
        ...s,
        persona_tag: persona,
        doc_id: document_id,
      }))

      // Insert suggestions into database
      const { error: insertError } = await supabaseClient
        .from('suggestions')
        .insert(suggestionsWithPersona)

      if (insertError) {
        console.error('Database insert error:', insertError)
        // Continue anyway - don't fail the request for database issues
      }
    }

    return new Response(
      JSON.stringify({ 
        suggestions: suggestions.map(s => ({ ...s, persona_tag: persona })),
        analysis_time: new Date().toISOString(),
        persona_used: persona
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-analyze' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
