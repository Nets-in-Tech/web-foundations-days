# TicketHub System Design & Scaling Plan

This document outlines the system architecture, API design, data model, concurrency controls, and scaling strategy for "TicketHub," a high-demand concert and event ticketing platform.

---

## 1. System Requirements

### Functional Requirements
* **User Management:** Users can register, log in, and view their purchase history.
* **Event Discovery:** Users can browse upcoming concerts, search events, and view event details.
* **Seat Selection & Temporary Hold:** Users can view an interactive seat map, select available seats, and place a temporary hold on them during checkout.
* **Payment Processing:** Users can complete secure checkout and payments to finalize ticket purchases.
* **Ticket Management:** Users can view and download digital tickets after successful purchase.

### Non-Functional Requirements
* **Speed & Latency:** High-speed response times (< 200ms) for browsing and seat selection under normal loads.
* **Correctness & Consistency:** Zero overselling or double-booking under any circumstances. Every seat can be sold to exactly one buyer.
* **Fairness:** Flash sales must handle massive traffic spikes fairly (first-come-first-served or randomized virtual waiting room queues to prevent bot exploitation).

---

## 2. Traffic Estimates & Peak Analysis

### Baseline Assumptions
* **Registered Users:** 2,000,000 (2 Million)
* **Normal Daily Traffic:** 50,000 visitors per day, each viewing 10 pages (≈ 500,000 page views/day).
* **Normal Sales Volume:** 5,000 tickets sold per day.

### Flash Sale Peak Traffic
* **Scenario:** A very popular concert goes on sale, causing **200,000 users** to rush the system attempting to purchase **20,000 seats** within the first **10 minutes** (600 seconds).

### Throughput Calculations
* **Normal Read Traffic (Average):** 500,000 / 86,400 ≈ **5.79 page views/sec**
* **Normal Write Traffic (Average):** 5,000 / 86,400 ≈ **0.06 ticket sales/sec**
* **Peak Flash Sale Traffic:** 
  * 200,000 active buyers in 600 seconds results in an average request rate of ≈ **333 requests/sec** for checkout attempts, with browsing spikes reaching **3,000+ requests/sec** at drop time.
* **Comparison:** The flash sale introduces a traffic surge more than **100× normal operating levels**, requiring dedicated queuing mechanisms, caching, and aggressive load shedding to prevent system collapse.

---

## 3. REST API Design

