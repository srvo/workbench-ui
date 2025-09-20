import { fetcher } from '../lib/fetch';
import type { Note, PaginatedResponse } from './types';

export const notesApi = {
  // Get latest note for symbol
  getLatest: (symbol: string) =>
    fetcher.get<Note[]>(`/api/notes`, { symbol, latest: 1 }).then(notes => notes[0] || null),

  // Get all notes for symbol
  getAll: (symbol: string, limit = 50, offset = 0) =>
    fetcher.get<PaginatedResponse<Note>>(`/api/notes`, { symbol, limit, offset }),

  // Create new note (uses bearer token automatically)
  create: (symbol: string, body_md: string) =>
    fetcher.post<Note>(`/api/notes`, { symbol, body: body_md }),

  // Update note
  update: (id: string, body_md: string) =>
    fetcher.put<Note>(`/api/notes/${id}`, { body: body_md }),

  // Delete note
  delete: (id: string) =>
    fetcher.delete(`/api/notes/${id}`),
};