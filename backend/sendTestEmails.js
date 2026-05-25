const nodemailer = require('nodemailer');
const { 
    sendBookingConfirmationEmail, 
    sendBookingConfirmedEmail 
} = require('./utils/emailService');
require('dotenv').config();

const testData = {
    email: 'dhruvalgondaliya5@gmail.com', // Using user's email for test
    name: 'Dhruval Test',
    paymentId: '69b2880bff79b08cf45888c4', // Dummy ID
    bookings: [
        {
            name: 'Home Repair Service',
            date: new Date(),
            time: '02:00 PM',
            price: '1200'
        }
    ],
    transactionId: 'TXN_PDF_SUCCESS_999',
    paymentMethod: 'Credit Card',
    amount: '1200'
};

async function runTest() {
    console.log('--- Testing Booking Confirmation Email with PDF ---');
    try {
        await sendBookingConfirmationEmail(testData);
        console.log('✅ Booking Confirmation Task completed (Check for PDF attachment and link)');
    } catch (err) {
        console.error('❌ Error in Booking Confirmation Email:', err);
    }

    console.log('\n--- Testing Booking Confirmed Email with PDF ---');
    try {
        await sendBookingConfirmedEmail({
            ...testData,
            confirmedAt: new Date()
        });
        console.log('✅ Booking Confirmed Task completed (Check for PDF attachment)');
    } catch (err) {
        console.error('❌ Error in Booking Confirmed Email:', err);
    }
}

runTest();
