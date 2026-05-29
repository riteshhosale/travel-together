# Geospatial Location Features - API Documentation

## Overview

The Travel Together app now supports **structured location data** with geospatial indexing for distance-based queries. This enables:

- 📍 **Real-time GPS tracking** for users
- 🗺️ **Find nearby users** within a specified distance
- 🎯 **Trip destinations with coordinates**
- 🔍 **Find nearby trips** based on location

---

## Data Schema

### User Location Fields

```javascript
// currentLocation (GeoJSON Point)
{
  type: "Point",
  coordinates: [longitude, latitude]
}

// locationHistory (Array of past locations with timestamps)
[
  {
    coordinates: [lng, lat],
    timestamp: Date,
    accuracy: Number (optional, in meters)
  }
]
```

### Trip Location Fields

```javascript
// destinationCoordinates (GeoJSON Point)
{
  type: "Point",
  coordinates: [longitude, latitude]
}
```

**Important**: Coordinates are stored as `[longitude, latitude]` following GeoJSON specification (not lat, lng).

---

## User GPS Endpoints

### 1. Update User GPS Location

Update the user's current location and maintain history.

**Endpoint**: `POST /api/user/gps/update`

**Authentication**: Required (Bearer token)

**Request Body**:

```json
{
  "coordinates": [longitude, latitude],
  "accuracy": 10.5
}
```

**Parameters**:

- `coordinates` (required): Array [longitude, latitude]
  - Longitude: -180 to 180
  - Latitude: -90 to 90
- `accuracy` (optional): GPS accuracy in meters

**Response**:

```json
{
  "message": "Location updated successfully",
  "currentLocation": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "lastUpdated": "2026-04-28T10:30:00.000Z"
}
```

**Example**:

```bash
curl -X POST http://localhost:5000/api/user/gps/update \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": [-122.4194, 37.7749],
    "accuracy": 5
  }'
```

---

### 2. Get User Location History

Retrieve user's current location and historical locations.

**Endpoint**: `GET /api/user/gps/history`

**Authentication**: Required

**Query Parameters**: None

**Response**:

```json
{
  "currentLocation": {
    "type": "Point",
    "coordinates": [-122.4194, 37.7749]
  },
  "history": [
    {
      "coordinates": [-122.4194, 37.7749],
      "timestamp": "2026-04-28T10:30:00.000Z",
      "accuracy": 5
    },
    {
      "coordinates": [-122.418, 37.7735],
      "timestamp": "2026-04-28T10:25:00.000Z",
      "accuracy": 8
    }
  ]
}
```

**Example**:

```bash
curl -X GET http://localhost:5000/api/user/gps/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Find Nearby Users

Discover other users within a specified distance radius.

**Endpoint**: `GET /api/user/gps/nearby`

**Authentication**: Required

**Query Parameters**:

- `maxDistance` (optional): Maximum distance in meters. Default: 5000 (5 km)

**Response**:

```json
{
  "distance": 5000,
  "count": 3,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "location": "San Francisco, CA",
      "currentLocation": {
        "type": "Point",
        "coordinates": [-122.419, 37.7748]
      },
      "profileImage": "https://..."
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Jane Smith",
      "location": "San Francisco, CA",
      "currentLocation": {
        "type": "Point",
        "coordinates": [-122.42, 37.7755]
      },
      "profileImage": "https://..."
    }
  ]
}
```

**Example**:

```bash
# Find users within 10 km
curl -X GET "http://localhost:5000/api/user/gps/nearby?maxDistance=10000" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Find users within 5 km (default)
curl -X GET http://localhost:5000/api/user/gps/nearby \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Trip Location Endpoints

### 1. Update Trip Destination with Coordinates

Add or update trip destination with geographical coordinates.

**Endpoint**: `PUT /api/trip/:tripId/destination`

**Authentication**: Required (Must be trip creator/admin)

**Parameters**:

- `tripId` (required): Trip ID in URL path

**Request Body**:

```json
{
  "destination": "Paris, France",
  "destinationCoordinates": {
    "coordinates": [2.3522, 48.8566]
  }
}
```

**Fields**:

- `destination` (optional): Update destination name
- `destinationCoordinates` (optional): Update coordinates with [longitude, latitude]

**Response**:

```json
{
  "message": "Trip destination updated successfully",
  "trip": {
    "_id": "507f1f77bcf86cd799439011",
    "destination": "Paris, France",
    "destinationCoordinates": {
      "type": "Point",
      "coordinates": [2.3522, 48.8566]
    },
    "date": "2026-06-15T00:00:00.000Z",
    "budget": 5000,
    "createdBy": "...",
    "members": [],
    "joinedCount": 0,
    "viewerRole": "admin",
    "canManageTrip": true
  }
}
```

**Example**:

```bash
curl -X PUT http://localhost:5000/api/trip/507f1f77bcf86cd799439011/destination \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Paris, France",
    "destinationCoordinates": {
      "coordinates": [2.3522, 48.8566]
    }
  }'
```

---

### 2. Find Nearby Trips

Discover trips with destinations near a given location.

**Endpoint**: `GET /api/trip/search/nearby`

**Authentication**: Required

**Query Parameters**:

