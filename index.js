const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); 

// MongoDB Connection Configuration
const MONGO_URI = "mongodb+srv://sumitsati12770ss:1DnF7sSDVTVjnUmH@cluster0.1am56.mongodb.net/";

// Create Express App
const app = express();
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch((err) => console.error('MongoDB Connection Error:', err));

// Dynamic Schema Creation Utility
const deviceIdentifierSchema = new mongoose.Schema({
    random_id: {
        type: String,
        unique: true,
        default: uuidv4,
        index: true
    },
    hardware_id: { 
        type: String, 
        default: null
    },
    device_id: { 
        type: String, 
        default: null
    },
    android_id: { 
        type: String, 
        default: null
    }
}, {
    timestamps: true
});

deviceIdentifierSchema.pre('validate', function(next) {
    if (!this.hardware_id && !this.device_id && !this.android_id) {
        next(new Error('At least one identifier must be provided'));
    } else {
        next();
    }
});

const DeviceIdentifier = mongoose.model('DeviceIdentifier', deviceIdentifierSchema);

app.post('/row/device_identifiers', async (req, res) => {
    try {
        const { hardware_id, device_id, android_id } = req.body;

        // Check if any of the identifiers already exist in the database
        const existingRow = await DeviceIdentifier.findOne({
            $or: [
                { hardware_id: hardware_id },
                { device_id: device_id },
                { android_id: android_id }
            ]
        });

        if (existingRow) {
            // If a row is found, handle and update conflicting or missing identifiers
            let updated = false;  // To track if any update happens

            // Check and handle the hardware_id
            if (hardware_id) {
                // Update if hardware_id is missing or if there's a conflict with the existing value
                if (!existingRow.hardware_id || existingRow.hardware_id !== hardware_id) {
                    existingRow.hardware_id = hardware_id;
                    updated = true;
                }
            }

            // Check and handle the device_id
            if (device_id) {
                // Update if device_id is missing or if there's a conflict with the existing value
                if (!existingRow.device_id || existingRow.device_id !== device_id) {
                    existingRow.device_id = device_id;
                    updated = true;
                }
            }

            // Check and handle the android_id
            if (android_id) {
                // Update if android_id is missing or if there's a conflict with the existing value
                if (!existingRow.android_id || existingRow.android_id !== android_id) {
                    existingRow.android_id = android_id;
                    updated = true;
                }
            }

            // Save the updated row if any update occurred
            if (updated) {
                await existingRow.save();
            }

            return res.json({
                message: 'Row found and updated successfully.',
                random_id: existingRow.random_id
            });
        } else {
            // If no row is found, create a new one with a random_id
            const newRandomId = uuidv4();
            const newRow = new DeviceIdentifier({
                random_id: newRandomId,
                hardware_id: hardware_id || null,
                device_id: device_id || null,
                android_id: android_id || null
            });

            await newRow.save(); // Save the new row

            return res.json({
                message: 'New row created successfully.',
                random_id: newRandomId
            });
        }
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ message: 'Something went wrong!', error: err.message });
    }
});



// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!', 
        error: err.message 
    });
});

// Server Configuration
const PORT = process.env.PORT || 3000;
app.listen(4321, () => {
    console.log(`Server running on port ${4321}`);
});

// Optional: Graceful Shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});