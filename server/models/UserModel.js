import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Utility helpers
const normalizeTags = (tags = []) => {
  if (!Array.isArray(tags)) return [];
  return [...new Set(
    tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean)
  )];
};

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
    district: {
      type: String,
      required: [true, 'Please select district'],
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

// Sub-document schema for CRM-specific fields
const customerProfileSchema = new mongoose.Schema(
  {
    loyaltyTier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    status: {
      type: String,
      enum: ['prospect', 'active', 'inactive', 'vip', 'at-risk'],
      default: 'prospect',
    },
    preferredChannel: {
      type: String,
      enum: ['email', 'phone', 'messaging', 'in-person'],
      default: 'email',
    },
    marketingOptIn: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
      set: normalizeTags,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    notesList: [
      {
        type: {
          type: String,
          enum: ['preference', 'consultation', 'feedback', 'issue', 'opportunity', 'context'],
          default: 'context',
        },
        content: {
          type: String,
          required: true,
          trim: true,
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        isPinned: {
          type: Boolean,
          default: false,
        },
      },
    ],
    source: {
      type: String,
      default: 'organic',
      trim: true,
    },
    relationshipScore: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    accountManager: {
      type: String,
      default: '',
      trim: true,
    },
    lastContactedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
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
    firstName: {
      type: String,
      default: null,
    },
    lastName: {
      type: String,
      default: null,
    },
    birthday: {
      type: Date,
      default: null,
    },
    preferences: {
      channels: {
        email: { type: Boolean, default: true },
        phone: { type: Boolean, default: false },
        messaging: { type: Boolean, default: false },
        post: { type: Boolean, default: false },
      },
      interests: {
        type: String,
        enum: ['menswear', 'womenswear', 'both'],
        default: 'menswear',
      },
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
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    addresses: [addressSchema],
    customerProfile: {
      type: customerProfileSchema,
      default: () => ({}),
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
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

/**
 * Check if account is currently locked
 * @returns {Boolean} - true if locked, false if not
 */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increment login attempts and lock account if threshold exceeded
 * @returns {Promise<Boolean>} - true if account is now locked
 */
userSchema.methods.incLoginAttempts = async function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
    await this.save();
    return false;
  }
  
  // Otherwise increment
  this.loginAttempts += 1;
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts >= 5 && !this.isLocked()) {
    this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  
  await this.save();
  return this.isLocked();
};

/**
 * Reset login attempts after successful login
 */
userSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts === 0 && !this.lockUntil) return;
  
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = Date.now();
  await this.save();
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