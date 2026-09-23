import { useEffect, useState } from 'react';
import quotationService from '../../services/quotationService';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';

export default function MyQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    quotationService
      .list()
      .then((res) => setQuotations(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load quotations'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <h1>My Quotations</h1>
      <ErrorMessage message={error} />
      {quotations.length === 0 ? <EmptyState message="No quotations submitted yet." /> : (
        <ul>
          {quotations.map((q) => (
            <li key={q.id}>{q.rfq_title} — {q.price}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
