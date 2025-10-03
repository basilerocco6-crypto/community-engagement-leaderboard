import { NextRequest, NextResponse } from 'next/server';
import { REWARD_TEMPLATES } from '@/lib/reward-system';

// GET - Fetch reward templates for admin interface
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let templates = Object.values(REWARD_TEMPLATES);

    // Filter by category if specified
    if (category) {
      templates = templates.filter(template => template.category === category);
    }

    return NextResponse.json({
      success: true,
      templates,
      categories: ['discount', 'access', 'content', 'support', 'custom']
    });

  } catch (error) {
    console.error('Error fetching reward templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reward templates' },
      { status: 500 }
    );
  }
}
