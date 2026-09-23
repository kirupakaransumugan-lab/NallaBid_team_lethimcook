import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rfqService from '../../services/rfqService';
import ErrorMessage from '../../components/ErrorMessage';

export default function CreateRFQ() {
  const [form, setForm] = useState({ title: '', description: '', deadline: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await rfqService.create(form);
      navigate(`/buyer/rfqs/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create RFQ');
    }
  };

  return (
    <div>
      <h1>Create RFQ</h1>
      <form onSubmit={handleSubmit}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" />
        <input name="deadline" type="date" value={form.deadline} onChange={handleChange} required />
        <button type="submit">Submit</button>
      </form>
      <ErrorMessage message={error} />
    </div>
  );
}
