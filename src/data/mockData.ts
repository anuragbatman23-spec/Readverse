import { Book, RewardItem, Post } from '../types';

export const MOCK_BOOKS: Book[] = [
  {
    id: 'solo-sovereign',
    title: 'Solo Leveling',
    author: 'Chugong / DUBU',
    category: 'manhwa',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg',
    description: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jin-Woo, the weakest hunter of all mankind, finds himself in a fatal dungeon.',
    genre: ['Action', 'Fantasy', 'Supernatural'],
    rating: 4.9,
    pointsPerChapter: 1.5,
    chapters: []
  },
  {
    id: 'a1c7c817-4e59-43b7-9365-09675a149a6f',
    title: 'One Piece',
    author: 'Eiichiro Oda',
    category: 'manga',
    coverImage: 'https://uploads.mangadex.org/covers/a1c7c817-4e59-43b7-9365-09675a149a6f/2f4aca53-64c7-46ac-ae85-3bc9b3169890.png.512.jpg',
    description: 'Gol D. Roger, the King of the Pirates, left the ultimate treasure in the world: One Piece. Monkey D. Luffy sets out with his Straw Hat Crew across the Grand Line.',
    genre: ['Shounen', 'Adventure', 'Fantasy'],
    rating: 4.98,
    pointsPerChapter: 1.0,
    chapters: []
  },
  {
    id: 'the-time-machine',
    title: 'The Time Machine',
    author: 'H. G. Wells',
    category: 'book',
    coverImage: 'https://covers.openlibrary.org/b/id/9009316-L.jpg',
    description: 'The Time Traveller, a Victorian English scientist and gentleman inventor living in Richmond, Surrey, invents a machine that can travel through the fourth dimension: time.',
    genre: ['Classic', 'Sci-Fi', 'Public Domain'],
    rating: 4.7,
    pointsPerChapter: 2.0,
    wordCountPerPoint: 1500,
    chapters: [
      {
        id: 'tm-ch-1',
        title: 'Chapter I: The Fourth Dimension',
        chapterNumber: 1,
        wordCount: 2100,
        content: [
          'The Time Traveller (for so it will be convenient to speak of him) was expounding a recondite matter to us. His grey eyes shone and twinkled, and his usually pale face was flushed and animated.',
          'The fire burnt brightly, and the soft radiance of the incandescent lights in the lilies of silver caught the bubbles that flashed and passed in our glasses. Our chairs, being his patents, embraced and caressed us rather than submitted to be sat upon, and there was that luxurious after-dinner atmosphere when thought roams gracefully free of the trammels of precision.',
          '"You must follow me carefully. I shall have to controvert one or two ideas that are almost universally accepted. The geometry, for instance, they taught you at school is founded on a misconception."',
          '"Is not that rather a large thing to expect us to begin upon?" said Filby, an argumentative person with red hair.',
          '"I do not mean to ask you to accept anything without reasonable ground for it. You will soon admit as much as I need from you. You know of course that a mathematical line, a line of thickness nil, has no real existence. They taught you that? Neither has a mathematical plane. These things are mere abstractions."',
          '"That is all right," said the Psychologist.',
          '"Nor, having only length, breadth, and thickness, can a cube have a real existence."',
          '"There I object," said Filby. "Of course a solid body may exist. All real things—"',
          '"So most people think. But wait a moment. Can an instantaneous cube exist?"',
          '"Don’t follow you," said Filby.',
          '"Can a cube that does not exist for any time at all, have a real existence?"',
          'Filby became pensive. "Clearly," the Time Traveller proceeded, "any real body must have extension in four directions: it must have Length, Breadth, Thickness, and—Duration. But through a natural infirmity of the flesh, which I will explain to you in a moment, we incline to overlook this fact. There are really four dimensions, three which we call the three planes of Space, and a fourth, Time."'
        ]
      }
    ]
  }
];