- `longitude` (required): Longitude of search location (-180 to 180)
- `latitude` (required): Latitude of search location (-90 to 90)
- `maxDistance` (optional): Maximum distance in meters. Default: 50000 (50 km)

**Response**:

```json
{
  "searchLocation": {
    "longitude": -122.4194,
    "latitude": 37.7749
  },
  "maxDistance": 50000,
  "count": 2,
  "trips": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "destination": "San Diego, CA",
      "destinationCoordinates": {
        "type": "Point",
        "coordinates": [-117.1611, 32.7157]
      },
      "date": "2026-05-20T00:00:00.000Z",
      "budget": 3000,
      "description": "Beach trip",
      "createdBy": {
        "_id": "507f1f77bcf86cd799439099",
        "name": "John Doe",
        "location": "San Francisco, CA",
        "profileImage": "https://..."
      },
      "members": [],
      "joinedCount": 0,
      "viewerRole": "guest",
      "canManageTrip": false
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "destination": "Lake Tahoe, CA",
      "destinationCoordinates": {
        "type": "Point",
        "coordinates": [-120.0962, 39.0968]
      },
      "date": "2026-06-10T00:00:00.000Z",
      "budget": 2500,
      "description": "Mountain adventure",
      "createdBy": {...},
      "members": [],
      "joinedCount": 0,
      "viewerRole": "guest",
      "canManageTrip": false
    }
  ]
}
```

**Example**:

```bash
# Find trips within 100 km of San Francisco
curl -X GET "http://localhost:5000/api/trip/search/nearby?longitude=-122.4194&latitude=37.7749&maxDistance=100000" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Find trips within 50 km (default)
curl -X GET "http://localhost:5000/api/trip/search/nearby?longitude=-122.4194&latitude=37.7749" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Integration Examples

### Frontend - React Example

```javascript
// Update user GPS location
const updateUserLocation = async (token, coordinates, accuracy) => {
  const response = await fetch("http://localhost:5000/api/user/gps/update", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates,
      accuracy,
    }),
  });
  return response.json();
};

// Get nearby users
const getNearbyUsers = async (token, maxDistance = 5000) => {
  const response = await fetch(
    `http://localhost:5000/api/user/gps/nearby?maxDistance=${maxDistance}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.json();
};

// Find nearby trips
const getNearbyTrips = async (
  token,
  longitude,
  latitude,
  maxDistance = 50000,
) => {
  const response = await fetch(
    `http://localhost:5000/api/trip/search/nearby?longitude=${longitude}&latitude=${latitude}&maxDistance=${maxDistance}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return response.json();
};

// Usage with Geolocation API
navigator.geolocation.watchPosition((position) => {
  const { latitude, longitude, accuracy } = position.coords;
  updateUserLocation(token, [longitude, latitude], accuracy);
});
```

---

## Database Setup

### Run Migration Script

After deploying the updated models, run the migration script to create geospatial indexes:

```bash
cd backend/server
node scripts/migrateGeospatialIndexes.js
```

**What the migration does**:

- Creates 2dsphere index on `User.currentLocation`
- Creates 2dsphere index on `Trip.destinationCoordinates`
- Initializes existing documents with default location values

### Manual Index Creation (MongoDB shell)

```javascript
// Connect to your MongoDB database
use traveltogether

// User collection indexes
db.users.createIndex({ "currentLocation": "2dsphere" })
db.users.createIndex({ "locationHistory.timestamp": -1 })

// Trip collection indexes
db.trips.createIndex({ "destinationCoordinates": "2dsphere" })
db.trips.createIndex({ "createdAt": -1 })
```

---

## Validation Rules

### Coordinate Validation

- **Longitude**: -180 to 180 (required)
- **Latitude**: -90 to 90 (required)
- **Format**: [longitude, latitude] (GeoJSON standard)

### Location History

- Maximum of 100 location entries maintained per user
- Automatically overwrites oldest entries when limit exceeded
- Each entry includes optional accuracy in meters

---

## Error Handling

### Common Errors

**400 Bad Request - Invalid Coordinates**

```json
{
  "message": "Invalid coordinates: longitude must be -180 to 180, latitude must be -90 to 90"
}
```

**401 Unauthorized**

```json
{
  "message": "Unauthorized"
}
```

**403 Forbidden - Not Trip Admin**

```json
{
  "message": "Only trip admin can update destination"
}
```

**404 Not Found**

```json
{
  "message": "User not found"
}
```

---

## Performance Considerations

- Geospatial indexes optimize distance-based queries
- Location history is limited to 100 entries per user to manage document size
- Queries are optimized with `2dsphere` indexes for efficient proximity searches
- Distance values are in **meters**

---

## Best Practices

1. **GPS Updates**: Limit frequency to reduce database load (e.g., update every 10-30 seconds)
2. **Accuracy**: Include GPS accuracy for better data quality
3. **Distance Selection**: Use appropriate maxDistance values:
   - 5,000m (5 km) for nearby users
   - 50,000m (50 km) for nearby trips
   - Adjust based on your use case
4. **Error Handling**: Always handle network errors when fetching location data
5. **Privacy**: Consider user privacy when sharing GPS coordinates