| Method | Endpoint Path | Description | Success Status Code |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/events` | Browse or search upcoming concerts and events. | `200 OK` |
| **GET** | `/api/v1/events/{id}/seats` | Retrieve real-time seat availability and status map for an event. | `200 OK` |
| **POST** | `/api/v1/seats/hold` | Place a temporary 10-minute hold on selected available seats. | `201 Created` |
| **POST** | `/api/v1/orders/checkout` | Process payment, convert holds into confirmed ticket orders. | `200 OK` |
| **GET** | `/api/v1/users/me/tickets` | Retrieve list of confirmed tickets purchased by the authenticated user. | `200 OK` |

---

## 4. Relational Data Model

### Tables and Schema Structure
1. **`users`**: Stores account credentials and profile info.
   * `user_id` (PK, INTEGER), `username`, `email` (UNIQUE), `password_hash`, `created_at`
2. **`events`**: Stores concert and venue details.
   * `event_id` (PK, INTEGER), `title`, `description`, `event_date`, `venue_name`, `total_seats`
3. **`seats`**: Represents individual physical seats mapped to events.
   * `seat_id` (PK, INTEGER), `event_id` (FK -> `events`), `seat_number`, `status` (`'available'`, `'held'`, `'booked'`), `held_by_user_id`, `hold_expires_at`
4. **`orders`**: Records completed transactions.
   * `order_id` (PK, INTEGER), `user_id` (FK -> `users`), `event_id` (FK -> `events`), `total_amount`, `status`, `created_at`
5. **`order_items`**: Junction table linking orders to specific seats.
   * `order_item_id` (PK, INTEGER), `order_id` (FK -> `orders`), `seat_id` (FK -> `seats`), `price`

---

## 5. Preventing Double-Booking (Concurrency Control)

To guarantee that two users can never successfully purchase the same seat, TicketHub uses a **two-phase concurrency control strategy** combining Redis atomic locks and Database ACID transactions:

1. **Atomic Seat Holding (Redis + Database):** When a user selects seats and clicks "Hold", the API checks if the seat status is `'available'`. Using a Redis distributed lock or an atomic database update with a condition (`UPDATE seats SET status = 'held', held_by_user_id = ?, hold_expires_at = datetime('now', '+10 minutes') WHERE seat_id = ? AND status = 'available'`), the database confirms how many rows were affected. If 0 rows were updated, another user grabbed the seat milliseconds earlier, and the request fails instantly.
2. **TTL Expiration:** If the user fails to complete payment within 10 minutes, a background cleanup worker releases the hold back to `'available'`.
3. **Checkout Transaction Isolation:** During the final payment confirmation (`POST /api/v1/orders/checkout`), the database executes a strict transaction with row-level locking (`SELECT ... FOR UPDATE`), verifying that the seats are still validly held by that specific user before recording the order and updating seat status to `'booked'`.

---

## 6. Architecture Diagram & Surviving the Big Sale

+-------------------------------------------------------+
|              Client (Web / Mobile App)                |
+-------------------------------------------------------+
                            |
                            v
+-------------------------------------------------------+
|          Cloudflare CDN & Edge DDoS Protection        |
+-------------------------------------------------------+
                            |
                            v
+-------------------------------------------------------+
|             Virtual Waiting Room (Queue)              |
+-------------------------------------------------------+
                            |
                            v
+-------------------------------------------------------+
|               Application Load Balancer               |
+-------------------------------------------------------+
                            |
           +----------------+----------------+
           |                                 |
           v                                 v
+-----------------------+         +-----------------------+
|    App Server 1       |         |    App Server 2       |
+-----------------------+         +-----------------------+
           |                                 |
           +----------------+----------------+
                            |
       +--------------------+--------------------+
       |                    |                    |
       v                    v                    v
+--------------+    +---------------+    +-----------------+
| Redis Cache  |    | Message Queue |    | Primary DB      |
| (Seat Status)|    | (Async Orders)|    | (ACID Writes)   |
+--------------+    +---------------+    +-----------------+
                                                  |
                                         (Replication Stream)
                                                  |
                                                  v
                                         +-----------------+
                                         | Read Replica    |
                                         | (Event Catalog) |
                                         +-----------------+

### Component Explanations
* **CDN:** Caches static assets and event catalog pages at global edge locations to offload traffic from core servers.
* **Virtual Waiting Room:** Throttles incoming checkout traffic during popular ticket drops, admitting users in orderly batches to prevent server overload.
* **Load Balancer:** Distributes incoming HTTP requests evenly across multiple stateless application servers.
* **App Servers:** Handle authentication, validation, and request routing.
* **Redis Cache:** Provides lightning-fast, in-memory checks for active seat holds and user sessions.
* **Message Queue:** Buffers asynchronous tasks (like email confirmations and receipt generation) so checkout transactions complete instantly.
* **Primary Database:** Handles strict ACID-compliant writes and transactional seat bookings.
* **Read Replica:** Serves high-volume read queries for event listings and user history to protect primary DB performance.

---

## 7. System Trade-offs

* **Trade-off 1: Virtual Waiting Room vs. Instant Direct Access**
  * *Decision:* Implement a waiting room queue during flash sales.
  * *Pros:* Prevents server crashes, protects the database from connection exhaustion, and ensures fairness against automated bots.
  * *Cons:* Introduces friction and wait times for legitimate users trying to purchase tickets immediately.
* **Trade-off 2: Temporary Seat Holds with TTL vs. Permanent Cart Locking**
  * *Decision:* Enforce a strict 10-minute timeout on seat holds.
  * *Pros:* Ensures abandoned carts quickly release inventory back to other buyers, maximizing ticket sell-through.
  * *Cons:* Can frustrate users whose payment processing takes slightly longer than 10 minutes, causing them to lose their seats mid-checkout.