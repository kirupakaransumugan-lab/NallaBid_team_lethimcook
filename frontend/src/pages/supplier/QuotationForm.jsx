import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import quotationService from '../../services/quotationService';
import ErrorMessage from '../../components/ErrorMessage';

export default function QuotationForm() {
  const { id } = useParams();
  const [form, setForm] = useState({ price: '', delivery_days: '', notes: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await quotationService.create({ ...form, rfq_id: id });
      navigate('/supplier/quotations');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit quotation');
    }
  };

  return (
    <div>
      <h1>Submit Quotation</h1>
      <form onSubmit={handleSubmit}>
        <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" required />
        <input name="delivery_days" type="number" value={form.delivery_days} onChange={handleChange} placeholder="Delivery (days)" required />
        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" />
        <button type="submit">Submit</button>
      </form>
      <ErrorMessage message={error} />
    </div>
  );
}
