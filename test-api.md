# Hotel & Room Management — API Test Examples

## Prerequisites

```bash
# 1. Start MongoDB (must be running locally on port 27017, or update MONGO_URI in .env)

# 2. Install dependencies & start the server
npm install
npm run server
```

## Generate an Admin JWT (for protected endpoints)

Run this one-liner to get a test token (valid 24h):

```bash
node -e "import('jsonwebtoken').then(j=>console.log(j.default.sign({id:'admin1',email:'admin@test.com',role:'admin'},'changeme_dev_secret',{expiresIn:'1d'})))"
```

Copy the output and use it as `<TOKEN>` in the commands below.

---

## Health Check

```bash
curl http://localhost:5000/api/health
```

Expected:
```json
{ "success": true, "message": "Hotel Booking API is running." }
```

---

## Hotels

### Create Hotel (Admin)

```bash
curl -X POST http://localhost:5000/api/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "name": "The Grand Palace",
    "location": {
      "city": "Mumbai",
      "address": "123 Marine Drive, Colaba",
      "coordinates": { "lat": 18.9217, "lng": 72.8332 }
    },
    "rating": 4.5,
    "amenities": ["wifi", "pool", "spa", "gym"],
    "images": ["https://example.com/hotel1.jpg"]
  }'
```

### List All Hotels (Public)

```bash
curl http://localhost:5000/api/hotels
```

### Filter Hotels by City

```bash
curl "http://localhost:5000/api/hotels?city=mumbai"
```

### Filter by Price Range

```bash
curl "http://localhost:5000/api/hotels?minPrice=1000&maxPrice=5000"
```

### Filter by Rating

```bash
curl "http://localhost:5000/api/hotels?rating=4"
```

### Filter by Amenities (comma-separated, must match ALL)

```bash
curl "http://localhost:5000/api/hotels?amenities=wifi,pool"
```

### Combined Filters

```bash
curl "http://localhost:5000/api/hotels?city=mumbai&minPrice=2000&rating=4&amenities=wifi"
```

### Get Hotel by ID (Public)

```bash
curl http://localhost:5000/api/hotels/<HOTEL_ID>
```

### Update Hotel (Admin)

```bash
curl -X PUT http://localhost:5000/api/hotels/<HOTEL_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "rating": 4.8,
    "amenities": ["wifi", "pool", "spa", "gym", "restaurant"]
  }'
```

### Delete Hotel (Admin)

```bash
curl -X DELETE http://localhost:5000/api/hotels/<HOTEL_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Rooms

### Add Room to Hotel (Admin)

```bash
curl -X POST http://localhost:5000/api/hotels/<HOTEL_ID>/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "roomNumber": "101",
    "type": "Deluxe",
    "capacity": 2,
    "basePrice": 4500,
    "amenities": ["minibar", "ocean-view", "king-bed"],
    "images": ["https://example.com/room101.jpg"]
  }'
```

### Add Another Room

```bash
curl -X POST http://localhost:5000/api/hotels/<HOTEL_ID>/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "roomNumber": "102",
    "type": "Single",
    "capacity": 1,
    "basePrice": 1500,
    "amenities": ["wifi"]
  }'
```

### Update Room (Admin)

```bash
curl -X PUT http://localhost:5000/api/hotels/<HOTEL_ID>/rooms/<ROOM_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "basePrice": 5000,
    "amenities": ["minibar", "ocean-view", "king-bed", "jacuzzi"]
  }'
```

### Check Room Availability (Public)

```bash
curl http://localhost:5000/api/hotels/<HOTEL_ID>/rooms/<ROOM_ID>/availability
```

Expected:
```json
{
  "success": true,
  "hotelId": "...",
  "roomId": "...",
  "roomNumber": "101",
  "type": "Deluxe",
  "isAvailable": true
}
```

### Delete Room (Admin)

```bash
curl -X DELETE http://localhost:5000/api/hotels/<HOTEL_ID>/rooms/<ROOM_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Error Response Examples

### Missing Auth Token (401)

```bash
curl -X POST http://localhost:5000/api/hotels \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'
```

```json
{ "success": false, "message": "Access denied. No token provided." }
```

### Non-Admin Token (403)

Generate a non-admin token:
```bash
node -e "import('jsonwebtoken').then(j=>console.log(j.default.sign({id:'user1',email:'user@test.com',role:'user'},'changeme_dev_secret',{expiresIn:'1d'})))"
```

```bash
curl -X POST http://localhost:5000/api/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <NON_ADMIN_TOKEN>" \
  -d '{"name": "Test"}'
```

```json
{ "success": false, "message": "Access denied. Admin privileges required." }
```

### Validation Error (400)

```bash
curl -X POST http://localhost:5000/api/hotels/<HOTEL_ID>/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"roomNumber": "201", "type": "Penthouse", "capacity": 2, "basePrice": 9000}'
```

```json
{ "success": false, "message": "Invalid room type \"Penthouse\". Choose from: Single, Double, Suite, Deluxe" }
```

### Not Found (404)

```bash
curl http://localhost:5000/api/hotels/000000000000000000000000
```

```json
{ "success": false, "message": "Hotel not found." }
```
