// ===========================================================================
// STATIC DEMO BACKEND — lets the dashboard pages run on GitHub Pages with no
// server. It intercepts the page's /api/... calls and answers them from the
// sample data below (real snapshot of the project's data) held in memory.
// Nothing is saved: reloading the page resets the demo. Not for real use.
// ===========================================================================
(function () {
  const SNAP = {"facilities":{"ambulances":[{"code":"KA-19-AB-1001","hospital_id":1,"id":1,"lat":12.8926,"lon":74.8489,"region_id":1,"status":"available"},{"code":"KA-19-AB-1002","hospital_id":2,"id":2,"lat":12.8698,"lon":74.842,"region_id":1,"status":"available"},{"code":"KA-19-AB-1003","hospital_id":1,"id":3,"lat":12.8926,"lon":74.8489,"region_id":1,"status":"available"},{"code":"KA-19-AB-1004","hospital_id":2,"id":4,"lat":12.8698,"lon":74.842,"region_id":1,"status":"available"},{"code":"KA-19-AB-1005","hospital_id":1,"id":5,"lat":12.8926,"lon":74.8489,"region_id":1,"status":"available"},{"code":"KA-19-AB-4001","hospital_id":7,"id":15,"lat":13.0705,"lon":74.9885,"region_id":4,"status":"available"},{"code":"KA-19-AB-4002","hospital_id":8,"id":16,"lat":13.0648,"lon":74.9942,"region_id":4,"status":"available"},{"code":"KA-19-AB-4003","hospital_id":7,"id":17,"lat":13.0705,"lon":74.9885,"region_id":4,"status":"available"},{"code":"KA-20-AB-2001","hospital_id":3,"id":6,"lat":13.1252,"lon":74.7581,"region_id":2,"status":"available"},{"code":"KA-20-AB-2002","hospital_id":4,"id":7,"lat":13.131,"lon":74.7702,"region_id":2,"status":"available"},{"code":"KA-20-AB-2003","hospital_id":3,"id":8,"lat":13.1252,"lon":74.7581,"region_id":2,"status":"available"},{"code":"KA-20-AB-2004","hospital_id":4,"id":9,"lat":13.131,"lon":74.7702,"region_id":2,"status":"available"},{"code":"KA-20-AB-3001","hospital_id":5,"id":10,"lat":13.3389,"lon":74.7477,"region_id":3,"status":"available"},{"code":"KA-20-AB-3002","hospital_id":6,"id":11,"lat":13.3422,"lon":74.7461,"region_id":3,"status":"available"},{"code":"KA-20-AB-3003","hospital_id":5,"id":12,"lat":13.3389,"lon":74.7477,"region_id":3,"status":"available"},{"code":"KA-20-AB-3004","hospital_id":6,"id":13,"lat":13.3422,"lon":74.7461,"region_id":3,"status":"available"},{"code":"KA-20-AB-3005","hospital_id":5,"id":14,"lat":13.3389,"lon":74.7477,"region_id":3,"status":"available"}],"hospitals":[{"id":6,"lat":13.3422,"lon":74.7461,"name":"Dr. TMA Pai Hospital","phone":"0820-2529881","region_id":3},{"id":1,"lat":12.8926,"lon":74.8489,"name":"Father Muller Medical College Hospital","phone":"0824-2238000","region_id":1},{"id":2,"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444","region_id":1},{"id":5,"lat":13.3389,"lon":74.7477,"name":"Kasturba Medical College Hospital Udupi","phone":"0820-2922761","region_id":3},{"id":7,"lat":13.0705,"lon":74.9885,"name":"Moodbidri Government Hospital","phone":"08258-236236","region_id":4},{"id":3,"lat":13.1252,"lon":74.7581,"name":"Padubidri Community Health Centre","phone":"0820-2560022","region_id":2},{"id":8,"lat":13.0648,"lon":74.9942,"name":"Sri Dharmasthala Hospital Moodbidri","phone":"08258-236500","region_id":4},{"id":4,"lat":13.131,"lon":74.7702,"name":"Sri Sai Hospital Padubidri","phone":"0820-2560101","region_id":2},{"id":9,"lat":13.068672477723503,"lon":74.99274248788456,"name":"alvas health centre","phone":"1234569456","region_id":4}],"police_stations":[{"id":11,"lat":13.0512,"lon":74.9743,"name":"Bailoor Police Outpost","phone":"08258-236300","region_id":4},{"id":2,"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215","region_id":1},{"id":9,"lat":13.3757,"lon":74.7273,"name":"Kalyanpur Police Station","phone":"0820-2545100","region_id":3},{"id":6,"lat":13.2225,"lon":74.7461,"name":"Kaup Police Outpost","phone":"0820-2586200","region_id":2},{"id":1,"lat":12.9083,"lon":74.8544,"name":"Mangalore City Police Station (Kavoor)","phone":"0824-2220500","region_id":1},{"id":8,"lat":13.3525,"lon":74.7912,"name":"Manipal Police Station","phone":"0820-2571100","region_id":3},{"id":10,"lat":13.0693,"lon":74.9911,"name":"Moodbidri Police Station","phone":"08258-236100","region_id":4},{"id":5,"lat":13.1245,"lon":74.7658,"name":"Padubidri Police Station","phone":"0820-2560033","region_id":2},{"id":3,"lat":12.9482,"lon":74.8123,"name":"Panambur Police Station","phone":"0824-2407100","region_id":1},{"id":4,"lat":13.0113,"lon":74.7967,"name":"Surathkal Police Station","phone":"0824-2478100","region_id":1},{"id":7,"lat":13.3417,"lon":74.7448,"name":"Udupi Town Police Station","phone":"0820-2520100","region_id":3}],"regions":[{"id":1,"lat":12.9141,"lon":74.856,"name":"Mangalore"},{"id":4,"lat":13.068,"lon":74.9906,"name":"Moodbidri"},{"id":2,"lat":13.1268,"lon":74.7674,"name":"Padubidri"},{"id":3,"lat":13.3409,"lon":74.7421,"name":"Udupi"}]},"alerts":[{"ai_review":null,"ambulance":{"code":"KA-19-AB-1005","lat":12.8926,"lon":74.8489,"status":"available"},"created_at":"2026-10-10T07:38:23+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":29,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-10T07:39:14+00:00","status":"resolved","user":null,"victim_lat":12.873012,"victim_lon":74.851004},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1003","lat":12.8926,"lon":74.8489,"status":"available"},"created_at":"2026-10-10T07:35:00+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":28,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -39 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-10T07:39:16+00:00","status":"resolved","user":null,"victim_lat":12.873034,"victim_lon":74.850953},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1001","lat":12.8926,"lon":74.8489,"status":"available"},"created_at":"2026-10-10T07:34:31+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":27,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -36 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-10T07:39:17+00:00","status":"resolved","user":null,"victim_lat":12.873046,"victim_lon":74.850953},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1004","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-10T07:31:48+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":26,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-10T07:39:20+00:00","status":"resolved","user":null,"victim_lat":12.873044,"victim_lon":74.851043},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-10T07:20:49+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":25,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -34 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-10T07:39:21+00:00","status":"resolved","user":null,"victim_lat":12.873031,"victim_lon":74.851109},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-10T07:19:20+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":24,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-10T07:20:22+00:00","status":"resolved","user":null,"victim_lat":12.873042,"victim_lon":74.851114},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-09T05:33:11+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":23,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -52 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-09T05:37:12+00:00","status":"resolved","user":null,"victim_lat":12.873089,"victim_lon":74.851134},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1004","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-09T05:32:29+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":22,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-09T05:32:59+00:00","status":"resolved","user":null,"victim_lat":12.873132,"victim_lon":74.851204},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T12:01:30+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":21,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -85 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-09T05:33:00+00:00","status":"resolved","user":null,"victim_lat":12.873131,"victim_lon":74.85119},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T12:00:52+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":20,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -90 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-05T12:00:58+00:00","status":"resolved","user":null,"victim_lat":12.873136,"victim_lon":74.851178},{"ai_review":{"confidence":0.718,"label":"Yes"},"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T11:59:09+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":19,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -87 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-05T12:00:49+00:00","status":"resolved","user":null,"victim_lat":12.873059,"victim_lon":74.851227},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T11:58:59+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":18,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -87 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-05T11:59:06+00:00","status":"resolved","user":null,"victim_lat":12.873071,"victim_lon":74.851231},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T11:57:41+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":17,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -88 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-05T11:57:45+00:00","status":"resolved","user":null,"victim_lat":12.873048,"victim_lon":74.851096},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T11:57:32+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":16,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-05T11:57:38+00:00","status":"resolved","user":null,"victim_lat":12.873041,"victim_lon":74.851092},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T11:38:42+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":15,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-05T11:57:29+00:00","status":"resolved","user":null,"victim_lat":12.873192,"victim_lon":74.850799},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1004","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T11:32:39+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":14,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-05T11:34:49+00:00","status":"resolved","user":null,"victim_lat":12.87316,"victim_lon":74.851},{"ai_review":{"confidence":0.718,"label":"Yes"},"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-10-05T11:32:39+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":13,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-10-05T11:34:58+00:00","status":"resolved","user":null,"victim_lat":12.87316,"victim_lon":74.851093},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1003","lat":12.8926,"lon":74.8489,"status":"available"},"created_at":"2026-09-01T06:46:14+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":12,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -54 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-15T09:53:30+00:00","status":"resolved","user":null,"victim_lat":12.873107,"victim_lon":74.851005},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1001","lat":12.8926,"lon":74.8489,"status":"available"},"created_at":"2026-09-01T06:46:10+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":11,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -54 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-15T09:53:31+00:00","status":"resolved","user":null,"victim_lat":12.873109,"victim_lon":74.851},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1004","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-09-01T06:46:08+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":10,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-15T09:53:33+00:00","status":"resolved","user":null,"victim_lat":12.873101,"victim_lon":74.851011},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-09-01T06:43:57+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":9,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -52 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-15T09:53:36+00:00","status":"resolved","user":null,"victim_lat":12.87316,"victim_lon":74.851023},{"ai_review":null,"ambulance":{"code":"KA-19-AB-4003","lat":13.0705,"lon":74.9885,"status":"available"},"created_at":"2026-09-01T06:41:37+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":8,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -52 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-01T06:43:39+00:00","status":"resolved","user":null,"victim_lat":12.872908,"victim_lon":74.85111},{"ai_review":null,"ambulance":{"code":"KA-19-AB-4001","lat":13.0705,"lon":74.9885,"status":"available"},"created_at":"2026-09-01T06:41:31+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":7,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-01T06:43:40+00:00","status":"resolved","user":null,"victim_lat":12.872907,"victim_lon":74.851119},{"ai_review":null,"ambulance":{"code":"KA-19-AB-4002","lat":13.0648,"lon":74.9942,"status":"available"},"created_at":"2026-09-01T06:40:56+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":6,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -53 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-01T06:43:41+00:00","status":"resolved","user":null,"victim_lat":12.872929,"victim_lon":74.851081},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1005","lat":12.8926,"lon":74.8489,"status":"available"},"created_at":"2026-09-01T06:40:52+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":5,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -52 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-01T06:43:41+00:00","status":"resolved","user":null,"victim_lat":12.872933,"victim_lon":74.851116},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1003","lat":12.8926,"lon":74.8489,"status":"available"},"created_at":"2026-09-01T06:40:20+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":4,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -51 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-01T06:43:42+00:00","status":"resolved","user":null,"victim_lat":12.872955,"victim_lon":74.851172},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1001","lat":12.8926,"lon":74.8489,"status":"available"},"created_at":"2026-09-01T06:40:15+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":3,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -52 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-01T06:43:42+00:00","status":"resolved","user":null,"victim_lat":12.872969,"victim_lon":74.851193},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1004","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-09-01T06:40:10+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":2,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI -51 dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-01T06:43:43+00:00","status":"resolved","user":null,"victim_lat":12.872919,"victim_lon":74.851265},{"ai_review":null,"ambulance":{"code":"KA-19-AB-1002","lat":12.8698,"lon":74.842,"status":"available"},"created_at":"2026-09-01T06:39:37+00:00","device_id":"NANO-LORA-BRIDGE","guest_label":"VISHWAS (ID 1236)","hospital":{"lat":12.8698,"lon":74.842,"name":"KMC Hospital Mangalore","phone":"0824-2444444"},"id":1,"message":"SOS button pressed (relayed via LoRa -> Nano, RSSI ? dBm)","police_station":{"lat":12.8534,"lon":74.8395,"name":"Bunder Police Station Mangalore","phone":"0824-2440215"},"region":"Mangalore","resolved_at":"2026-09-01T06:43:43+00:00","status":"resolved","user":null,"victim_lat":12.872921,"victim_lon":74.85124}],"status":{"alerts_by_region":[{"count":29,"region":"Mangalore"},{"count":0,"region":"Moodbidri"},{"count":0,"region":"Padubidri"},{"count":0,"region":"Udupi"}],"ambulances_available":17,"ambulances_total":17,"dispatched":0,"pending":0,"resolved":29,"total_alerts":29},"analytics":{"alerts_by_date":[{"count":12,"date":"2026-09-01"},{"count":9,"date":"2026-10-05"},{"count":2,"date":"2026-10-09"},{"count":6,"date":"2026-10-10"}],"by_hospital":[{"hospital":"KMC Hospital Mangalore","resolved":29,"total":29},{"hospital":"Father Muller Medical College Hospital","resolved":0,"total":0},{"hospital":"Padubidri Community Health Centre","resolved":0,"total":0},{"hospital":"Sri Sai Hospital Padubidri","resolved":0,"total":0},{"hospital":"Kasturba Medical College Hospital Udupi","resolved":0,"total":0},{"hospital":"Dr. TMA Pai Hospital","resolved":0,"total":0},{"hospital":"Moodbidri Government Hospital","resolved":0,"total":0},{"hospital":"Sri Dharmasthala Hospital Moodbidri","resolved":0,"total":0},{"hospital":"alvas health centre","resolved":0,"total":0}],"by_region":[{"region":"Mangalore","resolved":29,"total":29},{"region":"Padubidri","resolved":0,"total":0},{"region":"Udupi","resolved":0,"total":0},{"region":"Moodbidri","resolved":0,"total":0}],"resolved_by_date":[{"count":8,"date":"2026-09-01"},{"count":4,"date":"2026-09-15"},{"count":8,"date":"2026-10-05"},{"count":3,"date":"2026-10-09"},{"count":6,"date":"2026-10-10"}],"status_counts":{"resolved":29}},"users":[{"ai_breakdown":{"no":0,"yes":0},"alerts_count":0,"created_at":"2026-10-10T07:17:27+00:00","id":1,"name":"user","phone":"123xxxx899","status_breakdown":{"dispatched":0,"pending":0,"resolved":0}}],"training_analytics":{"by_ambulance_assigned":[{"label":"Assigned","satisfied":58,"total":131},{"label":"Not assigned","satisfied":48,"total":269}],"by_hospital_assigned":[{"label":"Assigned","satisfied":70,"total":130},{"label":"Not assigned","satisfied":36,"total":270}],"by_place":[{"place":"Udupi","satisfied":41,"total":126},{"place":"Mangalore","satisfied":37,"total":125},{"place":"Moodabidri","satisfied":21,"total":81},{"place":"Padubidri","satisfied":7,"total":68}],"by_police_assigned":[{"label":"Assigned","satisfied":63,"total":110},{"label":"Not assigned","satisfied":43,"total":290}],"feature_importances":[{"feature":"police_station_assigned","total":0.2414},{"feature":"hospital_assigned","total":0.2318},{"feature":"ambulance_assigned","total":0.159},{"feature":"longitude","total":0.1174},{"feature":"area","total":0.1052},{"feature":"latitude","total":0.1045},{"feature":"Padubidri","total":0.0143},{"feature":"Udupi","total":0.0132},{"feature":"Mangalore","total":0.0075},{"feature":"Moodabidri","total":0.0057}],"live_predictions_logged":5,"model_available":true,"overall_satisfaction_rate":26.5,"total_rows":400},"training_diagnostics":{"class_balance":{"no":294,"yes":106},"confusion_matrix":{"labels":["No","Yes"],"matrix":[[290,4],[20,86]]},"correlation":{"labels":["latitude","longitude","area","hospital_assigned","police_station_assigned","ambulance_assigned","satisfied_customer"],"matrix":[[1.0,-0.608,0.054,-0.063,0.028,-0.006,0.028],[-0.608,1.0,-0.046,0.031,-0.044,-0.038,0.006],[0.054,-0.046,1.0,-0.015,0.045,0.08,0.004],[-0.063,0.031,-0.015,1.0,0.027,-0.018,0.43],[0.028,-0.044,0.045,0.027,1.0,-0.048,0.429],[-0.006,-0.038,0.08,-0.018,-0.048,1.0,0.281],[0.028,0.006,0.004,0.43,0.429,0.281,1.0]]},"metrics":{"accuracy":0.94,"f1":0.878,"precision":0.956,"recall":0.811},"model_available":true,"roc":{"auc":0.968,"fpr":[0.0,0.0,0.0,0.0034,0.0034,0.0068,0.0068,0.0136,0.0136,0.017,0.017,0.0204,0.0204,0.0272,0.0272,0.034,0.034,0.068,0.068,0.0714,0.0714,0.0748,0.0748,0.085,0.085,0.1156,0.1156,0.1565,0.1565,0.2483,0.2483,0.2619,0.2619,0.2993,0.2993,0.6531,0.6531,0.8197,0.8197,0.9762,0.983,1.0],"tpr":[0.0,0.0094,0.6132,0.6132,0.717,0.717,0.7547,0.7547,0.8113,0.8113,0.8208,0.8208,0.8302,0.8302,0.8491,0.8491,0.8679,0.8679,0.8868,0.8868,0.8962,0.8962,0.9151,0.9151,0.9245,0.9245,0.9434,0.9434,0.9528,0.9528,0.9623,0.9623,0.9717,0.9717,0.9811,0.9811,0.9906,0.9906,1.0,1.0,1.0,1.0]},"rows_evaluated":400}};
  const realFetch = window.fetch.bind(window);

  // --- state (deep copies so the demo can be mutated freely) ---
  const fac = JSON.parse(JSON.stringify(SNAP.facilities));
  const alerts = JSON.parse(JSON.stringify(SNAP.alerts));          // newest first
  const users = JSON.parse(JSON.stringify(SNAP.users)).map((u) => ({ id: u.id, name: u.name, phone: u.phone, created_at: u.created_at }));
  let nextAlertId = alerts.reduce((m, a) => Math.max(m, a.id), 0) + 1;
  let nextUserId = users.reduce((m, u) => Math.max(m, u.id), 0) + 1;

  // Shift sample timestamps so the newest alert looks recent ("3m ago").
  if (alerts.length) {
    const newest = Math.max(...alerts.map((a) => new Date(a.created_at).getTime()));
    const delta = Date.now() - 3 * 60 * 1000 - newest;
    alerts.forEach((a) => {
      a.created_at = new Date(new Date(a.created_at).getTime() + delta).toISOString();
      if (a.resolved_at) a.resolved_at = new Date(new Date(a.resolved_at).getTime() + delta).toISOString();
    });
  }

  // Make sure the demo opens with live activity: if every sample alert is
  // already resolved, re-open the two newest (one dispatched, one pending)
  // so the red blinking pins and the Approve button are visible.
  if (alerts.length >= 2 && alerts.every((a) => a.status === "resolved")) {
    const [a1, a2] = alerts;
    a1.status = "dispatched"; a1.resolved_at = null;
    if (!a1.ambulance) {
      let best = null, bd = Infinity;
      fac.ambulances.forEach((x) => {
        const d = Math.hypot(x.lat - a1.victim_lat, x.lon - a1.victim_lon);
        if (d < bd) { bd = d; best = x; }
      });
      if (best) a1.ambulance = { code: best.code, status: "dispatched", lat: best.lat, lon: best.lon };
    }
    if (a1.ambulance) { const x = fac.ambulances.find((q) => q.code === a1.ambulance.code); if (x) x.status = "dispatched"; }
    a2.status = "pending"; a2.resolved_at = null; a2.ambulance = null;
  }

  // --- helpers ---
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
  const err = (msg, status = 400) => json({ error: msg }, status);

  function dist(lat1, lon1, lat2, lon2) {
    const R = 6371, rad = (d) => (d * Math.PI) / 180;
    const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
  function nearest(list, lat, lon) {
    let best = null, bd = Infinity;
    list.forEach((x) => { const d = dist(lat, lon, x.lat, x.lon); if (d < bd) { bd = d; best = x; } });
    return { row: best, d: bd };
  }
  const hosp = (h) => h && { name: h.name, phone: h.phone, lat: h.lat, lon: h.lon };
  const amb = (a) => a && { code: a.code, status: a.status, lat: a.lat, lon: a.lon };
  const ambByCode = (code) => fac.ambulances.find((a) => a.code === code);
  const body = (opts) => { try { return JSON.parse((opts && opts.body) || "{}"); } catch (e) { return {}; } };
  const adminOk = (opts) => !!(opts && opts.headers && (opts.headers["X-Admin-Token"] || opts.headers["x-admin-token"]));

  function freeAmbulanceFor(alert) {
    if (alert.ambulance) {
      const a = ambByCode(alert.ambulance.code);
      if (a) a.status = "available";
      alert.ambulance = null;
    }
  }

  function createAlert(d) {
    const lat = parseFloat(d.lat), lon = parseFloat(d.lon);
    if (isNaN(lat) || isNaN(lon)) return null;
    const region = nearest(fac.regions, lat, lon).row;
    const h = nearest(fac.hospitals, lat, lon).row;
    const p = nearest(fac.police_stations, lat, lon).row;
    let a = null;
    if (!d.require_approval) {
      a = nearest(fac.ambulances.filter((x) => x.status === "available"), lat, lon).row;
      if (a) a.status = "dispatched";
    }
    const user = d.user_id ? users.find((u) => u.id === Number(d.user_id)) : null;
    const alert = {
      id: nextAlertId++,
      device_id: d.device_id || "UNKNOWN-DEVICE",
      user: user ? { id: user.id, name: user.name, phone: user.phone } : null,
      guest_label: user ? null : (d.guest_label || ("Guest-" + Math.floor(1000 + Math.random() * 9000))),
      victim_lat: lat, victim_lon: lon,
      message: d.message || "SOS - immediate assistance required",
      status: a ? "dispatched" : "pending",
      created_at: new Date().toISOString(), resolved_at: null,
      region: region ? region.name : null,
      hospital: hosp(h), police_station: hosp(p), ambulance: amb(a),
      ai_review: null,
    };
    alerts.unshift(alert);
    return alert;
  }

  function statusSummary() {
    const c = (s) => alerts.filter((a) => a.status === s).length;
    return {
      total_alerts: alerts.length, pending: c("pending"), dispatched: c("dispatched"), resolved: c("resolved"),
      ambulances_total: fac.ambulances.length,
      ambulances_available: fac.ambulances.filter((a) => a.status === "available").length,
      alerts_by_region: fac.regions.map((r) => ({ region: r.name, count: alerts.filter((a) => a.region === r.name).length })),
    };
  }

  function analytics() {
    const byDate = {};
    alerts.filter((a) => a.status === "resolved" && a.resolved_at).forEach((a) => {
      const d = a.resolved_at.slice(0, 10); byDate[d] = (byDate[d] || 0) + 1;
    });
    const group = (key, names) => names.map((n) => {
      const rows = alerts.filter((a) => (key === "hospital" ? (a.hospital && a.hospital.name) : a.region) === n);
      return { [key]: n, total: rows.length, resolved: rows.filter((a) => a.status === "resolved").length };
    }).sort((x, y) => y.total - x.total);
    const sc = {}; alerts.forEach((a) => { sc[a.status] = (sc[a.status] || 0) + 1; });
    return {
      resolved_by_date: Object.keys(byDate).sort().map((d) => ({ date: d, count: byDate[d] })),
      alerts_by_date: [],
      by_hospital: group("hospital", fac.hospitals.map((h) => h.name)),
      by_region: group("region", fac.regions.map((r) => r.name)),
      status_counts: sc,
    };
  }

  function lookup(d) {
    let lat = parseFloat(d.lat), lon = parseFloat(d.lon), label;
    if (isNaN(lat) || isNaN(lon)) {
      const q = (d.place || "").trim().toLowerCase();
      if (!q) return [400, { error: "Enter coordinates or a place name." }];
      const all = [...fac.regions, ...fac.hospitals, ...fac.police_stations];
      const hit = all.find((x) => x.name.toLowerCase().includes(q));
      if (!hit) return [404, { error: `Couldn't find "${d.place}" in this demo — try a place like "Mangalore" or "Udupi", or enter coordinates.` }];
      lat = hit.lat; lon = hit.lon; label = hit.name;
    } else label = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    const f = (n, fields) => n.row && Object.assign(Object.fromEntries(fields.map((k) => [k, n.row[k]])), { distance_km: Math.round(n.d * 100) / 100 });
    return [200, {
      query_lat: lat, query_lon: lon, resolved_label: label,
      region: f(nearest(fac.regions, lat, lon), ["id", "name", "lat", "lon"]),
      hospital: f(nearest(fac.hospitals, lat, lon), ["id", "name", "phone", "lat", "lon"]),
      police_station: f(nearest(fac.police_stations, lat, lon), ["id", "name", "phone", "lat", "lon"]),
      ambulance: f(nearest(fac.ambulances.filter((a) => a.status === "available"), lat, lon), ["id", "code", "lat", "lon"]),
    }];
  }

  function route(method, url, opts) {
    const u = new URL(url, location.href);
    const path = u.pathname.replace(/^.*?\/api\//, "/api/");
    let m;
    if (path === "/api/facilities") return json(fac);
    if (path === "/api/alerts" && method === "GET") {
      const uid = u.searchParams.get("user_id");
      return json(uid ? alerts.filter((a) => a.user && a.user.id === Number(uid)) : alerts);
    }
    if (path === "/api/status") return json(statusSummary());
    if (path === "/api/analytics") return json(analytics());
    if (path === "/api/sos" && method === "POST") {
      const a = createAlert(body(opts));
      return a ? json(a, 201) : err("lat and lon are required numeric fields");
    }
    if ((m = path.match(/^\/api\/alerts\/(\d+)\/(resolve|approve|status)$/)) && method === "POST") {
      const a = alerts.find((x) => x.id === Number(m[1]));
      if (!a) return err("not found", 404);
      if (m[2] === "resolve") {
        freeAmbulanceFor(a); a.status = "resolved"; a.resolved_at = new Date().toISOString();
      } else if (m[2] === "approve") {
        const free = nearest(fac.ambulances.filter((x) => x.status === "available"), a.victim_lat, a.victim_lon).row;
        if (!free) return err("No ambulance is free right now — try again shortly.", 409);
        free.status = "dispatched"; a.ambulance = amb(free); a.status = "dispatched";
      } else {
        freeAmbulanceFor(a); a.status = body(opts).status || "pending";
      }
      return json(a);
    }
    if (path === "/api/lookup" && method === "POST") { const [s, o] = lookup(body(opts)); return json(o, s); }
    if (path === "/api/login" && method === "POST") {
      const d = body(opts);
      if (!d.phone || !d.password) return err("That phone number and password don't match any account.", 401);
      let usr = users.find((x) => x.phone === d.phone);
      if (!usr) { usr = { id: nextUserId++, name: "Demo user", phone: d.phone, created_at: new Date().toISOString() }; users.push(usr); }
      return json(usr);
    }
    if (path === "/api/signup" && method === "POST") {
      const d = body(opts);
      if (!d.name || !d.phone || !d.password) return err("Name, phone, and password are all required.");
      if (d.password.length < 4) return err("Password must be at least 4 characters.");
      const usr = { id: nextUserId++, name: d.name, phone: d.phone, created_at: new Date().toISOString() };
      users.push(usr);
      return json(usr, 201);
    }
    if (path.startsWith("/api/admin/")) {
      if (!adminOk(opts)) return err("unauthorized", 401);
      if (path === "/api/admin/verify") return json({ ok: true });
      if (path === "/api/admin/users") {
        return json(users.map((x) => {
          const mine = alerts.filter((a) => a.user && a.user.id === x.id);
          const c = (s) => mine.filter((a) => a.status === s).length;
          return Object.assign({}, x, {
            alerts_count: mine.length,
            status_breakdown: { pending: c("pending"), dispatched: c("dispatched"), resolved: c("resolved") },
            ai_breakdown: { yes: 0, no: 0 }, last_alert_at: mine.length ? mine[0].created_at : null,
          });
        }));
      }
      if (path === "/api/admin/training_analytics") return json(SNAP.training_analytics);
      if (path === "/api/admin/training_diagnostics") return json(SNAP.training_diagnostics);
      const d = body(opts);
      if (method === "POST" && path === "/api/admin/regions") {
        const r = { id: Date.now(), name: d.name, lat: d.lat, lon: d.lon, telegram_configured: false };
        fac.regions.push(r); return json(r, 201);
      }
      if (method === "POST" && path === "/api/admin/hospitals") {
        const r = { id: Date.now(), region_id: Number(d.region_id), name: d.name, lat: d.lat, lon: d.lon, phone: d.phone };
        fac.hospitals.push(r); return json(r, 201);
      }
      if (method === "POST" && path === "/api/admin/police_stations") {
        const r = { id: Date.now(), region_id: Number(d.region_id), name: d.name, lat: d.lat, lon: d.lon, phone: d.phone };
        fac.police_stations.push(r); return json(r, 201);
      }
      if (method === "POST" && path === "/api/admin/ambulances") {
        const r = { id: Date.now(), hospital_id: Number(d.hospital_id), region_id: Number(d.region_id), code: d.code, status: "available", lat: d.lat, lon: d.lon };
        const h = fac.hospitals.find((x) => x.id === r.hospital_id);
        if (h && (r.lat == null || isNaN(r.lat))) { r.lat = h.lat; r.lon = h.lon; }
        fac.ambulances.push(r); return json(r, 201);
      }
      return json({ ok: true });
    }
    return null;
  }

  window.fetch = function (url, opts) {
    const s = typeof url === "string" ? url : (url && url.url) || "";
    if (s.indexOf("/api/") !== -1 && !/^https?:\/\//.test(s)) {
      const res = route(((opts && opts.method) || "GET").toUpperCase(), s, opts);
      if (res) return Promise.resolve(res);
    }
    return realFetch(url, opts);
  };


  // Small corner badge so it's obvious this is the static demo.
  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page || "";
    const b = document.createElement("div");
    b.textContent = page === "admin"
      ? "Static demo · sample data · any passcode works"
      : "Static demo · sample data";
    b.style.cssText = "position:fixed;left:10px;bottom:10px;z-index:99999;background:rgba(15,23,42,.88);color:#e2e8f0;font:12px/1.2 system-ui,sans-serif;padding:6px 10px;border-radius:999px;pointer-events:none;";
    document.body.appendChild(b);
  });
})();
