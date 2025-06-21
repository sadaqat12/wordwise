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
    const basePrompt = `You are Wordwise, an AI writing assistant. You MUST find and fix writing errors.

CRITICAL REQUIREMENTS:
1. You MUST respond with ONLY a valid JSON array
2. You MUST find obvious spelling errors, grammar mistakes, and style issues
3. Look for common misspellings like "probbly" (probably), "Wht" (What), "recieve" (receive)
4. Find grammar errors like uncapitalized "i", missing punctuation, run-on sentences
5. Identify style issues like informal language in professional contexts

RESPONSE FORMAT (JSON array only):
[
  {
    "type": "spelling",
    "original": "probbly",
    "suggestion": "probably", 
    "confidence": 0.95
  },
  {
    "type": "spelling",
    "original": "Wht",
    "suggestion": "What",
    "confidence": 0.98
  }
]

Valid types: "spelling", "grammar", "style", "vocabulary"

Text to analyze: "${text}"

Find ALL errors and respond with ONLY the JSON array:`

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
            content: 'You are Wordwise, an expert writing assistant. You MUST find writing errors and return only valid JSON arrays of suggestions. Be thorough and find all spelling, grammar, and style issues.'
          },
          {
            role: 'user',
            content: personaPrompts[persona]
          }
        ],
        temperature: 0.1, // Lower temperature for more consistent error detection
        max_tokens: 2000,
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`)
    }

    const openaiData = await openaiResponse.json()
    console.log('OpenAI full response:', JSON.stringify(openaiData, null, 2))
    
    const aiResponse = openaiData.choices[0]?.message?.content
    console.log('Raw AI content:', `"${aiResponse}"`)

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    // Parse AI response as JSON
    let rawSuggestions: any[]
    try {
      console.log('Attempting to parse AI response as JSON...')
      rawSuggestions = JSON.parse(aiResponse)
      console.log('Parsed suggestions:', rawSuggestions)
      
      if (!Array.isArray(rawSuggestions)) {
        console.log('AI response is not an array, converting...')
        rawSuggestions = []
      }
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', e)
      console.error('Raw AI response:', aiResponse)
      
      // Try to extract JSON array from the response if it's wrapped in other text
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          console.log('Trying to extract JSON array from response...')
          rawSuggestions = JSON.parse(jsonMatch[0])
          console.log('Successfully extracted suggestions:', rawSuggestions)
        } else {
          console.log('No JSON array found in response')
          rawSuggestions = []
        }
      } catch (e2) {
        console.error('Failed to extract JSON from response:', e2)
        rawSuggestions = []
      }
    }

    // Calculate accurate positions for each suggestion
    const suggestions: Suggestion[] = rawSuggestions.map(s => {
      const originalText = s.original || ''
      
      // Find all occurrences of this text
      const occurrences: { start: number; end: number }[] = []
      let searchStart = 0
      
      while (searchStart < text.length) {
        const index = text.indexOf(originalText, searchStart)
        if (index === -1) break
        
        occurrences.push({
          start: index,
          end: index + originalText.length
        })
        searchStart = index + 1
      }
      
      // For single character suggestions (like "i"), use context to find the right one
      let bestMatch = occurrences[0] // Default to first occurrence
      
             if (originalText.length <= 2 && occurrences.length > 1) {
         // For short text with multiple occurrences, try to find the best match using context
         for (const occurrence of occurrences) {
           const before = text.charAt(occurrence.start - 1)
           const after = text.charAt(occurrence.end)
           
           // Get more context around this occurrence
           const beforeContext = text.substring(Math.max(0, occurrence.start - 20), occurrence.start)
           const afterContext = text.substring(occurrence.end, Math.min(text.length, occurrence.end + 10))
           
           if (s.type === 'grammar' && originalText.toLowerCase() === 'i') {
             // For standalone "i" that should be capitalized
             const isStandaloneI = (before === ' ' || before === '' || before === '\n') && 
                                  (after === ' ' || after === '' || after === '\n' || after === '.' || after === ',' || after === '!')
             
             if (isStandaloneI) {
               // Look for "i" that appears in contexts where it should be capitalized:
               // 1. After sentence-ending punctuation and space(s)
               // 2. At the beginning of a sentence
               // 3. As a standalone word (not part of another word)
               
               if (beforeContext.match(/[.!?]\s+$/) || // After punctuation + space
                   occurrence.start === 0 || // At very beginning
                   beforeContext.match(/\.\s+[A-Z][^.!?]*\s+$/) || // After a sentence
                   beforeContext.match(/\s+$/) // After whitespace (like "that i must")
                  ) {
                 bestMatch = occurrence
                 console.log(`Found best match for "${originalText}" at position ${occurrence.start}: context "${beforeContext}|${originalText}|${afterContext}"`)
                 break
               }
             }
           }
         }
       }
      
      return {
        type: s.type || 'style',
        original: originalText,
        suggestion: s.suggestion || '',
        confidence: s.confidence || 0.8,
        position_start: bestMatch?.start || 0,
        position_end: bestMatch?.end || originalText.length,
        persona_tag: persona
      }
    }).filter(s => s.original.length > 0) // Remove suggestions with empty original text

    // Add persona tags and save to database if document_id provided
    let dbSuggestions = suggestions
    if (document_id) {
      // First, clean up old pending suggestions for this document to prevent accumulation
      console.log('Cleaning up old pending suggestions for document:', document_id)
      const { error: cleanupError } = await supabaseClient
        .from('suggestions')
        .delete()
        .eq('doc_id', document_id)
        .eq('status', 'pending')

      if (cleanupError) {
        console.error('Error cleaning up old suggestions:', cleanupError)
        // Continue anyway - don't fail the request for cleanup issues
      } else {
        console.log('Successfully cleaned up old pending suggestions')
      }

      // Now insert new suggestions if any
      if (suggestions.length > 0) {
        const suggestionsWithPersona = suggestions.map(s => ({
          ...s,
          persona_tag: persona,
          doc_id: document_id,
        }))

        // Insert suggestions into database and get back the IDs
        const { data: insertedSuggestions, error: insertError } = await supabaseClient
          .from('suggestions')
          .insert(suggestionsWithPersona)
          .select('*')

        if (insertError) {
          console.error('Database insert error:', insertError)
          // Continue anyway - don't fail the request for database issues
        } else if (insertedSuggestions) {
          // Use the database suggestions with their actual IDs
          dbSuggestions = insertedSuggestions
          console.log('Successfully saved suggestions to database with IDs')
        }
      } else {
        console.log('No new suggestions to insert')
        dbSuggestions = []
      }
    }

    return new Response(
      JSON.stringify({ 
        suggestions: dbSuggestions.map(s => ({ ...s, persona_tag: persona })),
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
