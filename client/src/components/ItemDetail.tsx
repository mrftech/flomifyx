import React from 'react';
import { useItemDetail, useUpdateItem, useDeleteItem } from '../hooks/useItemDetail';
import { usePlatforms } from '../hooks/usePlatforms';
import { useLicenses } from '../hooks/useLicenses';
import { useCategories } from '../hooks/useCategories';

interface ItemDetailProps {
  itemId: string;
  onDelete?: () => void;
}

const ItemDetail: React.FC<ItemDetailProps> = ({ itemId, onDelete }) => {
  const { data: item, isLoading, isError, error } = useItemDetail(itemId);
  const { data: platforms } = usePlatforms();
  const { data: licenses } = useLicenses();
  const { data: categories } = useCategories();
  
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  if (isLoading) {
    return <div>Loading item details...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  if (!item) {
    return <div>Item not found.</div>;
  }

  const handleUpdate = async (updates: any) => {
    try {
      await updateItem.mutateAsync({ id: itemId, updates });
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItem.mutateAsync(itemId);
      onDelete?.();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <div className="mt-2 text-gray-600">
            {item.category?.name} • {item.license?.name}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleUpdate(item)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="prose max-w-none">
        <p>{item.description}</p>
      </div>

      {item.platforms && item.platforms.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Platform Compatibility</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.platforms.map((p) => {
              const platform = platforms?.find(plat => plat.id === p.platform_id);
              return (
                <div key={p.platform_id} className="border rounded p-3">
                  <div className="font-medium">{platform?.name}</div>
                  <div className="text-sm text-gray-600">Version: {p.version}</div>
                  {p.compatibility_notes && (
                    <div className="mt-1 text-sm">{p.compatibility_notes}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        {item.live_preview && (
          <a
            href={item.live_preview}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Live Preview
          </a>
        )}
        {item.purchase_link && (
          <a
            href={item.purchase_link}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Purchase
          </a>
        )}
      </div>
    </div>
  );
};

export default ItemDetail; 