import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Locomotives
export const getLocomotives = () => api.get('/locomotives');
export const getLocomotive = (id) => api.get(`/locomotives/${id}`);
export const createLocomotive = (data) => api.post('/locomotives', data);
export const updateLocomotive = (id, data) => api.put(`/locomotives/${id}`, data);
export const deleteLocomotive = (id) => api.delete(`/locomotives/${id}`);

// Decoders
export const getDecoders = () => api.get('/decoders');
export const getDecoder = (id) => api.get(`/decoders/${id}`);
export const createDecoder = (data) => api.post('/decoders', data);
export const updateDecoder = (id, data) => api.put(`/decoders/${id}`, data);
export const deleteDecoder = (id) => api.delete(`/decoders/${id}`);

// Sound Projects
export const getSoundProjects = () => api.get('/sound-projects');
export const getSoundProject = (id) => api.get(`/sound-projects/${id}`);
export const createSoundProject = (data) => api.post('/sound-projects', data);
export const updateSoundProject = (id, data) => api.put(`/sound-projects/${id}`, data);
export const deleteSoundProject = (id) => api.delete(`/sound-projects/${id}`);

// Rolling Stock (Vagones/Coches)
export const getRollingStock = () => api.get('/rolling-stock');
export const getRollingStockItem = (id) => api.get(`/rolling-stock/${id}`);
export const createRollingStock = (data) => api.post('/rolling-stock', data);
export const updateRollingStock = (id, data) => api.put(`/rolling-stock/${id}`, data);
export const deleteRollingStock = (id) => api.delete(`/rolling-stock/${id}`);

// Backup/Restore
export const createBackup = () => api.get('/backup');
export const restoreBackup = (data) => api.post('/restore', data);

// Statistics
export const getStats = () => api.get('/stats');

export default api;
