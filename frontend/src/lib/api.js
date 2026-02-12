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
export const getBackupHistory = () => api.get('/backup/history');
export const clearBackupHistory = () => api.delete('/backup/history');
export const getBackupSettings = () => api.get('/backup/settings');
export const saveBackupSettings = (data) => api.post('/backup/settings', data);

// JMRI Import
export const importJMRI = (filesContent) => api.post('/import/jmri', filesContent);

// Wishlist
export const getWishlist = () => api.get('/wishlist');
export const getWishlistItem = (id) => api.get(`/wishlist/${id}`);
export const createWishlistItem = (data) => api.post('/wishlist', data);
export const updateWishlistItem = (id, data) => api.put(`/wishlist/${id}`, data);
export const deleteWishlistItem = (id) => api.delete(`/wishlist/${id}`);
export const moveWishlistToCollection = (id, purchaseDate, price) => 
  api.post(`/wishlist/${id}/move-to-collection`, null, { 
    params: { purchase_date: purchaseDate, price: price }
  });

// PDF Export
export const exportCatalogPDF = () => `${API}/export/catalog/pdf`;
export const exportLocomotivePDF = (id) => `${API}/export/locomotive/${id}/pdf`;
export const exportRollingStockPDF = (id) => `${API}/export/rolling-stock/${id}/pdf`;

// Compositions
export const getCompositions = () => api.get('/compositions');
export const getComposition = (id) => api.get(`/compositions/${id}`);
export const createComposition = (data) => api.post('/compositions', data);
export const updateComposition = (id, data) => api.put(`/compositions/${id}`, data);
export const deleteComposition = (id) => api.delete(`/compositions/${id}`);

// CSV Import
export const importLocomotivesCSV = (csvContent) => axios.post(`${API}/import/csv/locomotives`, csvContent, {
  headers: { 'Content-Type': 'text/plain' }
});
export const importRollingStockCSV = (csvContent) => axios.post(`${API}/import/csv/rolling-stock`, csvContent, {
  headers: { 'Content-Type': 'text/plain' }
});
export const getLocomotivesCSVTemplate = () => `${API}/import/csv/template/locomotives`;
export const getRollingStockCSVTemplate = () => `${API}/import/csv/template/rolling-stock`;

// Statistics
export const getStats = () => api.get('/stats');

export default api;
