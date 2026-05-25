const axios = require('axios');

const testAuth = async () => {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YjI4ODBiZmY3OWIwOGNmNDU4ODhjNCIsImlhdCI6MTc3MzMxNTc4NiwiZXhwIjoxNzczMzE5Mzg2fQ.vSts3KLRcHJMhbyBVg4lmkeJosQ0FR0IgHYOMZn-wwo';
    const response = await axios.get('http://localhost:5000/api/services', {
      headers: { 'x-auth-token': token }
    });
    console.log('STATUS:', response.status);
    console.log('USER_PLAN:', response.data.userPlan);
    console.log('DISCOUNT:', response.data.discountApplied);
    console.log('FIRST_SERVICE_PRICE:', response.data.services[0].price);
    console.log('FIRST_SERVICE_ORIGINAL:', response.data.services[0].originalPrice);
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.data : err.message);
  }
};

testAuth();
