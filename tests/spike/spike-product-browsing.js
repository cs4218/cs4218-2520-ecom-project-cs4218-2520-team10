import http from "k6/http";
import { check, sleep } from "k6";

const API_URL = __ENV.API_URL || 'http://localhost:6060/api/v1';

export const options = {
    stages: [
        { duration: '1s', target: 10 },
        { duration: '3s', target: 50 },
        { duration: '10s', target: 50 },
        { duration: '3s', target: 0 },
    ],
    thresholds: {
        http_req_failed: ['rate<0.15'], // Less than 15% failures
        http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    },
};

export default function spikeProductBrowsing() {
    // Test 1: Get all products
    const productResponse = http.get(`${API_URL}/product/get-product`);
    check(productResponse, {
        'get-product status 200': (r) => r.status === 200,
        'get-product has multiple products': (r) => JSON.parse(r.body).products && JSON.parse(r.body).products.length > 2,
        'get-product success flag': (r) => JSON.parse(r.body).success === true,
    });

    sleep(0.1); // Small delay between iterations
}