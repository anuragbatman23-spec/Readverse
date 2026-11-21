import { NextResponse } from 'next/server';
import { getAllActivities, addActivity } from '@/lib/communityDb';

export async function GET() {
  try {
    const activities = getAllActivities();
    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userName, userAvatar, actionText, communityName } = body;

    if (!userName || !actionText) {
      return NextResponse.json({ success: false, error: 'userName and actionText are required' }, { status: 400 });
    }

    const newActivity = addActivity({
      userName,
      userAvatar: userAvatar || '/community/avatar-pegasus.jpg',
      actionText,
      communityName: communityName || 'Profile Feed'
    });

    return NextResponse.json({ success: true, activity: newActivity });
  } catch (error) {
    console.error('Error adding activity:', error);
    return NextResponse.json({ success: false, error: 'Failed to create activity' }, { status: 500 });
  }
}
