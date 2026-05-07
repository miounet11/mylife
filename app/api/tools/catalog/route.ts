import { NextResponse } from 'next/server';
import { getFeaturedTools, getPriorityGrowthTools, listToolCategories, listToolDefinitions } from '@/lib/tools';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      categories: listToolCategories(),
      featured: getFeaturedTools(10),
      priorityGrowthTools: getPriorityGrowthTools(),
      tools: listToolDefinitions(),
    },
    timestamp: new Date().toISOString(),
  });
}
