import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import evaluationService from '../../services/evaluationService';
import awardService from '../../services/awardService';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import ErrorMessage from '../../components/ErrorMessage';

export default function Comparison() {
  const { id } = useParams();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    evaluationService
      .get(id)
      .then((res) => setEvaluation(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAward = async (supplierId) => {
    await awardService.create(id, { supplier_id: supplierId });
    navigate(`/buyer/rfqs/${id}/award`);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h1>Quotation Comparison</h1>
      <ErrorMessage message={error} />
      {!evaluation?.suppliers?.length ? (
        <EmptyState message="No quotations to compare yet." />
      ) : (
        <table>
          <tbody>
            {evaluation.suppliers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.score}</td>
                <td><button onClick={() => handleAward(s.id)}>Award</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
