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
    media_drm_id: { 
        type: String, 
        default: null
    },
    gsf_id: { 
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

const DeviceIdentifier = mongoose.model('DeviceIdentifier', deviceIdentifierSchema);

app.post('/row/device_identifiers', async (req, res) => {
    try {
        const { mediaDrmId, gsfId, androidId } = req.body;
        console.log('Received body:', req.body);

     

        // Prepare search query to find existing document
        const searchQuery = {
            $or: [
                { media_drm_id: mediaDrmId },
                { gsf_id: gsfId },
                { android_id: androidId }
            ].filter(condition =>  Object.values(condition)[0] !== null && 
            Object.values(condition)[0] !== undefined)
        };

        // Find existing document
        let existingDoc = await DeviceIdentifier.findOne(searchQuery);

        if (existingDoc) {
            // Flag to track if document needs updating
            let needsUpdate = false;

            // Update media_drm_id if provided and different
            if (mediaDrmId && existingDoc.media_drm_id !== mediaDrmId) {
                existingDoc.media_drm_id = mediaDrmId;
                needsUpdate = true;
            }

            // Update gsf_id if provided and different
            if (gsfId && existingDoc.gsf_id !== gsfId) {
                existingDoc.gsf_id = gsfId;
                needsUpdate = true;
            }

            // Update android_id if provided and different
            if (androidId && existingDoc.android_id !== androidId) {
                existingDoc.android_id = androidId;
                needsUpdate = true;
            }

            // Save if any updates were made
            if (needsUpdate) {
                await existingDoc.save();
                console.log('Existing document updated');
                return res.json({
                    message: 'Existing document updated successfully.',
                    random_id: existingDoc.random_id
                });
            }

            // If no updates were needed, return existing random_id
            return res.json({
                message: 'Existing document found.',
                random_id: existingDoc.random_id
            });
        } else {
            // Create new document
            const newDoc = new DeviceIdentifier({
                media_drm_id: mediaDrmId || null,
                gsf_id: gsfId || null,
                android_id: androidId || null
            });

            await newDoc.save();
            console.log('New document created');
            return res.json({
                message: 'New document created successfully.',
                random_id: newDoc.random_id
            });
        }
    } catch (err) {
        console.error('Error in POST endpoint:', err);
        return res.status(500).json({ 
            message: 'Something went wrong!', 
            error: err.message 
        });
    }
});

// Server Configuration
const PORT = process.env.PORT || 4321;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});