import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  scenarios: {
    smoke: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '45s', target: 25 },
        { duration: '15s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800', 'p(99)<1500'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000'

export default function smoke() {
  const home = http.get(`${BASE_URL}/`)
  check(home, {
    'home status 200': (r) => r.status === 200,
    'home has hero': (r) => r.body && r.body.includes('A calmer way to furnish'),
  })

  const health = http.get(`${BASE_URL}/api/health`)
  check(health, { 'health status 200': (r) => r.status === 200 })

  sleep(1)
}
