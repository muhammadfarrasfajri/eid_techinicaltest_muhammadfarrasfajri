import axios from 'axios';

const baseURL = 'http://localhost:5014/api'; 

const axiosInstance = axios.create({
    baseURL: baseURL,
    withCredentials: true 
});

export default axiosInstance;