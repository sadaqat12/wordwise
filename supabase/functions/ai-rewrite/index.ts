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

interface RewriteRequest {
  text: string
  rewrite_type: 'tone' | 'tighten' | 'cta' | 'brand'
  persona?: 'general' | 'sales'
  brand_voice?: string
  target_tone?: string
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
      text, 
      rewrite_type, 
      persona = 'general', 
      brand_voice = '',
      target_tone = 'professional'
    }: RewriteRequest = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create rewrite-specific prompts
    const prompts = {
      tone: `Rewrite the following text to match a ${target_tone} tone${brand_voice ? ` and brand voice: ${brand_voice}` : ''}:

"${text}"

Return only the rewritten text, nothing else.`,

      tighten: `Make this text more concise and impactful while preserving the core message${persona === 'sales' ? ' for sales context' : ''}:

"${text}"

Focus on:
- Removing unnecessary words
- Making every sentence count
- Maintaining clarity and impact

Return only the tightened text, nothing else.`,

      cta: `Rewrite this call-to-action to be more compelling and action-oriented:

"${text}"

Make it:
- Clear and specific
- Urgent but not pushy
- Focused on value to the reader
- Easy to act upon

Return only the improved CTA, nothing else.`,

      brand: `Rewrite this text to match the following brand voice: ${brand_voice}

Original text: "${text}"

Ensure the rewrite:
- Maintains the core message
- Reflects the brand personality
- Uses appropriate tone and language
- Stays authentic to the brand

Return only the brand-aligned text, nothing else.`
    }

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
            content: 'You are Wordwise, an expert writing assistant. Follow instructions precisely and return only the requested rewritten text.'
          },
          {
            role: 'user',
            content: prompts[rewrite_type]
          }
        ],
        temperature: 0.4,
        max_tokens: 1000,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const rewrittenText = openaiData.choices[0]?.message?.content?.trim()

    if (!rewrittenText) {
      throw new Error('No response from OpenAI')
    }

    return new Response(
      JSON.stringify({ 
        original: text,
        rewritten: rewrittenText,
        rewrite_type,
        persona,
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-rewrite' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
