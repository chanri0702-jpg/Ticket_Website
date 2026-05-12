const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  name:     { type: String, required: true },
  surname:  { type: String, required: true },
  password: { type: String, required: true },
  phone:    { type: String, required: true },
  role:     { type: String, enum: ['admin', 'user'], default: 'user' },
  address1: { type: String },
  address2: { type: String },
  city:     { type: String },
  zip:      { type: String },
  province: { type: String },
  
}, { timestamps: true });

userSchema.pre('save', async function() {
  // Only hash if password is modified (or new)
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});
// Compare candidate password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
}

module.exports = mongoose.model('User', userSchema)