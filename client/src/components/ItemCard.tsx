import React, { useState } from 'react';
import { Item } from '../lib/supabase';

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{item.name}</h3>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ⋮
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => {
                    // Handle edit
                    setIsDropdownOpen(false);
                  }}
                >
                  Edit
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  onClick={() => {
                    // Handle delete
                    setIsDropdownOpen(false);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-gray-600 mt-2">{item.description}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-500">{item.category}</span>
        <span className="text-sm text-gray-500">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default ItemCard; 