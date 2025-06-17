// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("ai-objection function loaded")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ObjectionRequest {
  objection_text: string
  objection_type: 'price' | 'timing' | 'authority' | 'need' | 'competitor' | 'trust' | 'custom'
  original_message?: string
  context?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { 
      objection_text, 
      objection_type, 
      original_message = '',
      context = ''
    }: ObjectionRequest = await req.json()

    if (!objection_text || objection_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Objection text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create objection-specific prompts
    const objectionStrategies = {
      price: 'Focus on value, ROI, and cost of inaction. Acknowledge the concern and reframe around total value.',
      timing: 'Address urgency, opportunity cost, and competitive advantage. Suggest pilot programs or phased approaches.',
      authority: 'Identify decision makers, understand the process, and provide tools to help them sell internally.',
      need: 'Uncover pain points, quantify problems, and demonstrate consequences of status quo.',
      competitor: 'Acknowledge alternatives, differentiate on unique value, and focus on specific benefits.',
      trust: 'Provide social proof, references, guarantees, and reduce perceived risk.',
      custom: 'Address the specific concern with professionalism and empathy.'
    }

    const basePrompt = `You are Wordwise, an expert sales coach. Help craft a professional response to handle this sales objection.

Objection: "${objection_text}"
Objection Type: ${objection_type}
${original_message ? `Original Message Context: "${original_message}"` : ''}
${context ? `Additional Context: "${context}"` : ''}

Strategy: ${objectionStrategies[objection_type]}

Requirements:
- Acknowledge the concern empathetically
- Provide a thoughtful, professional response
- Include specific tactics for this objection type
- Maintain conversational tone
- Focus on moving the conversation forward
- Keep response concise but complete

Return only the objection response, nothing else.`

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
            content: 'You are Wordwise, an expert sales communication assistant. You help sales professionals handle objections with empathy, professionalism, and strategic thinking.'
          },
          {
            role: 'user',
            content: basePrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const objectionResponse = openaiData.choices[0]?.message?.content?.trim()

    if (!objectionResponse) {
      throw new Error('No response from OpenAI')
    }

    return new Response(
      JSON.stringify({ 
        original_objection: objection_text,
        objection_type,
        suggested_response: objectionResponse,
        strategy_used: objectionStrategies[objection_type],
        timestamp: new Date().toISOString()
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-objection' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"objection_text":"This is too expensive","objection_type":"price"}'

*/
