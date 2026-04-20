export const studyQueryKeys = {
  materials: () => ["materials"] as const,
  drafts: () => ["drafts"] as const,
  materialChunksRoot: () => ["material-chunks"] as const,
  materialChunks: (materialId: string | null | undefined) => ["material-chunks", materialId] as const,
  chatThreadsRoot: () => ["chat-threads"] as const,
  chatThreads: (materialId: string | null | undefined) => ["chat-threads", materialId] as const,
  chatMessagesRoot: () => ["chat-messages"] as const,
  chatMessages: (threadId: string | null | undefined) => ["chat-messages", threadId] as const
};
