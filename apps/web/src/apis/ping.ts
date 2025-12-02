import * as fs from 'node:fs';
import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import { queryClient } from '~/utils/query-client';

const filePath = 'count.txt';

async function readCount() {
  return parseInt(await fs.promises.readFile(filePath, 'utf-8').catch(() => '0'));
}

export const fetchCount = createServerFn({ method: 'GET' }).handler(() => {
  return readCount();
});

export const countQueryOptions = () =>
  queryOptions({
    queryKey: ['count'],
    queryFn: async () => {
      const count = await fetchCount();
      return count;
    },
  });

export const updateCount = createServerFn({ method: 'POST' })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

export const updateCountMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: number) => updateCount({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['count'] });
    },
  });