export const MOCK_REWARDS: RewardItem[] = [
  {
    id: 'rew-hoodie',
    name: 'Embroidered Reader Heavyweight Hoodie',
    category: 'clothing',
    pointsCost: 11000,
    cashPointsCost: 3500,
    cashCoPay: 24.99,
    description: 'Custom heavyweight 450gsm organic cotton hoodie featuring embroidered minimalist manga typography on the back and glowing chest emblem.',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
    badge: 'Popular',
    isPhysical: true,
    rating: 4.95
  },
  {
    id: 'rew-bookmark',
    name: 'Laser-Etched Brass Katana Bookmark',
    category: 'decor',
    pointsCost: 1200,
    cashPointsCost: 400,
    cashCoPay: 4.99,
    description: 'Precision laser-cut vintage brass metal bookmark inspired by classic samurai manga. High durability and velvet tassel.',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80',
    badge: 'Fast Delivery',
    isPhysical: true,
    rating: 4.88
  },
  {
    id: 'rew-totebag',
    name: 'Canvas "One More Chapter" Tote Bag',
    category: 'decor',
    pointsCost: 4000,
    cashPointsCost: 1500,
    cashCoPay: 9.99,
    description: '100% thick canvas tote bag designed specifically for bookworms, carrying your manga volumes, tablet, and daily essentials.',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    badge: 'Eco-Friendly',
    isPhysical: true,
    rating: 4.9
  },
  {
    id: 'rew-hardcover',
    name: 'Collector Hardcover: The Time Machine (Gold Foil)',
    category: 'book',
    pointsCost: 5000,
    cashPointsCost: 2000,
    cashCoPay: 12.99,
    description: 'Luxury clothbound edition with gold foil embossing, ribbon bookmark, and archival acid-free paper.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    badge: 'Limited Run',
    isPhysical: true,
    rating: 5.0
  },
  {
    id: 'rew-cyberpunk-theme',
    name: 'Neon Cyberpunk Reader Theme Pack',
    category: 'digital',
    pointsCost: 200,
    cashPointsCost: 0,
    cashCoPay: 0,
    description: 'Unlock aesthetic neon synthwave color palettes, glowing text outlines, and futuristic UI accents in the reader.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    badge: 'Instant Digital',
    isPhysical: false,
    rating: 4.75
  },
  {
    id: 'rew-s-rank-badge',
    name: 'S-Rank Hunter Profile Title & Animated Frame',
    category: 'digital',
    pointsCost: 500,
    cashPointsCost: 0,
    cashCoPay: 0,
    description: 'Equip an animated purple shadow flame border around your avatar and unlock the exclusive "S-Rank Sovereign" title across the social feed.',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    badge: 'Social Flex',
    isPhysical: false,
    rating: 4.9
  }
];

export const MOCK_POSTS: Post[] = [
  {
    id: 'post-1',
    userId: 'user-kai',
    userName: 'KaiReads',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    userTitle: 'S-Rank Reader 🔥',
    bookTitle: 'Shadow Slave',
    bookCategory: 'webnovel',
    chapterNumber: 1,
    content: 'Just started Chapter 1 and this line gave me chills! The pacing is unmatched. Sunny is already one of the most relatable protagonists.',
    type: 'quote',
    quoteText: '"Sunny scoffed under his breath... Down here, survival wasn’t a civil right—it was an hourly negotiation with hunger and gravity."',
    likes: 42,
    commentsCount: 9,
    createdAt: '2 hours ago'
  },
  {
    id: 'post-2',
    userId: 'user-mira',
    userName: 'MiraManga',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    userTitle: 'Archivist 📚',
    bookTitle: 'Solo Leveling',
    bookCategory: 'manhwa',
    chapterNumber: 2,
    content: 'The art in the double dungeon entrance is insane. Major spoilers for the statue smile if you haven\'t read yet!',
    type: 'panel',
    mediaUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=900&auto=format&fit=crop&q=80',
    isSpoiler: true,
    spoilerChapter: 2,
    likes: 128,
    commentsCount: 31,
    createdAt: '5 hours ago'
  },
  {
    id: 'post-3',
    userId: 'user-zen',
    userName: 'Zenith',
    userAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    userTitle: 'Night Owl 🦉',
    bookTitle: 'The Time Machine',
    bookCategory: 'book',
    chapterNumber: 1,
    content: 'Unlocked my 2x booster this afternoon and knocked out 15 chapters! Already at 1,850 points towards the laser-cut brass bookmark! 🚀',
    type: 'milestone',
    mediaUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=80',
    likes: 87,
    commentsCount: 14,
    createdAt: 'Yesterday'
  }
];
