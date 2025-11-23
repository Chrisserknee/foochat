import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ messagesLeft: 10 }); // Default fallback
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('user_message_counts')
      .select('count, last_message_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Usage fetch error:', error);
      return NextResponse.json({ messagesLeft: 10 });
    }

    // Check if the last message was today
    const lastMessageDate = data?.last_message_at ? 
      new Date(data.last_message_at).toISOString().split('T')[0] : null;
    
    const count = (lastMessageDate === today) ? (data?.count || 0) : 0;
    const messagesLeft = Math.max(0, 10 - count);

    return NextResponse.json({ messagesLeft, count });

  } catch (error: any) {
    console.error('Usage API error:', error);
    return NextResponse.json({ messagesLeft: 10 }); // Default fallback
  }
}






