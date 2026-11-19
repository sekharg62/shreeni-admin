import apiClient from './apiClient'
import { ENDPOINTS } from '../constants/endpoints'
import type {
  JournalAuthor,
  JournalCategory,
  JournalPost,
  JournalPostPage,
  JournalPostPayload,
  JournalState,
  LinkTarget,
} from '../types/journal'

/** The Journal (blog): posts, categories, authors, tags and the editor's link picker. */
export const journalService = {
  async listPosts(query: { page?: number; limit?: number; search?: string; status?: JournalState | '' }): Promise<JournalPostPage> {
    const params = { ...query, status: query.status || undefined, search: query.search || undefined }
    const { data } = await apiClient.get<JournalPostPage>(ENDPOINTS.journal.posts, { params })
    return data
  },
  async getPost(id: string): Promise<JournalPost> {
    const { data } = await apiClient.get<JournalPost>(ENDPOINTS.journal.post(id))
    return data
  },
  async createPost(payload: JournalPostPayload): Promise<JournalPost> {
    const { data } = await apiClient.post<JournalPost>(ENDPOINTS.journal.posts, payload)
    return data
  },
  async updatePost(id: string, payload: JournalPostPayload): Promise<JournalPost> {
    const { data } = await apiClient.patch<JournalPost>(ENDPOINTS.journal.post(id), payload)
    return data
  },
  async removePost(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.journal.post(id))
  },
  async linkTargets(q: string): Promise<LinkTarget[]> {
    const { data } = await apiClient.get<LinkTarget[]>(ENDPOINTS.journal.linkTargets, { params: { q } })
    return data
  },
  async tags(q?: string): Promise<{ name: string; slug: string }[]> {
    const { data } = await apiClient.get<{ name: string; slug: string }[]>(ENDPOINTS.journal.tags, { params: { q: q || undefined } })
    return data
  },

  async listCategories(): Promise<JournalCategory[]> {
    const { data } = await apiClient.get<JournalCategory[]>(ENDPOINTS.journal.categories)
    return data
  },
  async saveCategory(id: string | null, payload: Partial<JournalCategory>): Promise<JournalCategory> {
    const { data } = id
      ? await apiClient.patch<JournalCategory>(ENDPOINTS.journal.category(id), payload)
      : await apiClient.post<JournalCategory>(ENDPOINTS.journal.categories, payload)
    return data
  },
  async removeCategory(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.journal.category(id))
  },

  async listAuthors(): Promise<JournalAuthor[]> {
    const { data } = await apiClient.get<JournalAuthor[]>(ENDPOINTS.journal.authors)
    return data
  },
  async saveAuthor(id: string | null, payload: Partial<JournalAuthor>): Promise<JournalAuthor> {
    const { data } = id
      ? await apiClient.patch<JournalAuthor>(ENDPOINTS.journal.author(id), payload)
      : await apiClient.post<JournalAuthor>(ENDPOINTS.journal.authors, payload)
    return data
  },
  async removeAuthor(id: string): Promise<void> {
    await apiClient.delete(ENDPOINTS.journal.author(id))
  },
}
