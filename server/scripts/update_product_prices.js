
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ProductVariant from '../models/ProductVariantModel.js';
// Need to register Product model as well because Variant references it? 
// Mongoose might complain if Product model is not registered when populating, 
// but for updateMany on Variant, it might be fine. 
// However, best practice to register if there are hooks or refs.
import Product from '../models/ProductModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const updatePrices = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Find variants with price < 5000
        // We can use updateMany directly, but let's count them first to be informative.
        const filter = { price: { $lt: 5000 } };

        // Optional: Only update active variants? User said "all sản phẩm". 
        // I will stick to the literal request: all variants with price < 5000.

        const count = await ProductVariant.countDocuments(filter);
        console.log(`Found ${count} variants with price < 5000`);

        if (count > 0) {
            const result = await ProductVariant.updateMany(filter, { $set: { price: 6000 } });
            console.log(`Updated ${result.modifiedCount} variants to price 6000.`);
        } else {
            console.log('No variants needed updating.');
        }

    } catch (error) {
        console.error('Error updating prices:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB Disconnected');
        process.exit();
    }
};

updatePrices();
