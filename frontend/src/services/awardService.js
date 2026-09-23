import api from './api';

const awardService = {
  get: (rfqId) => api.get(`/awards/${rfqId}`),
  create: (rfqId, data) => api.post(`/awards/${rfqId}`, data),
};

export default awardService;
