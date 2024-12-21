import React, { useState } from 'react';
import { useItems } from '../hooks/useItems';
import ItemCard from './ItemCard';
import Pagination from './Pagination';

interface ItemListProps {
  category?: string;
  search?: string;
}

const ItemList: React.FC<ItemListProps> = ({ category, search }) => {
  const [page, setPage] = useState(1);
  const { data: items, isLoading, isError, error, isFetching } = useItems({
    category,
    search,
    page,
  });

  if (isLoading) {
    return <div>Loading items...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  if (!items?.length) {
    return <div>No items found.</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
      
      {isFetching && <div>Fetching more items...</div>}
      
      <Pagination
        currentPage={page}
        onPageChange={setPage}
        hasMore={items.length === 10} // Assuming ITEMS_PER_PAGE is 10
      />
    </div>
  );
};

export default ItemList; 