import api from './api';

const quotationService = {
  list: (rfqId) => api.get('/quotations', { params: { rfq_id: rfqId } }),
  get: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
};

export default quotationService;
