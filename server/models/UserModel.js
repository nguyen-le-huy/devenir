import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Sub-document schema for addresses
const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Fullname is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [
        /^(\+84|0)[0-9]{9,10}$/,
        'Please enter a valid phone number',
      ],
    },
    street: {
      type: String,
      required: [true, 'Please enter street'],
    },
    city: {
      type: String,
      required: [true, 'Please select city'],
    },
    postalCode: {
      type: String,
      required: [true, 'Please enter postal code'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false } // Do not create _id for sub-document
);

// Main User schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must not exceed 30 characters'],
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: function() {
        // Password required chỉ khi không là Google OAuth
        return !this.googleId;
      },
      validate: {
        validator: function(v) {
          // Nếu không có googleId thì password phải >= 6 characters
          if (!this.googleId && v) {
            return v.length >= 6;
          }
          return true;
        },
        message: 'Password must be at least 6 characters'
      },
      select: false, // Do not return password in queries by default
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    phone: {
      type: String,
      default: null,
      match: [
        /^(\+84|0)[0-9]{9,10}$/,
        'Please enter a valid phone number',
      ],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true, // Auto create createdAt and updatedAt
  }
);

// ============ PRE-HOOK MIDDLEWARE ============

/**
 * Hash password before saving the document
 * Only run if the password was modified (isModified)
 */
userSchema.pre('save', async function (next) {
  // If password is not changed or password is empty, skip
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ============ INSTANCE METHODS ============

/**
 * Check if entered password matches the hashed password
 * @param {String} enteredPassword - Password entered by the user
 * @returns {Promise<Boolean>} - true if match, false if not
 * 
 * Usage: const isMatch = await user.matchPassword('password123');
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ============ STATIC METHODS ============

/**
 * Find user by email and include password field
 * Because password has select: false, we need to use .select('+password') to include it
 * 
 * @param {String} email - User's email
 * @returns {Promise<Object>} - User object with password
 * 
 * Usage: const user = await User.findByEmailWithPassword(email);
 */
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email }).select('+password');
};

// ============ INDEXES ============

/**
 * Create indexes to optimize queries
 * Helps speed up searches by email, username, googleId
 * Note: unique constraints are already defined in field definitions above
 */

// ============ CREATE & EXPORT MODEL ============

const User = mongoose.model('User', userSchema);

export default User;