import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import rfqService from '../../services/rfqService';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';

export default function BuyerDashboard() {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    rfqService
      .list()
      .then((res) => setRfqs(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load RFQs'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <h1>Buyer Dashboard</h1>
      <Link to="/buyer/rfqs/new">Create RFQ</Link>
      <ErrorMessage message={error} />
      {rfqs.length === 0 ? <EmptyState message="No RFQs yet." /> : (
        <ul>
          {rfqs.map((rfq) => (
            <li key={rfq.id}>
              <Link to={`/buyer/rfqs/${rfq.id}`}>{rfq.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
