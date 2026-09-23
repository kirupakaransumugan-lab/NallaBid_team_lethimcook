import api from './api';

const evaluationService = {
  get: (rfqId) => api.get(`/evaluations/${rfqId}`),
  run: (rfqId) => api.post(`/evaluations/${rfqId}`),
};

export default evaluationService;
