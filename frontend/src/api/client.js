import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "";

const client = axios.create({
    baseURL: API_BASE,
    headers: {
        "Content-Type": "application/json",
    },
});

let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
    subscribers.forEach(cb => cb(token));
    subscribers = [];
}
function addSubscriber(cb) {
    subscribers.push(cb);
}

client.interceptors.request.use(config => {
    const token = localStorage.getItem("authToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

client.interceptors.response.use(
    res => res,
    err => {
        const { response, config } = err;
        if (response && response.status === 401 && !config._retry) {
            config._retry = true;
            const refreshToken = localStorage.getItem("refreshToken");
            if (!refreshToken) {
                // No refresh token, forward error
                return Promise.reject(err);
            }
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    addSubscriber(token => {
                        config.headers.Authorization = `Bearer ${token}`;
                        resolve(client(config));
                    });
                });
            }
            isRefreshing = true;
            // Use a plain axios call to avoid interceptor loop
            return axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
                .then(({ data }) => {
                    const newToken = data.token || data.accessToken;
                    const newRefresh = data.refreshToken;
                    if (newToken) {
                        localStorage.setItem("authToken", newToken);
                        client.defaults.headers.Authorization = `Bearer ${newToken}`;
                    }
                    if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
                    onRefreshed(newToken);
                    return client(config);
                })
                .catch(e => {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("refreshToken");
                    return Promise.reject(e);
                })
                .finally(() => {
                    isRefreshing = false;
                });
        }
        return Promise.reject(err);
    }
);

export default client;