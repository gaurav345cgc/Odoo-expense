const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const Company = require('../models/Company');
const { isValidCurrencyCode } = require('../../../utils/currencyValidator'); // Import the validator

// --- Signup Logic ---
exports.signupUser = async ({ name, email, password, country }) => {
  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User with this email already exists.');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // 2. Fetch currency from REST Countries API
  let currencyCode = 'USD'; // Default currency
  try {
    const response = await axios.get(`https://restcountries.com/v3.1/name/${country}?fullText=true`);
    const currency = Object.keys(response.data[0].currencies)[0];
    if (currency && isValidCurrencyCode(currency)) {
            currencyCode = currency;
        } else {
            console.warn(`API returned an invalid or unlisted currency code for "${country}". Defaulting to USD.`);
        }
  } catch (apiError) {
    console.warn(`Could not fetch currency for country "${country}". Defaulting to USD.`);
  }

  // 3. Hash the password for security 🔒
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4. Create the new Company and User (as Admin)
  // This logic assumes the first user signing up is creating the company
  const newCompany = new Company({
    name: `${name}'s Company`, // A default company name
    country: country,
    baseCurrency: currencyCode,
  });

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role: 'Admin', // First user is always an Admin
    companyId: newCompany._id, // Link user to the new company
  });
  
  // Add the user's ID to the company's createdBy field
  newCompany.createdBy = newUser._id;

  // Save both to the database
  await newCompany.save();
  await newUser.save();

  // 5. Generate a JWT Token
  const payload = {
    user: {
      id: newUser.id,
    },
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h', // Token expires in 8 hours
  });
  
  // Don't send the password back
  newUser.password = undefined;

  return { token, user: newUser, company: newCompany };
};


// --- Login Logic ---
exports.loginUser = async ({ email, password }) => {
  // 1. Check if user exists
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  // 2. Compare the provided password with the stored hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  // 3. If credentials are correct, create and return a new JWT
  const payload = {
    user: {
      id: user.id,
    },
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });

  return { token, userId: user.id };
}; 
