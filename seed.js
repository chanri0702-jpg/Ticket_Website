require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@ticketstream.com' });
        
        if (!adminExists) {
            const admin = new User({
                name: 'Admin',
                surname: 'User',
                email: 'admin@ticketstream.com',
                phone: '0000000000',
                password: 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log('\n✅ Admin user created successfully!');
            console.log('   Email: admin@ticketstream.com');
            console.log('   Password: admin123');
            console.log('   Role: Administrator\n');
        } else {
            console.log('\n⚠️ Admin user already exists');
            console.log('   Email: admin@ticketstream.com\n');
        }
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seedAdmin();