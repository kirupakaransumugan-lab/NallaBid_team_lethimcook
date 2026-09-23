import api from './api';

const rfqService = {
  list: () => api.get('/rfqs'),
  get: (id) => api.get(`/rfqs/${id}`),
  create: (data) => api.post('/rfqs', data),
  update: (id, data) => api.put(`/rfqs/${id}`, data),
  remove: (id) => api.delete(`/rfqs/${id}`),
};

export default rfqService;
