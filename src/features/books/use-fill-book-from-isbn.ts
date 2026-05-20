// Rellena el borrador de nuevo libro con metadatos obtenidos por ISBN.
import { useCallback } from "react";

import type { BookMetadataFromIsbn } from "@/shared/lib/lookup-book-by-isbn";
import { useNewBookDraftStore } from "@store/new-book-draft";

export function useFillBookFromIsbn() {
  const setTitle = useNewBookDraftStore((s) => s.setTitle);
  const setAuthor = useNewBookDraftStore((s) => s.setAuthor);
  const setPages = useNewBookDraftStore((s) => s.setPages);
  const setPublishedYear = useNewBookDraftStore((s) => s.setPublishedYear);
  const setGenre = useNewBookDraftStore((s) => s.setGenre);
  const setPublisher = useNewBookDraftStore((s) => s.setPublisher);
  const setDescription = useNewBookDraftStore((s) => s.setDescription);
  const setCoverOptions = useNewBookDraftStore((s) => s.setCoverOptions);
  const setSelectedCoverUrl = useNewBookDraftStore((s) => s.setSelectedCoverUrl);

  return useCallback(
    (metadata: BookMetadataFromIsbn) => {
      setTitle(metadata.title);
      setAuthor(metadata.author);
      setPages(metadata.pages);
      setPublishedYear(metadata.publishedYear);
      setGenre(metadata.genre);
      setPublisher(metadata.publisher);
      setDescription(metadata.description);
      if (metadata.coverUrls.length > 0) {
        setCoverOptions(metadata.coverUrls);
        setSelectedCoverUrl(metadata.coverUrls[0]);
      }
    },
    [
      setAuthor,
      setCoverOptions,
      setDescription,
      setGenre,
      setPages,
      setPublishedYear,
      setPublisher,
      setSelectedCoverUrl,
      setTitle,
    ],
  );
}
