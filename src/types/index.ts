export type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

export type AlumniProfile = {
  id: string;
  name: string;
  generation: string;
  department: string;
  faculty: string;
  occupation: string;
  employmentType: string;
  company: string;
  province: string;
  achievement: string;
  bio: string;
  image: string;
  isFeatured: boolean;
};

export type FeedPost = {
  id: string;
  author: string;
  role: string;
  title: string;
  body: string;
  category: "News" | "Announcement" | "Activity" | "Event";
  image?: string;
  likes: number;
  comments: number;
  createdAt: string;
  pinned?: boolean;
};

export type GalleryItem = {
  id: string;
  title: string;
  generation: string;
  year: string;
  album: string;
  image: string;
  tags: string[];
};
