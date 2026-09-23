import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import awardService from '../../services/awardService';
import Loading from '../../components/Loading';
import ErrorMessage from '../../components/ErrorMessage';

export default function AwardResult() {
  const { id } = useParams();
  const [award, setAward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    awardService
      .get(id)
      .then((res) => setAward(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load award'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!award) return null;

  return (
    <div>
      <h1>Award Result</h1>
      <p>Awarded to: {award.supplier_name}</p>
    </div>
  );
}
