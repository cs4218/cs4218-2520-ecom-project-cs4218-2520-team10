import spikeProductBrowsing from "./spike-product-browsing.js";

export const options = {
    scenarios: {
        productBrowsing: {
            executor: 'ramping-vus',
            exec: 'testProductBrowsing',
            startTime: '0s',
            stages: [
                { duration: '1s', target: 10 },
                { duration: '3s', target: 50 },
                { duration: '10s', target: 50 },
                { duration: '3s', target: 0 },
            ],
        },
        // searchFilter: {
        //     executor: 'ramping-vus',
        //     exec: 'testSearchFilter',
        //     startTime: '0s',
        //     stages: [
        //         { duration: '2s', target: 20 },
        //         { duration: '5s', target: 100 },
        //         { duration: '8s', target: 100 },
        //         { duration: '2s', target: 0 },
        //     ],
        // },
    },
    thresholds: {
        'http_req_failed{scenario:productBrowsing}': ['rate<0.15'],
        'http_req_duration{scenario:productBrowsing}': ['p(95)<2000'],
        // 'http_req_failed{scenario:searchFilter}': ['rate<0.10'],
        // 'http_req_duration{scenario:searchFilter}': ['p(95)<1500'],
    },
};

export function testProductBrowsing() {
    spikeProductBrowsing();
}

// export function testSearchFilter() {
//     spikeSearchFilter();
// }
