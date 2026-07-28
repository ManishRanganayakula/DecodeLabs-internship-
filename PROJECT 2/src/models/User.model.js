const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const config = require('../config/env');
const { ROLES } = require('../constants');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    zipCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Never returned by default in queries
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [18, 'You must be at least 18 years old'],
      max: [120, 'Please provide a valid age'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\+?[1-9]\d{7,14}$/, 'Please provide a valid phone number in E.164 format'],
    },
    address: {
      type: addressSchema,
      default: () => ({}),
    },
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: 'Role must be either admin or user',
      },
      default: ROLES.USER,
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordChangedAt: { type: Date, select: false },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ---------- Indexes ----------
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ name: 'text', email: 'text' });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// ---------- Virtuals ----------
userSchema.virtual('fullAddress').get(function fullAddress() {
  if (!this.address) return '';
  const { street, city, state, zipCode, country } = this.address;
  return [street, city, state, zipCode, country].filter(Boolean).join(', ');
});

// ---------- Query middleware: exclude soft-deleted users by default ----------
function excludeSoftDeleted(next) {
  // `this` refers to the query. Only apply when caller hasn't explicitly
  // asked to include deleted docs (e.g. admin audit views).
  if (this.getOptions().includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
}
userSchema.pre(/^find/, excludeSoftDeleted);

// ---------- Pre-save hook: hash password ----------
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
    return next();
  } catch (error) {
    return next(error);
  }
});

// ---------- Instance methods ----------
userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function createEmailVerificationToken() {
  const verifyToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verifyToken;
};

userSchema.methods.softDelete = function softDelete() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save({ validateBeforeSave: false });
};

// toJSON transform: strip sensitive fields even if accidentally selected
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
