# 🏥 Doctor Appointment System — Microservices

> A production-grade Spring Boot microservices application for booking doctor appointments, with JWT authentication, service discovery, inter-service communication via OpenFeign, and a React + Vite frontend.

---

## 📋 Table of Contents

1. [Project Description](#-project-description)
2. [Architecture Overview](#-architecture-overview)
3. [Microservices List & Responsibilities](#-microservices-list--responsibilities)
4. [Tech Stack](#-tech-stack)
5. [System Flow — End-to-End Appointment Booking](#-system-flow--end-to-end-appointment-booking)
6. [API Gateway Routing](#-api-gateway-routing)
7. [Service Communication Flow](#-service-communication-flow)
8. [Database Design](#-database-design-per-service)
9. [Security Flow](#-security-flow)
10. [Setup Instructions](#-setup-instructions)
11. [How to Run Each Service](#-how-to-run-each-service)
12. [Environment Variables](#-environment-variables)
13. [Sample API Calls](#-sample-api-calls-postman-ready)
14. [Folder Structure](#-folder-structure)
15. [Future Improvements](#-future-improvements)
16. [Troubleshooting](#-troubleshooting)

---

## 📝 Project Description

The **Doctor Appointment System** is a full-stack application built using a **Microservices Architecture**. Patients can browse doctors filtered by specialty and consultation mode, view available time slots, and book appointments. Admin users can manage all appointments and update their statuses. Authentication is handled via **JWT tokens** issued by a dedicated Auth Service.

**Key Design Decisions:**
- Each microservice owns its own **PostgreSQL database** (Database per Service pattern).
- The **API Gateway** is the single entry point — it validates JWTs and enforces rate limiting before forwarding requests.
- The **Appointment Service** calls the **Doctor Service** internally via **OpenFeign** using a shared `X-Internal-Secret` header to prevent external abuse of internal slot management endpoints.
- Admin users are created manually in the database; all self-registered users are `PATIENT` by default.

---

## 🏗️ Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                         BROWSER (React + Vite)                 │
│                    http://localhost:5173                        │
└─────────────────────────┬──────────────────────────────────────┘
                           │ HTTP Requests (with JWT)
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                    API GATEWAY  :8080                          │
│   ┌──────────────────────┐  ┌────────────────────────┐        │
│   │  JwtAuthFilter        │  │  RateLimitInterceptor  │        │
│   │  (validates JWT,      │  │  (1000 req/window      │        │
│   │   injects headers)    │  │   per IP, in-memory)   │        │
│   └──────────────────────┘  └────────────────────────┘        │
│                   Spring Cloud Gateway MVC                      │
└──────┬────────────────────┬──────────────────────┬────────────┘
       │                    │                      │
       ▼ lb://AUTH-SERVICE  ▼ lb://DOCTOR-SERVICE  ▼ lb://APPOINTMENT-SERVICE
┌────────────┐     ┌──────────────────┐     ┌──────────────────────────┐
│AUTH SERVICE│     │  DOCTOR SERVICE  │     │   APPOINTMENT SERVICE    │
│   :8081    │     │      :8082       │◄────│         :8083            │
│ PostgreSQL │     │   PostgreSQL     │     │       PostgreSQL          │
│ (auth_db)  │     │  (doctor_db)     │     │    (appointment_db)       │
└────────────┘     └──────────────────┘     └──────────────────────────┘
       │                    │                      │
       └────────────────────┴──────────────────────┘
                            │ Register & Discover
                            ▼
              ┌─────────────────────────────┐
              │  EUREKA SERVER  :8761        │
              │  (Service Registry)          │
              └─────────────────────────────┘
```

**Inter-Service Communication:**
- `Appointment Service → Doctor Service` via OpenFeign with `X-Internal-Secret` header
- All services register themselves with the Eureka Server at startup
- The API Gateway uses `lb://` URIs to load-balance requests to registered instances

---

## 🔧 Microservices List & Responsibilities

### 1. `eureka-server` — Service Registry (Port: 8761)
- Acts as the **Netflix Eureka** service registry.
- All other services register with it on startup.
- The API Gateway discovers downstream services by their registered names (e.g., `DOCTOR-SERVICE`).
- Does **not** register itself with Eureka.

---

### 2. `api-gateway` — API Gateway (Port: 8080)
- **Single entry point** for all client traffic.
- **JWT Authentication Filter**: Intercepts all non-`/auth/**` requests, validates the JWT, and enriches the request with `X-User-Role`, `X-User-Email`, `X-User-Id` headers before forwarding.
- **Path-Based Authorization**: Routes containing `/admin/` are only allowed if the token's `role` claim is `ADMIN`.
- **Rate Limiting**: An in-memory `ConcurrentHashMap`-based rate limiter restricts each IP to **1000 requests per window**. A scheduled job (`RateLimitScheduler`) resets counters periodically.
- **CORS**: Configured to allow cross-origin requests from `http://localhost:5173` (frontend).
- **Routing Table:**

| Route ID | Path Pattern | Upstream Service |
|---|---|---|
| `auth-service` | `/auth/**` | `lb://AUTH-SERVICE` |
| `doctor-service` | `/doctors/**`, `/specialties/**` | `lb://DOCTOR-SERVICE` |
| `appointment-service` | `/appointments/**`, `/admin/appointments/**` | `lb://APPOINTMENT-SERVICE` |

---

### 3. `auth-service` — Authentication Service (Port: 8081)
- Handles **user registration** and **login**.
- All self-registered users receive the `PATIENT` role automatically.
- Admin accounts are inserted manually in the database.
- Issues **signed JWT tokens** containing `email` (subject), `role`, `userId`, and a 1-hour expiry.
- Passwords are hashed with **BCrypt**. Includes a hotfix to auto-upgrade plaintext admin passwords found in the database.
- Database: `auth_db` (PostgreSQL)

---

### 4. `doctor-service` — Doctor & Slot Management (Port: 8082)
- Manages **Doctors**, **Specialties**, and **Appointment Slots**.
- Exposes public endpoints to browse doctors (filter by specialty, mode) and view available slots.
- Exposes **internal-only** slot endpoints (`/slots/{slotId}/book`, `/slots/{slotId}/release`) that are protected by an `X-Internal-Secret` header — only the Appointment Service can call these.
- Uses **optimistic locking** (`@Version` on `Slot` entity) to prevent double-booking concurrency issues.
- Seeded with initial specialty and doctor data via a `DataInitializer` component.
- Database: `doctor_db` (PostgreSQL)

---

### 5. `appointment-service` — Appointment Management (Port: 8083)
- Handles the **core appointment lifecycle**: booking, viewing, cancellation, and status updates.
- Extracts patient identity directly from the **JWT token** (does not trust forwarded headers for authorization).
- Uses **OpenFeign** (`DoctorClient`) to call `DOCTOR-SERVICE` for slot operations (book/release) and doctor info.
- Uses **Resilience4j Circuit Breaker** with a `DoctorClientFallback` to gracefully handle Doctor Service outages.
- Enforces **IDOR protection**: patients can only view/cancel their own appointments.
- Database: `appointment_db` (PostgreSQL)

---

### 6. `frontend` — React Application (Port: 5173)
- Built with **React 19 + Vite 8**.
- Uses **React Router v7** with `ProtectedRoute` components for role-based UI access.
- `PATIENT` users can: browse doctors, view doctor details and available slots, book appointments, view their appointments, and cancel them.
- `ADMIN` users can: view all appointments and update their statuses.
- JWT is stored client-side and decoded using `jwt-decode`.
- API calls go through a centralized `axiosInstance` that attaches the `Authorization: Bearer <token>` header automatically.
- Toast notifications via `react-hot-toast`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Backend Framework | Spring Boot 4.0.3 |
| API Gateway | Spring Cloud Gateway MVC (Servlet-based) |
| Service Discovery | Netflix Eureka (Spring Cloud 2025.1.0) |
| Inter-Service Calls | Spring Cloud OpenFeign |
| Resilience | Resilience4j Circuit Breaker |
| Security | Spring Security + JWT (JJWT 0.12.5) |
| Database | PostgreSQL (one DB per service) |
| ORM | Spring Data JPA / Hibernate |
| Lombok | Boilerplate reduction |
| Frontend | React 19 + Vite 8 |
| Frontend Routing | React Router DOM v7 |
| HTTP Client | Axios |
| JWT Decode (FE) | jwt-decode v4 |
| Notifications | react-hot-toast |
| Frontend Testing | Vitest + @testing-library/react |

---

## 🔄 System Flow — End-to-End Appointment Booking

```
Patient                 Frontend               API Gateway           Auth-Service
  │                        │                       │                     │
  │──── POST /auth/register ──────────────────────►│                     │
  │                        │                       │──── forward ───────►│
  │                        │                       │◄─── 200 OK ─────────│
  │                        │                       │                     │
  │──── POST /auth/login ─────────────────────────►│                     │
  │                        │                       │──── forward ───────►│
  │                        │                       │◄─── JWT Token ──────│
  │◄─── JWT stored ────────│                       │                     │
  │                        │                       │
  │                        │          Doctor-Service│       Appointment-Service
  │──── GET /doctors ─────────────────────────────►│                     │
  │                        │  (JWT validated by GW) │──── forward ───────►│. (not used here, goes to doctor-service)
  │◄─── doctor list ───────│                       │                     │
  │                        │                       │                     │
  │──── GET /doctors/{id}/slots?date=YYYY-MM-DD ──►│                     │
  │◄─── available slots ───│                       │                     │
  │                        │                       │                     │
  │──── POST /appointments ───────────────────────────────────────────►  │
  │      { doctorId, slotId, mode }               │                     │
  │                        │  (JWT validated by GW, forwarded to appt-svc)
  │                        │                       │    AppointmentService
  │                        │                       │       ┌─────────────────────────┐
  │                        │                       │       │ 1. Extract patientId     │
  │                        │                       │       │    from JWT              │
  │                        │                       │       │ 2. GET /doctors/{id}     │
  │                        │                       │       │    (Feign → DoctorSvc)   │
  │                        │                       │       │ 3. Validate mode matches │
  │                        │                       │       │ 4. POST /slots/{id}/book │
  │                        │                       │       │    (Feign + X-Internal-  │
  │                        │                       │       │     Secret header)        │
  │                        │                       │       │ 5. Save Appointment       │
  │                        │                       │       │    status=BOOKED          │
  │                        │                       │       └─────────────────────────┘
  │◄─── AppointmentResponse ──────────────────────────────────────────── │
```

### Cancellation Flow

```
Patient ──► PATCH /appointments/{id}/cancel ──► API GW ──► Appointment Service
                                                            │
                                                            ├─ Extract userId + role from JWT
                                                            ├─ Find appointment by ID
                                                            ├─ Validate: status != CANCELLED
                                                            ├─ Validate: userId == patientId or role == ADMIN
                                                            ├─ Set status = CANCELLED
                                                            └─ POST /slots/{id}/release (Feign → DoctorSvc)
```

---

## 🌐 API Gateway Routing

The gateway is configured in `api-gateway/src/main/resources/application.yml`:

```
Client Request                  Path Pattern            Routed To (lb://)
───────────────────────         ─────────────────────   ──────────────────────
POST /auth/register             /auth/**                lb://AUTH-SERVICE
POST /auth/login                /auth/**                lb://AUTH-SERVICE
GET  /doctors                   /doctors/**             lb://DOCTOR-SERVICE
GET  /doctors/{id}/slots        /doctors/**             lb://DOCTOR-SERVICE
GET  /specialties               /specialties/**         lb://DOCTOR-SERVICE
POST /appointments              /appointments/**        lb://APPOINTMENT-SERVICE
GET  /appointments/patient/{id} /appointments/**        lb://APPOINTMENT-SERVICE
PATCH /appointments/{id}/cancel /appointments/**        lb://APPOINTMENT-SERVICE
GET  /admin/appointments        /admin/appointments/**  lb://APPOINTMENT-SERVICE
PATCH /admin/appointments/...   /admin/appointments/**  lb://APPOINTMENT-SERVICE
```

**Note:** The `lb://` scheme enables **client-side load balancing** via Spring Cloud LoadBalancer using service instances registered in Eureka.

### Gateway Filters Applied to Every Request:
1. **`JwtAuthenticationFilter`** (Spring Security filter): Validates the JWT and sets the security context. Skips `/auth/**` paths. Enriches downstream requests with `X-User-Role`, `X-User-Email`, and `X-User-Id` custom headers.
2. **`RateLimitInterceptor`** (MVC interceptor): Tracks per-IP request counts in memory. Returns HTTP `429 Too Many Requests` when limit is exceeded.

---

## 🔗 Service Communication Flow

```
Appointment Service (Feign Client: DoctorClient)
│
├─── GET  /doctors/{doctorId}        → Doctor Service (public, no secret)
├─── GET  /slots/{slotId}            → Doctor Service (requires X-Internal-Secret)
├─── POST /slots/{slotId}/book       → Doctor Service (requires X-Internal-Secret)
└─── POST /slots/{slotId}/release    → Doctor Service (requires X-Internal-Secret)
```

**Security of Internal Endpoints:**
- Slot book/release endpoints on the Doctor Service require the `X-Internal-Secret` header.
- The value must match the `internal.secret` property configured on both services.
- This prevents external clients from directly booking or releasing slots, even if they bypass the gateway.

**Circuit Breaker:**
- The `DoctorClient` Feign client has `feign.circuitbreaker.enabled=true`.
- `DoctorClientFallback` class provides fallback responses if the Doctor Service is unavailable, preventing cascading failures.

---

## 🗄️ Database Design (Per Service)

### `auth_db` — Auth Service

**`users` table**

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (PK) | Auto-generated |
| `name` | VARCHAR | User's full name |
| `email` | VARCHAR | Unique, used as JWT subject |
| `password` | VARCHAR | BCrypt-encoded |
| `role` | VARCHAR | Enum: `PATIENT`, `ADMIN` |

---

### `doctor_db` — Doctor Service

**`specialties` table**

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (PK) | Auto-generated |
| `name` | VARCHAR | e.g., "Cardiology", "Dermatology" |

**`doctor` table**

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (PK) | Auto-generated |
| `name` | VARCHAR | Doctor's full name |
| `email` | VARCHAR | Doctor's email |
| `specialty_id` | BIGINT (FK) | References `specialties.id` |
| `mode` | VARCHAR | Enum: `ONLINE`, `OFFLINE`, `BOTH` |
| `consultation_fee` | INTEGER | Fee in currency units |
| `created_at` | TIMESTAMP | Auto-set on creation |

**`slots` table**

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (PK) | Auto-generated |
| `doctor_id` | BIGINT (FK) | References `doctor.id` |
| `slot_date` | DATE | |
| `start_time` | TIME | |
| `end_time` | TIME | |
| `is_booked` | BOOLEAN | `false` by default |
| `version` | BIGINT | Optimistic locking (`@Version`) |

> **Unique constraint** on `(doctorId, slotDate, startTime, endTime)` prevents duplicate slots.

---

### `appointment_db` — Appointment Service

**`appointment` table**

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT (PK) | Auto-generated |
| `patient_id` | BIGINT | References user ID from Auth DB |
| `doctor_id` | BIGINT | References Doctor Service ID |
| `slot_id` | BIGINT | References Slot in Doctor DB |
| `mode` | VARCHAR | Enum: `ONLINE`, `OFFLINE`, `BOTH` |
| `status` | VARCHAR | Enum: `BOOKED`, `CANCELLED`, `COMPLETED` |
| `price` | INTEGER | Copied from doctor's consultation fee |
| `created_at` | TIMESTAMP | Auto-set on creation |

> **Unique constraint** on `(doctorId, slotId)` prevents double-booking the same slot.

---

## 🔐 Security Flow

### 1. Registration
```
Client ──POST /auth/register──► Auth Service
                                  │
                                  ├─ Check email uniqueness
                                  ├─ BCrypt encode password
                                  ├─ Set role = PATIENT
                                  └─ Save to auth_db
```

### 2. Login & JWT Issuance
```
Client ──POST /auth/login──► Auth Service
                               │
                               ├─ Find user by email
                               ├─ Match BCrypt password
                               └─ Generate JWT:
                                    {
                                      "sub":    "user@email.com",
                                      "role":   "PATIENT",
                                      "userId": 42,
                                      "iat":    ...,
                                      "exp":    iat + 3600s
                                    }
                                  Signed with HMAC-SHA256 (shared JWT_SECRET)
```

### 3. Authenticated Request Flow
```
Client ──GET /doctors──► API Gateway (JwtAuthenticationFilter)
                           │
                           ├─ Extract Bearer token from Authorization header
                           ├─ Validate signature & expiry using JWT_SECRET
                           ├─ Extract: username, role, userId
                           ├─ Block /admin/** if role != ADMIN (→ 401)
                           ├─ Inject headers: X-User-Role, X-User-Email, X-User-Id
                           └──► Upstream Service (Doctor / Appointment)
```

### 4. Appointment-Level Authorization
The Appointment Service **re-validates** the JWT independently (it has its own `JwtUtil`) to enforce:
- Patients can only view their **own** appointments (`userId == patientId`).
- Patients can only cancel their **own** appointments.
- Only `ADMIN` role can view all appointments or update status.

### Roles Summary

| Role | Capabilities |
|---|---|
| `PATIENT` | Register, Login, Browse Doctors/Slots, Book Appointment, View Own Appointments, Cancel Own Appointment |
| `ADMIN` | Login (manual DB setup), View ALL Appointments, Update Appointment Status, Cancel ANY Appointment |

---

## ⚙️ Setup Instructions

### Prerequisites

| Tool | Version |
|---|---|
| Java JDK | 17+ |
| Maven | 3.8+ |
| PostgreSQL | 14+ |
| Node.js | 18+ |
| npm | 9+ |

### Step 1 — Create PostgreSQL Databases

Connect to PostgreSQL and create three databases:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE doctor_db;
CREATE DATABASE appointment_db;
```

> All services connect as user `postgres` by default.

### Step 2 — Insert an Admin User

After starting the Auth Service (which auto-creates the `users` table), insert an admin:

```sql
-- Connect to auth_db
\c auth_db

INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@hospital.com', 'admin123', 'ADMIN');
```

> On first login with this plaintext password, the Auth Service will automatically upgrade it to BCrypt.

### Step 3 — Clone & Configure

All configuration is in `application.properties` / `application.yml`. Environment variables override defaults:

| Variable | Default | Used In |
|---|---|---|
| `DB_PASSWORD` | `2580` | auth-service, doctor-service, appointment-service |
| `JWT_SECRET` | `HMhuTySndewzOnY5tGb5w4ESJhyEwzFLJQX72uRpQ5R` | auth-service, appointment-service, api-gateway |
| `INTERNAL_SECRET` | `my-internal-secret-key-2024` | doctor-service, appointment-service |

### Step 4 — Install Frontend Dependencies

```bash
cd hospital/frontend/@latest
npm install
```

---

## ▶️ How to Run Each Service

Start services **in this exact order** to ensure proper registration:

### 1. Eureka Server (Port: 8761)
```bash
cd hospital/eureka-server
./mvnw spring-boot:run
```
Verify at: [http://localhost:8761](http://localhost:8761)

### 2. Auth Service (Port: 8081)
```bash
cd hospital/auth-service
./mvnw spring-boot:run
```

### 3. Doctor Service (Port: 8082)
```bash
cd hospital/doctor-service
./mvnw spring-boot:run
```

### 4. Appointment Service (Port: 8083)
```bash
cd hospital/appointment-service
./mvnw spring-boot:run
```

### 5. API Gateway (Port: 8080)
```bash
cd hospital/api-gateway
./mvnw spring-boot:run
```

### 6. Frontend (Port: 5173)
```bash
cd hospital/frontend/@latest
npm run dev
```
Open: [http://localhost:5173](http://localhost:5173)

> **Windows users:** Replace `./mvnw` with `mvnw.cmd`

---

## 🔐 Environment Variables

### Auth Service (`auth-service/src/main/resources/application.properties`)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/auth_db
spring.datasource.username=postgres
spring.datasource.password=${DB_PASSWORD:2580}
jwt.secret=${JWT_SECRET:HMhuTySndewzOnY5tGb5w4ESJhyEwzFLJQX72uRpQ5R}
```

### Doctor Service (`doctor-service/src/main/resources/application.properties`)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/doctor_db
spring.datasource.username=postgres
spring.datasource.password=${DB_PASSWORD:2580}
internal.secret=${INTERNAL_SECRET:my-internal-secret-key-2024}
```

### Appointment Service (`appointment-service/src/main/resources/application.properties`)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/appointment_db
spring.datasource.username=postgres
spring.datasource.password=${DB_PASSWORD:2580}
jwt.secret=${JWT_SECRET:HMhuTySndewzOnY5tGb5w4ESJhyEwzFLJQX72uRpQ5R}
internal.secret=${INTERNAL_SECRET:my-internal-secret-key-2024}
```

### API Gateway (`api-gateway/src/main/resources/application.yml`)
```yaml
jwt:
  secret: HMhuTySndewzOnY5tGb5w4ESJhyEwzFLJQX72uRpQ5R
```

> ⚠️ **Important:** In production, always set `JWT_SECRET`, `DB_PASSWORD`, and `INTERNAL_SECRET` as environment variables — never hardcode them. All three services that use `JWT_SECRET` must share the **same** value.

---

## 📬 Sample API Calls (Postman-Ready)

**Base URL:** `http://localhost:8080` (all requests go through the API Gateway)

### Auth — Register a Patient
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Auth — Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{ "token": "eyJhbGciOiJIUzI1NiJ9..." }
```

### Doctors — Get All Doctors (Requires Auth)
```http
GET /doctors
Authorization: Bearer <token>
```

### Doctors — Filter by Specialty and Mode
```http
GET /doctors?specialtyId=1&mode=ONLINE
Authorization: Bearer <token>
```

### Doctors — Get Available Slots
```http
GET /doctors/1/slots?date=2025-04-15
Authorization: Bearer <token>
```

### Appointments — Book Appointment
```http
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": 1,
  "slotId": 5,
  "mode": "ONLINE"
}
```

### Appointments — View My Appointments
```http
GET /appointments/patient/42
Authorization: Bearer <token>
```

### Appointments — Cancel Appointment
```http
PATCH /appointments/7/cancel
Authorization: Bearer <token>
```

### Admin — View All Appointments
```http
GET /admin/appointments
Authorization: Bearer <admin-token>
```

### Admin — Update Appointment Status
```http
PATCH /admin/appointments/7/status
Authorization: Bearer <admin-token>
Content-Type: application/json

"COMPLETED"
```

---

## 📁 Folder Structure

```
hospital/
├── eureka-server/                  # Service Registry (Port 8761)
│   └── src/main/
│       ├── java/.../               # @EnableEurekaServer main class
│       └── resources/application.properties
│
├── api-gateway/                    # API Gateway (Port 8080)
│   └── src/main/
│       ├── java/.../api_gateway/
│       │   ├── config/
│       │   │   ├── SecurityConfig.java       # Spring Security filter chain
│       │   │   ├── WebConfig.java            # CORS + rate limit interceptor
│       │   │   └── RateLimitInterceptor.java # IP-based rate limiter
│       │   ├── filter/
│       │   │   └── JwtAuthenticationFilter.java  # JWT validation + header injection
│       │   ├── scheduler/
│       │   │   └── RateLimitScheduler.java   # Resets rate limit counts
│       │   └── util/JwtUtil.java             # JWT parsing
│       └── resources/application.yml         # Routes + Eureka config
│
├── auth-service/                   # Authentication (Port 8081)
│   └── src/main/
│       ├── java/.../auth_service/
│       │   ├── controller/AuthController.java
│       │   ├── dto/                          # RegisterRequest, LoginRequest, AuthResponse
│       │   ├── entity/User.java, Role.java
│       │   ├── exception/                    # GlobalExceptionHandler + custom exceptions
│       │   ├── repository/UserRepository.java
│       │   ├── security/
│       │   │   ├── JwtUtil.java              # Token generation
│       │   │   └── SecurityConfig.java
│       │   └── service/impl/AuthServiceImpl.java
│       └── resources/application.properties
│
├── doctor-service/                 # Doctor & Slot Management (Port 8082)
│   └── src/main/
│       ├── java/.../doctor/
│       │   ├── config/DataInitializer.java   # Seeds initial data
│       │   ├── controller/
│       │   │   ├── DoctorController.java     # Public: GET /doctors/**
│       │   │   ├── SlotController.java       # Internal: /slots/** (secret-guarded)
│       │   │   └── SpecialtyController.java  # GET /specialties
│       │   ├── dto/                          # DoctorResponse, SlotResponse
│       │   ├── entity/
│       │   │   ├── Doctor.java, Specialty.java
│       │   │   ├── Slot.java                 # Has @Version for optimistic locking
│       │   │   └── Mode.java                 # Enum: ONLINE, OFFLINE, BOTH
│       │   ├── exception/                    # GlobalExceptionHandler
│       │   ├── repository/                   # DoctorRepository, SlotRepository, SpecialtyRepository
│       │   └── service/impl/DoctorServiceImpl.java
│       └── resources/application.properties
│
├── appointment-service/            # Appointment Lifecycle (Port 8083)
│   └── src/main/
│       ├── java/.../Appointment/
│       │   ├── client/
│       │   │   ├── DoctorClient.java         # Feign client for Doctor Service
│       │   │   └── DoctorClientFallback.java # Circuit breaker fallback
│       │   ├── controller/AppointmentController.java
│       │   ├── dto/                          # AppointmentRequest/Response, DoctorResponse, SlotResponse
│       │   ├── entity/
│       │   │   ├── Appointment.java
│       │   │   ├── AppointmentStatus.java    # Enum: BOOKED, CANCELLED, COMPLETED
│       │   │   └── Mode.java
│       │   ├── exception/                    # AccessDeniedException, GlobalExceptionHandler
│       │   ├── repository/AppointmentRepository.java
│       │   ├── service/impl/AppointmentServiceImpl.java
│       │   └── util/JwtUtil.java             # Extracts userId/role from JWT in controller
│       └── resources/application.properties
│
└── frontend/
    └── @latest/                    # React + Vite App (Port 5173)
        ├── src/
        │   ├── App.jsx                       # Routes: public / PATIENT / ADMIN
        │   ├── context/AuthContent.jsx       # Auth context provider
        │   ├── components/
        │   │   ├── Navbar.jsx
        │   │   └── ProtectedRoute.jsx        # Role-based route guard
        │   ├── pages/
        │   │   ├── Home.jsx, Login.jsx, Register.jsx
        │   │   ├── Doctors.jsx, DoctorDetails.jsx
        │   │   ├── MyAppointments.jsx        # Patient view
        │   │   └── AdminAppointments.jsx     # Admin view
        │   └── utils/
        │       ├── axiosInstance.js          # Axios with JWT header
        │       ├── auth.js                   # Auth helpers
        │       └── jwt.js                    # JWT decode utilities
        ├── package.json
        └── vite.config.js
```

---

## 🚀 Future Improvements

- **Notification Service**: Add a dedicated service (e.g., using email/SMS via Spring Mail or Twilio) to notify patients on booking confirmation, cancellation, or appointment reminders.
- **Config Server**: Centralize all `application.properties` configuration via Spring Cloud Config Server to avoid duplicated environment variable management across services.
- **Docker & Docker Compose**: Containerize all services and define a `docker-compose.yml` to spin up the entire stack with a single command.
- **Token Refresh**: Implement refresh tokens to avoid forcing users to log in every hour.
- **Redis Rate Limiting**: Replace the in-memory `ConcurrentHashMap` rate limiter with a Redis-backed one to support horizontal scaling of the gateway.
- **API Documentation**: Integrate Springdoc OpenAPI (Swagger UI) into each service for automated API docs.
- **Distributed Tracing**: Add Zipkin/Micrometer Tracing to trace requests across services.
- **Admin Management API**: Add endpoints to create/update doctors and slots via the admin panel.

---

## 🛠️ Troubleshooting

### Services not discovering each other
- **Cause:** Eureka Server is not running, or services started before Eureka was ready.
- **Fix:** Always start the Eureka Server **first**. Wait ~15–30 seconds after it's up before starting other services. Verify each service appears in [http://localhost:8761](http://localhost:8761).

---

### `401 Unauthorized` on protected routes
- **Cause:** The JWT token is missing, expired (1-hour TTL), or the `Authorization` header format is wrong.
- **Fix:** Ensure you set `Authorization: Bearer <token>` (note the space after `Bearer`). Re-login to get a fresh token.

---

### `403 Forbidden` on `/admin/**` routes
- **Cause:** Your JWT's `role` claim is `PATIENT`, not `ADMIN`.
- **Fix:** Log in as an admin user. Admin users must be **manually inserted** into the `users` table in `auth_db` with `role = 'ADMIN'`.

---

### Slot already booked (Booking fails)
- **Cause:** The slot has `is_booked = true` in the `doctor_db`.
- **Fix:** Choose a different slot (one with `is_booked = false`). Slots are only released when an appointment is cancelled.

---

### Doctor Service unavailable during booking
- **Cause:** The Appointment Service cannot reach the Doctor Service via Feign.
- **Fix:** The circuit breaker (`DoctorClientFallback`) will trigger and return a fallback response. Check that the Doctor Service is running and registered in Eureka.

---

### PostgreSQL connection refused
- **Cause:** PostgreSQL is not running, or the database does not exist.
- **Fix:** Start PostgreSQL and ensure `auth_db`, `doctor_db`, and `appointment_db` are created. Verify `DB_PASSWORD` matches your PostgreSQL user password.

---

### Frontend CORS error
- **Cause:** The API Gateway only allows CORS from `http://localhost:5173`.
- **Fix:** Make sure the Vite dev server is running on port `5173` (`npm run dev`). Do not change the port without updating `WebConfig.java`.

---

### Rate limit exceeded (`429 Too Many Requests`)
- **Cause:** Your IP has sent more than 1000 requests in the current rate-limit window.
- **Fix:** Wait for the scheduled `RateLimitScheduler` to reset the counter, or restart the API Gateway for immediate relief during development.
