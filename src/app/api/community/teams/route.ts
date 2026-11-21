import { NextResponse } from 'next/server';
import { getAllTeams, createGuild, toggleFollowGuild } from '@/lib/communityDb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user') || '';
    const followedOnly = searchParams.get('followedOnly') === 'true';

    const allGuilds = getAllTeams();

    const guildsWithFollowState = allGuilds.map(guild => {
      const followers = Array.isArray(guild.followers) ? guild.followers : [];
      const isFollowed = user ? followers.includes(user) : false;
      return {
        ...guild,
        isFollowed,
        followers
      };
    });

    const result = followedOnly
      ? guildsWithFollowState.filter(g => g.isFollowed)
      : guildsWithFollowState;

    const followedGuildIds = user
      ? guildsWithFollowState.filter(g => g.isFollowed).map(g => g.id)
      : [];

    return NextResponse.json({
      success: true,
      teams: result,
      allTeams: guildsWithFollowState,
      followedGuildIds
    });
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch clubs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'toggle_follow') {
      const { guildId, userId } = body;
      if (!guildId || !userId) {
        return NextResponse.json({ success: false, error: 'guildId and userId are required' }, { status: 400 });
      }

      const { guild, isFollowing } = toggleFollowGuild(guildId, userId);
      if (!guild) {
        return NextResponse.json({ success: false, error: 'Club not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        guild,
        isFollowing
      });
    }

    // Build / Create Club
    const { name, description, avatarUrl, category, creatorId, creatorName } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Club name is required' }, { status: 400 });
    }

    const newGuild = createGuild({
      name: name.trim(),
      description,
      avatarUrl,
      category,
      creatorId: creatorId || 'usr_anonymous',
      creatorName: creatorName || 'Club Leader'
    });

    return NextResponse.json({
      success: true,
      guild: {
        ...newGuild,
        isFollowed: true
      }
    });
  } catch (error) {
    console.error('Error in clubs POST:', error);
    return NextResponse.json({ success: false, error: 'Failed to process club request' }, { status: 500 });
  }
}
