export interface UserProfile {
  id: string;
  name: string;
  username: string;
  bio: string;
  location: string;
  avatar: string;
  uploadCount: number;
  favoriteCount: number;
  followerCount: number;
}

export interface UserUpload {
  id: string;
  name: string;
  descriptions: string;
  thumb: string;
  panoramicPoints: string[];
  likes: number;
  shares: number;
  favorites: number;
  createdAt: string;
}

export interface FavoriteItem {
  id: string;
  name: string;
  descriptions: string;
  thumb: string;
  panoramicPoints: string[];
}
