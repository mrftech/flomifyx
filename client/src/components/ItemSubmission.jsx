import React, { useState } from 'react';
import { itemService } from '../services/itemService';
import { useNavigate } from 'react-router-dom';

function ItemSubmission() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    itemType: 'Components',
    tags: [],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await itemService.createItem(formData);
      navigate('/');
    } catch (error) {
      console.error('Error submitting item:', error);
    }
  };

  return (
    <div>
      <h1>Submit New Component</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default ItemSubmission; 