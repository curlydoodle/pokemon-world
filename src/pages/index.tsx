import clsx from 'clsx';
import { GetStaticPropsResult } from 'next';
import { useEffect, useState } from 'react';
import { useIntersection } from 'react-power-ups';
import { dehydrate, DehydratedState } from 'react-query';

import { queryPokemonGenAndTypes } from '@/api/queries/pokemon-gen-and-types';
import { QueryPokemonFilter, queryPokemons, useInfQueryPokemons } from '@/api/queries/pokemons';
import PokemonCard from '@/components/features/pokemon-list/pokemon-card';
import PokemonCardsShimmer from '@/components/features/pokemon-list/pokemon-cards-shimmer';
import PokemonListFilter from '@/components/features/pokemon-list/pokemon-list-filter';
import queryClient from '@/config/react-query';

type Result = GetStaticPropsResult<{ dehydratedState: DehydratedState }>;

const INITIAL_FILTER = { name: '', generationId: 0, typeId: 0 };

export async function getStaticProps(): Promise<Result> {
  await queryClient.fetchInfiniteQuery(['pokemons', INITIAL_FILTER], queryPokemons);
  await queryClient.fetchQuery(['pokemon-g&t'], queryPokemonGenAndTypes);

  // https://github.com/tannerlinsley/react-query/issues/1458
  const dehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));

  return {
    props: {
      dehydratedState,
    },
  };
}

export default function PokemonListPage() {
  const [filter, setFilter] = useState<QueryPokemonFilter>(INITIAL_FILTER);
  const { data, isFetching, isFetchingNextPage, isPreviousData, fetchNextPage } =
    useInfQueryPokemons(filter);

  const loadMoreRef = useIntersection({
    rootMargin: '560px',
    onEnter: () => fetchNextPage(),
    enabled: !isFetching,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [filter]);

  return (
    <>
      <div className="sticky top-16 z-10 -m-3.5 mb-8 flex translate-y-[var(--scroll-distance)] gap-2.5 border-b px-3.5 py-2.5 lg:top-2 lg:z-30 lg:-mx-6 lg:-mt-10 lg:mb-0 lg:translate-y-0 lg:border-0 lg:bg-transparent lg:py-3 lg:px-6 lg:backdrop-blur-0">
        <PokemonListFilter filter={filter} setFilter={setFilter} />
      </div>
      <hr className="-mx-6 mb-8 hidden lg:block" />

      {isPreviousData && <div className="relative -top-4 text-center">⏳ Loading...</div>}
      <div className={clsx('pokemon-card-container', isPreviousData && 'opacity-60')}>
        {data!.pages.map((pokemons) =>
          pokemons.map((pokemon) => <PokemonCard key={pokemon.id} {...pokemon} />),
        )}
        {isFetchingNextPage && <PokemonCardsShimmer />}
      </div>
      <div ref={loadMoreRef} />
    </>
  );
}
