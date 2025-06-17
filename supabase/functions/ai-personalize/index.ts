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

interface PersonalizeRequest {
  template_text: string
  prospect_data: {
    name?: string
    company?: string
    title?: string
    industry?: string
    pain_point?: string
    recent_news?: string
    mutual_connection?: string
    [key: string]: any
  }
  personalization_type: 'opener' | 'subject_line' | 'full_email'
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
      template_text, 
      prospect_data, 
      personalization_type 
    }: PersonalizeRequest = await req.json()

    if (!template_text || template_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Template text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create personalization context
    const prospectContext = Object.entries(prospect_data)
      .filter(([_, value]) => value && value.toString().trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')

    const prompts = {
      opener: `Create a personalized email opener using the prospect information below. Make it natural, relevant, and engaging.

Prospect Information:
${prospectContext}

Template/Context: "${template_text}"

Requirements:
- Reference specific information about the prospect
- Sound natural and conversational
- Create genuine connection
- Avoid being overly familiar
- Keep it concise (1-2 sentences)

Return only the personalized opener, nothing else.`,

      subject_line: `Create a personalized email subject line using the prospect information below.

Prospect Information:  
${prospectContext}

Context: "${template_text}"

Requirements:
- Grab attention without being clickbait
- Reference prospect-specific information
- Professional and intriguing
- Under 50 characters if possible
- Avoid spam trigger words

Return only the subject line, nothing else.`,

      full_email: `Personalize this entire email template using the prospect information below.

Prospect Information:
${prospectContext}

Email Template: "${template_text}"

Requirements:
- Weave prospect information naturally throughout
- Maintain the email's structure and flow
- Make it feel personally written
- Keep professional tone
- Ensure all placeholder data is replaced

Return only the personalized email, nothing else.`
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
            content: 'You are Wordwise, an expert sales communication assistant. Create natural, professional, and effective personalized content.'
          },
          {
            role: 'user',
            content: prompts[personalization_type]
          }
        ],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    const personalizedContent = openaiData.choices[0]?.message?.content?.trim()

    if (!personalizedContent) {
      throw new Error('No response from OpenAI')
    }

    return new Response(
      JSON.stringify({ 
        original_template: template_text,
        personalized_content: personalizedContent,
        personalization_type,
        prospect_data_used: Object.keys(prospect_data).filter(key => prospect_data[key]),
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/ai-personalize' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
