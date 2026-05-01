// Tests unitarios del repositorio de sesiones (dedupe, permisos y recálculo).
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, releaseMock, connectMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  releaseMock: vi.fn(),
  connectMock: vi.fn()
}));

vi.mock("../src/config/db", () => ({
  pool: {
    query: queryMock,
    connect: connectMock
  }
}));

import { ReadingSessionsRepository } from "../src/repositories/readingSessionsRepository";

describe("ReadingSessionsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing session when insert hits dedupe conflict", async () => {
    const repository = new ReadingSessionsRepository();
    const recordedAt = "2026-04-23T10:00:00.000Z";

    queryMock
      .mockResolvedValueOnce({ rows: [{ id: "book-1" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "session-existing",
            user_id: "user-1",
            book_id: "book-1",
            previous_page: 10,
            current_page: 40,
            pages_read: 30,
            recorded_at: new Date(recordedAt),
            created_at: new Date("2026-04-23T10:01:00.000Z")
          }
        ]
      })
      .mockResolvedValueOnce({ rows: [{ title: "Dune", author: "Frank Herbert" }] });

    const session = await repository.create("user-1", {
      bookId: "book-1",
      previousPage: 10,
      currentPage: 40,
      recordedAt
    });

    expect(session).toMatchObject({
      id: "session-existing",
      userId: "user-1",
      bookId: "book-1",
      previousPage: 10,
      currentPage: 40,
      pagesRead: 30,
      title: "Dune",
      author: "Frank Herbert"
    });
    expect(queryMock).toHaveBeenCalledTimes(4);
    expect(String(queryMock.mock.calls[1]?.[0])).toContain("ON CONFLICT (user_id, book_id, current_page, recorded_at) DO NOTHING");
  });

  it("does not create a session for a book that does not belong to the user", async () => {
    const repository = new ReadingSessionsRepository();
    queryMock.mockResolvedValueOnce({ rows: [] });

    const session = await repository.create("user-1", {
      bookId: "book-foreign",
      currentPage: 12
    });

    expect(session).toBeNull();
    expect(queryMock).toHaveBeenCalledTimes(1);
  });

  it("recalculates progress with latest remaining session after delete", async () => {
    const repository = new ReadingSessionsRepository();
    const clientQueryMock = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ id: "session-1", book_id: "book-1" }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({
        rows: [{ current_page: 90, recorded_at: new Date("2026-04-22T10:00:00.000Z") }]
      })
      .mockResolvedValueOnce({ rows: [{ pages: 300 }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    connectMock.mockResolvedValue({
      query: clientQueryMock,
      release: releaseMock
    });

    const deleted = await repository.deleteById("user-1", "session-1");

    expect(deleted).toBe(true);
    const updateCall = clientQueryMock.mock.calls.find((call) =>
      String(call[0]).includes("UPDATE books")
    );
    expect(updateCall).toBeTruthy();
    expect(updateCall?.[1][0]).toBe(90);
    expect(updateCall?.[1][1]).toBe(30);
    expect(updateCall?.[1][2]).toEqual(new Date("2026-04-22T10:00:00.000Z"));
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });

  it("resets progress when deleting the last session of a book", async () => {
    const repository = new ReadingSessionsRepository();
    const clientQueryMock = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ id: "session-1", book_id: "book-1" }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ pages: 420 }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    connectMock.mockResolvedValue({
      query: clientQueryMock,
      release: releaseMock
    });

    const deleted = await repository.deleteById("user-1", "session-1");

    expect(deleted).toBe(true);
    const updateCall = clientQueryMock.mock.calls.find((call) =>
      String(call[0]).includes("UPDATE books")
    );
    expect(updateCall?.[1][0]).toBeNull();
    expect(updateCall?.[1][1]).toBe(0);
    expect(updateCall?.[1][2]).toBeNull();
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });

  it("returns false when deleting a session that is not owned by user", async () => {
    const repository = new ReadingSessionsRepository();
    const clientQueryMock = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce(undefined);

    connectMock.mockResolvedValue({
      query: clientQueryMock,
      release: releaseMock
    });

    const deleted = await repository.deleteById("user-1", "session-from-other-user");

    expect(deleted).toBe(false);
    expect(clientQueryMock).toHaveBeenCalledTimes(3);
    expect(String(clientQueryMock.mock.calls[1]?.[0])).toContain(
      "SELECT id, book_id FROM reading_sessions WHERE id = $1 AND user_id = $2 LIMIT 1"
    );
    expect(releaseMock).toHaveBeenCalledTimes(1);
  });
});
