import { useQuery } from '@tanstack/react-query';
import { fetchFleetData } from '../../shared/api/fleet';

export function ShipsPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['fleet'],
    queryFn: ({ signal }) => fetchFleetData(signal),
  });

  if (isPending) {
    return <div>Loading fleet...</div>;
  }

  if (isError) {
    return (
      <div>
        <p>
          Failed to load fleet:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>

        <button type="button" onClick={() => void refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <main>
      <h1>World of Warships Fleet Explorer</h1>

      <p>Ships: {data.ships.length}</p>
      <p>Nations: {Object.keys(data.nationsByCode).length}</p>
      <p>Ship types: {Object.keys(data.typesByKey).length}</p>

      <ul>
        {data.ships.slice(0, 10).map((ship) => (
          <li key={ship.id}>
            {ship.displayName}
            {' — '}
            Tier {ship.tier ?? 'Unknown'}
            {' — '}
            {ship.nationCode ?? 'Unknown nation'}
            {' — '}
            {ship.typeKey ?? 'Unknown type'}
          </li>
        ))}
      </ul>
    </main>
  );
}
