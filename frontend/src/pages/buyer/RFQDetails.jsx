import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import rfqService from '../../services/rfqService';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';

export default function RFQDetails() {
  const { id } = useParams();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    rfqService
      .get(id)
      .then((res) => setRfq(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load RFQ'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!rfq) return null;

  return (
    <div>
      <h1>{rfq.title}</h1>
      <p>{rfq.description}</p>
      <p>Deadline: {rfq.deadline}</p>
      <Link to={`/buyer/rfqs/${id}/comparison`}>View Comparison</Link>
    </div>
  );
}
