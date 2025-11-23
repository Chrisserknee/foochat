import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const guestSessionId = searchParams.get('guestSessionId');

    console.log('📚 [CHAT HISTORY] Request received:', { userId, guestSessionId });

    if (!userId && !guestSessionId) {
      console.error('❌ [CHAT HISTORY] No userId or guestSessionId provided');
      return NextResponse.json(
        { error: 'User ID or guest session ID required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [CHAT HISTORY] Missing env vars:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get optional limit parameter (default: 100 most recent messages)
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build query based on whether it's a user or guest
    let query = supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      console.log('📚 [CHAT HISTORY] Querying for user:', userId);
      query = query.eq('user_id', userId);
    } else if (guestSessionId) {
      console.log('📚 [CHAT HISTORY] Querying for guest:', guestSessionId);
      query = query.eq('guest_session_id', guestSessionId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('❌ [CHAT HISTORY] Query failed:', error);
      console.error('❌ [CHAT HISTORY] Error code:', error.code);
      console.error('❌ [CHAT HISTORY] Error message:', error.message);
      console.error('❌ [CHAT HISTORY] Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { 
          error: 'Failed to fetch chat history',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    // Reverse to get chronological order (oldest first)
    const sortedMessages = (messages || []).reverse().map((msg: any) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      imageUrl: msg.image_url || undefined,
      audioUrl: msg.audio_url || undefined,
      timestamp: new Date(msg.created_at)
    }));

    const identifier = userId || `guest:${guestSessionId}`;
    console.log(`✅ [CHAT HISTORY] Fetched ${sortedMessages.length} messages for ${identifier}`);

    return NextResponse.json({ messages: sortedMessages });

  } catch (error: any) {
    console.error('❌ [CHAT HISTORY] Unhandled error:', error);
    console.error('❌ [CHAT HISTORY] Error message:', error.message);
    console.error('❌ [CHAT HISTORY] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat history',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

