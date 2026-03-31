import { NextResponse } from 'next/server';
import { getFeaturedTools, listToolCategories, listToolDefinitions } from '@/lib/tools';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      categories: listToolCategories(),
      featured: getFeaturedTools(10),
      tools: listToolDefinitions(),
    },
    timestamp: new Date().toISOString(),
  });
}
