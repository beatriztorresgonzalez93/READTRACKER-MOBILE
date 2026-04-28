export type ReadingSession = {
  id: string;
  userId: string;
  bookId: string;
  title: string;
  author: string;
  previousPage?: number;
  currentPage: number;
  pagesRead: number;
  recordedAt: string;
  createdAt: string;
};

