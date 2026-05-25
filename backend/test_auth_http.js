const http = require('http');

const testAuth = () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YjI4ODBiZmY3OWIwOGNmNDU4ODhjNCIsImlhdCI6MTc3MzMxNTc4NiwiZXhwIjoxNzczMzE5Mzg2fQ.vSts3KLRcHJMhbyBVg4lmkeJosQ0FR0IgHYOMZn-wwo';
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/services',
        method: 'GET',
        headers: {
            'x-auth-token': token
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            const body = JSON.parse(data);
            console.log('STATUS:', res.statusCode);
            console.log('USER_PLAN:', body.userPlan);
            console.log('DISCOUNT:', body.discountApplied);
            if (body.services && body.services.length > 0) {
                console.log('FIRST_SERVICE_PRICE:', body.services[0].price);
                console.log('FIRST_SERVICE_ORIGINAL:', body.services[0].originalPrice);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.end();
};

testAuth();
