import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { BoardData } from '@/components/board/board-types';

type FetchBoardDataParams = {
  boardId: string;
  spaceSlug: string;
};

async function fetchBoardData({ boardId, spaceSlug }: FetchBoardDataParams): Promise<BoardData> {
  const endpoints = [
    { key: 'tasks', url: `/api/spaces/${encodeURIComponent(spaceSlug)}/tasks` },
    { key: 'statuses', url: `/api/boards/${encodeURIComponent(boardId)}/statuses` },
    { key: 'sprints', url: `/api/boards/${encodeURIComponent(boardId)}/sprints` },
    { key: 'board', url: `/api/spaces/${encodeURIComponent(spaceSlug)}/boards/${encodeURIComponent(boardId)}` },
    { key: 'space', url: `/api/spaces/${encodeURIComponent(spaceSlug)}` },
  ] as const;

  const responses = await Promise.all(
    endpoints.map(async ({ key, url }) => {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Failed to fetch ${key}: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      if (!json?.success) {
        throw new Error(json?.message ?? `Failed to fetch ${key}`);
      }
      return { key, data: json };
    }),
  );

  const result: BoardData = {
    tasks: [],
    statuses: [],
    sprints: [],
    board: null,
    space: null,
  };

  responses.forEach(({ key, data }) => {
    switch (key) {
      case 'tasks':
        result.tasks = data.tasks ?? [];
        break;
      case 'statuses':
        result.statuses = data.statuses ?? [];
        break;
      case 'sprints':
        result.sprints = data.sprints ?? [];
        break;
      case 'board':
        result.board = data.board ?? null;
        break;
      case 'space':
        result.space = data.space ?? null;
        break;
      default:
        break;
    }
  });

  return result;
}

export function useBoardData(params: { boardId?: string; spaceSlug?: string; enabled?: boolean }) {
  const { boardId, spaceSlug, enabled = true } = params;
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => ['board-data', boardId, spaceSlug], [boardId, spaceSlug]);

  const query = useQuery<BoardData>({
    queryKey,
    queryFn: () => {
      if (!boardId || !spaceSlug) {
        throw new Error('boardId and spaceSlug are required to fetch board data');
      }
      return fetchBoardData({ boardId, spaceSlug });
    },
    enabled: Boolean(boardId && spaceSlug && enabled),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true, // Always refetch when component mounts to ensure fresh data
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    ...query,
    refresh,
  };
}
