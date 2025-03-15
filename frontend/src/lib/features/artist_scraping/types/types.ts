export interface Artist {
  id: string;
  profile?: {
    name: string;
  };
  visuals?: {
    avatarImage?: {
      sources?: Array<{
        url: string;
      }>;
    };
  };
  uri: string;
}
