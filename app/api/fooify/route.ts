import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { FooStyle, STYLE_PRESETS, FREE_ENTITLEMENTS, PRO_ENTITLEMENTS, FooMeEntitlements } from '@/lib/foomeStylePresets';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

export async function POST(request: NextRequest) {
  let tempImagePath: string | null = null;

  try {
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const style = formData.get('style') as FooStyle;
    const variantCountStr = formData.get('variantCount') as string;
    const transparentStr = formData.get('transparent') as string;
    
    // Get authorization header to check user subscription
    const authHeader = request.headers.get('authorization');
    
    // Input validation
    if (!imageFile || !style) {
      return NextResponse.json(
        { error: 'Image and style are required' },
        { status: 400 }
      );
    }

    if (!['photoreal', 'cartoon', 'illustration', 'action-figure'].includes(style)) {
      return NextResponse.json(
        { error: 'Invalid style. Must be one of: photoreal, cartoon, illustration, action-figure' },
        { status: 400 }
      );
    }

    // Check file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image (PNG, JPG, WEBP)' },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Image must be smaller than 10MB' },
        { status: 400 }
      );
    }

    // Determine user entitlements
    let entitlements: FooMeEntitlements = FREE_ENTITLEMENTS;
    let userId: string | null = null;

    if (authHeader) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          userId = user.id;
          // Check if user is pro
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_pro')
            .eq('id', user.id)
            .single();

          if (profile?.is_pro) {
            entitlements = PRO_ENTITLEMENTS;
          }
        }
      } catch (authError) {
        console.warn('⚠️ Auth check failed, using free entitlements:', authError);
      }
    }

    // Parse and validate variant count
    const requestedVariants = variantCountStr ? parseInt(variantCountStr, 10) : 1;
    const variantCount = Math.min(requestedVariants, entitlements.maxVariants);

    // Parse transparent background request
    const transparent = transparentStr === 'true' && entitlements.transparentBackground;

    console.log('🎨 Processing FooMe transformation:', {
      style,
      variantCount,
      transparent,
      resolution: entitlements.resolution,
      watermarked: entitlements.watermarked,
      isPro: entitlements === PRO_ENTITLEMENTS,
      userId
    });

    // Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Save uploaded image to temp file
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'tmp');
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore
    }

    tempImagePath = path.join(tempDir, `upload-${Date.now()}-${Math.random().toString(36).substring(7)}.png`);
    await writeFile(tempImagePath, buffer);

    console.log('💾 Temp image saved:', tempImagePath);

    // Initialize with base style prompt
    let stylePrompt = STYLE_PRESETS[style];

    // Step 1: Analyze the uploaded photo with Vision API to preserve person's features
    console.log('👁️ Analyzing photo with Vision API...');
    
    try {
      // Convert image to base64
      const base64Image = buffer.toString('base64');
      const imageDataUrl = `data:${imageFile.type};base64,${base64Image}`;
      
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini which supports vision
        messages: [{
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analyze this person's physical appearance with extreme precision for art generation. Provide specific details:

1. FACE SHAPE: Describe exact shape (oval, round, square, heart-shaped, diamond, oblong)
2. HAIR: Exact color (be specific like "dark brown with auburn tones"), style, length, texture, parting
3. SKIN TONE: Precise description (fair, light olive, medium tan, deep brown, etc.) and undertones
4. EYES: Color, shape, size, spacing, eyebrow shape and thickness
5. NOSE: Shape, size, bridge characteristics
6. MOUTH: Lip fullness, shape, smile characteristics
7. JAWLINE: Shape, definition, chin characteristics
8. FACIAL HAIR: Exact style, coverage, color if present (or "clean-shaven")
9. DISTINCTIVE FEATURES: Glasses style, accessories, notable marks, expressions
10. AGE & GENDER: Approximate age range and gender presentation
11. BUILD: Visible body type/build if shown
12. CLOTHING VISIBLE: What's visible in the frame

Be EXTREMELY specific with colors and proportions. This will be used to generate art that MUST resemble this specific person.`
            },
            { 
              type: "image_url", 
              image_url: { 
                url: imageDataUrl 
              }
            }
          ]
        }],
        max_tokens: 500,
      });

      const analysis = visionResponse.choices[0]?.message?.content || '';
      console.log('✅ Vision analysis complete');
      console.log('📊 Analysis preview:', analysis.substring(0, 200) + '...');

      // Step 2: Create PRECISION DALL-E prompt emphasizing facial accuracy
      if (analysis) {
        stylePrompt = `Generate a portrait with EXACT FACIAL ACCURACY based on this precise description:

${analysis}

ARTISTIC STYLE TO APPLY:
${STYLE_PRESETS[style]}

CRITICAL RENDERING INSTRUCTIONS:
- The person's face MUST precisely match every detail in the analysis above
- Facial likeness and accuracy is the TOP PRIORITY
- Match face shape, eye color/shape, nose, lips, hair color/style, skin tone EXACTLY
- Apply the artistic style while maintaining perfect facial accuracy
- Centered, professional portrait composition
- ${transparent ? 'Clean, isolated background with subject in focus' : 'Dramatic background appropriate to the style'}
- High quality, sharp details, professional lighting

Remember: Get the face right first, then apply the style. The person must be recognizable.`;
      }

      console.log('📝 Enhanced DALL-E prompt created with detailed facial analysis');

    } catch (visionError: any) {
      console.warn('⚠️ Vision API failed, falling back to basic generation:', visionError.message);
      // stylePrompt already set to basic prompt above
    }

    // Step 3: Generate with DALL-E using enhanced prompts
    console.log(`🎨 Generating ${variantCount} variant(s) with enhanced DALL-E at ${entitlements.resolution}x${entitlements.resolution}...`);

    // Generate variants in parallel
    const imageGenerationPromises = Array.from({ length: variantCount }, async (_, index) => {
      try {
        console.log(`🔄 Generating variant ${index + 1}/${variantCount}...`);

        // Generate with DALL-E using enhanced facial analysis
        console.log(`🔄 Generating variant ${index + 1} with detailed facial prompt...`);
        
        const model = entitlements.resolution === 1024 ? 'dall-e-3' : 'dall-e-2';
        const size = (entitlements.resolution === 1024 ? '1024x1024' : '512x512') as '1024x1024' | '512x512';
        
        const response = await openai.images.generate({
          model: model,
          prompt: stylePrompt,
          n: 1,
          size: size,
          response_format: 'url',
        });

        const resultUrl = response.data?.[0]?.url;

        if (!resultUrl || typeof resultUrl !== 'string') {
          console.error('❌ DALL-E returned invalid URL:', response.data);
          throw new Error('DALL-E returned an invalid image URL.');
        }

        console.log(`✅ Variant ${index + 1} generated successfully`);
        
        console.log(`✅ Variant ${index + 1} - Face-preserved!`);

        return {
          url: resultUrl,
          index
        };

      } catch (err: any) {
        console.error(`❌ Error generating variant ${index + 1}:`, err);
        throw err;
      }
    });

    const results = await Promise.all(imageGenerationPromises);
    const imageUrls = results.map(r => r.url).filter(Boolean) as string[];

    if (imageUrls.length === 0) {
      throw new Error('No images were generated');
    }

    console.log(`✅ Generated ${imageUrls.length} Foo avatar(s)`);

    // Clean up temp file
    if (tempImagePath) {
      try {
        await unlink(tempImagePath);
        console.log('🗑️ Temp file deleted:', tempImagePath);
      } catch (cleanupErr) {
        console.warn('⚠️ Failed to delete temp file:', cleanupErr);
      }
    }

    // Return the generated images with metadata
    return NextResponse.json({
      success: true,
      images: imageUrls,
      metadata: {
        style,
        resolution: entitlements.resolution,
        watermarked: entitlements.watermarked,
        variantCount: imageUrls.length,
        transparent,
        isPro: entitlements === PRO_ENTITLEMENTS
      }
    });

  } catch (error: any) {
    console.error('❌ FooMe transformation error:', error);
    console.error('Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      stack: error?.stack,
      fullError: JSON.stringify(error, null, 2)
    });

    // Clean up temp file on error
    if (tempImagePath) {
      try {
        await unlink(tempImagePath);
      } catch (cleanupErr) {
        console.warn('⚠️ Failed to delete temp file on error:', cleanupErr);
      }
    }

    // More detailed error response for debugging
    let errorMessage = 'Failed to generate Foo avatar';
    if (error?.message?.includes('REPLICATE_API_TOKEN')) {
      errorMessage = 'Replicate API token is not configured properly';
    } else if (error?.message?.includes('authentication')) {
      errorMessage = 'Replicate authentication failed - check your API token';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error?.message || 'Unknown error',
        hint: 'Check server console logs for more details'
      },
      { status: 500 }
    );
  }
}

