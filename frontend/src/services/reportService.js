import api from './api';

const reportService = {
  summary: (rfqId) => api.get(`/reports/${rfqId}`),
  download: (rfqId) => api.get(`/reports/${rfqId}/export`, { responseType: 'blob' }),
};

export default reportService;
