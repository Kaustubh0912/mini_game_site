
export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  featured?: boolean;
  totalPlays?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  rating?: number;
  createdAt: Date;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: Date;
  category?: string;
  readTime?: string;
}

export interface HomePageProps {
  featuredGames: Game[];
  popularGames: Game[];
  recentNews: NewsItem[];
}
