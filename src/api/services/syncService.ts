import axiosClient from '../axiosClient';

const BASE = '/v1/sync';

const syncService = {
    heartbeat: (projectId: number) =>
        axiosClient.post(`${BASE}/heartbeat/${projectId}`),

    deactivate: (projectId: number) =>
        axiosClient.post(`${BASE}/deactivate/${projectId}`),
};

export default syncService;
