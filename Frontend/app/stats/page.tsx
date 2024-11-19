import StatsTable from "@/app/stats/table";
import { DefaultPagination, prefetchPaginatedQuery } from "@/hooks/query";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

const StatsPage = async () => {
  const queryClient = await prefetchPaginatedQuery("/Stat", DefaultPagination);
  
  return (
    <main>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StatsTable />
      </HydrationBoundary>
    </main>
  );
};

export default StatsPage;
