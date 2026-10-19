# SnapShare System Architecture & Scaling Plan

This document outlines the system architecture, capacity estimations, design choices, and trade-offs for scaling "SnapShare"—a photo-sharing social platform.

---

## 1. Assumptions & Calculations

### Core Metrics
* **Registered Users:** 10,000,000 (10 Million)
* **Daily Active Users (DAU):** 10% of 10,000,000 = **1,000,000 (1 Million DAU)**
* **User Activity:**
  * 1 photo upload per DAU / day
  * 50 feed views per DAU / day
* **File Sizes:**
  * Original photo = 2 MB
  * Generated thumbnail = 50 KB (0.05 MB)
  * Total storage per uploaded photo = 2.05 MB
* **Time Conversions:**
  * 1 day = 86,400 seconds

---

### Traffic Estimations

#### Photo Uploads per Second
* **Total Daily Uploads:** 1,000,000 photos / day
* **Average Upload Traffic:** 1,000,000 / 86,400 ≈ **11.57 uploads/sec**
* **Peak Upload Traffic (5× multiplier):** 11.57 × 5 ≈ **57.87 uploads/sec**

#### Feed Views per Second
* **Total Daily Feed Views:** 1,000,000 × 50 = 50,000,000 views/day
* **Average Read Traffic:** 50,000,000 / 86,400 ≈ **578.70 views/sec**
* **Peak Read Traffic (5× multiplier):** 578.70 × 5 ≈ **2,893.50 views/sec**

---

### Storage Capacity per Year

* **Daily Raw Storage:** 1,000,000 photos × 2.05 MB = 2,050,000 MB/day ≈ 2.05 TB/day
* **Annual Photo Storage:** 2.05 TB/day × 365 days = **748.25 TB/year**
* *Note:* Metadata (user profiles, feed logs, photo records) requires additional relational database storage (approx. 0.5 KB per record ≈ 182.5 GB/year).

---

## 2. Read-Heavy vs. Write-Heavy System Analysis

SnapShare is a **read-heavy system**. 

### Explanation & System Design Impact
With a read-to-write ratio of **50:1** (50 feed views for every 1 upload), users spend significantly more time querying existing photo feeds than publishing new content.

* **Design Implications:**
  * **Aggressive Caching:** Frequently accessed feeds, image metadata, and thumbnail URLs must be heavily cached in memory (Redis/Memcached) to minimize database query latency.
  * **Database Scaling:** Reads are scaled horizontally using Read Replicas, isolating query traffic from primary write operations.
  * **Static File Offloading:** CDN caching handles image delivery globally, bypassing app servers entirely for photo retrievals.

---

## 3. Storage Strategy: Object Storage vs. Database

### Why Photos Should NOT Be Stored in a Database
1. **Performance Degradation:** Storing large binary BLOBs directly in relational database rows rapidly bloats table indexes, degrades memory buffer efficiency, and slows down indexing and query execution.
2. **Cost & Scalability:** Relational database storage is substantially more expensive per gigabyte and harder to scale horizontally compared to dedicated object stores.
3. **Backup Overhead:** Database backups, migrations, and replication cycles become extremely slow and resource-intensive when handling hundreds of terabytes of binary data.

### Where They Should Go Instead
Photo files (originals and thumbnails) belong in an **Object Storage Service** (such as AWS S3, Google Cloud Storage, or MinIO). The relational database stores only light metadata, such as unique photo IDs, user IDs, upload timestamps, and direct S3/CDN object URLs.

---

## 4. System Architecture Diagram

## 4. System Architecture Diagram

+-------------------------------+
|  Client Browser / Mobile App  |
+-------------------------------+
       |                 |
       | (Static Media)  | (API Requests)
       v                 v
   +-------+     +---------------+
   |  CDN  |     | Load Balancer |
   +-------+     +---------------+
       |                 |
       |          +------+------+
       |          |             |
       |          v             v
       |    +-----------+ +-----------+
       |    | App Server| | App Server|
       |    +-----------+ +-----------+
       |          |             |
       |          +------+------+
       |                 |
       |    +------------+------------+
       |    |            |            |
       v    v            v            v
  +--------------+  +---------+  +---------------+
  | Object Store |  | Cache   |  | Message Queue |
  |   (S3)       |  | (Redis) |  |   (SQS)       |
  +--------------+  +---------+  +---------------+
         ^                               |
         | (Saves Thumbnail)             v
         +--------------------- +---------------+
                                | Async Worker  |
                                +---------------+
                                        |
                                        v
                        +-------------------------------+
                        |   Database Primary (Writes)   |
                        +-------------------------------+
                                        |
                               (Replication Stream)
                                        v
                        +-------------------------------+
                        |   Database Replica (Reads)    |
                        +-------------------------------+
        
---

## 5. Component Responsibilities

* **Client:** Renders UI feeds and allows users to upload photos via API endpoints.
* **Content Delivery Network (CDN):** Caches and serves high-bandwidth image files globally from edge locations closest to users to minimize latency.
* **Load Balancer:** Distributes incoming web traffic across multiple application servers to maintain high availability and prevent server overloading.
* **App Servers:** Executes business logic, handles user authentication, serves feed endpoints, and coordinates requests between storage layers.
* **In-Memory Cache (Redis):** Caches user timelines, user profiles, and session metadata in memory to deliver lightning-fast read operations.
* **Object Storage (S3):** Provides scalable, highly durable file storage for original high-resolution photo uploads and generated thumbnails.
* **Message Queue (SQS/RabbitMQ):** Decouples media uploading from background processing by holding asynchronous processing tasks.
* **Async Worker:** Consumes background tasks from the queue to process images and generate 50 KB thumbnails without slowing down user API response times.
* **Database Primary:** Handles write operations, ensuring ACID compliance when recording user metadata, new posts, and relationships.
* **Database Read Replica:** Handles read queries for application feeds to keep primary database loads low.

---

## 6. Step-by-Step Photo Upload Flow

1. **Client Upload Request:** The user selects a photo on their mobile app or browser and clicks "Upload", sending an HTTP `POST` request with file content to the Load Balancer.
2. **Traffic Distribution:** The Load Balancer routes the request to an available App Server.
3. **Direct Media Save:** The App Server validates the request payload and streams the raw photo (2 MB) directly into **Object Storage**.
4. **Metadata Recording:** The App Server writes a new record into the **Primary Database** containing user ID, photo ID, creation timestamp, and original file URL.
5. **Job Enqueueing:** The App Server pushes an asynchronous task (`{ photo_id, object_key }`) to the **Message Queue**.
6. **Instant Response:** The App Server returns a `201 Created` response to the client immediately, without waiting for thumbnail generation.
7. **Worker Processing:** An **Async Worker** consumes the task from the Queue, downloads the original photo from Object Storage, generates a compressed 50 KB thumbnail image, and saves the thumbnail back to Object Storage.
8. **Record Update & Cache Invalidation:** The Worker updates the Database record with the new thumbnail URL and invalidates or updates relevant feed caches in the **In-Memory Cache**.

---

## 7. System Trade-offs

### Trade-off 1: Asynchronous Processing vs. Real-Time Thumbnail Availability
* **Decision:** Generating thumbnails asynchronously via message queues instead of processing them synchronously during the HTTP request.
* **Pros:** Keeps upload API response times extremely low and protects App Servers from CPU spikes caused by synchronous image processing.
* **Cons:** Introduces eventual consistency; a user's followers may see a brief delay (a few seconds) before the generated thumbnail becomes visible in their feeds.

### Trade-off 2: Cache-Aside Strategy vs. Direct Database Queries
* **Decision:** Storing generated user timelines and metadata inside a Redis cache layer using a cache-aside pattern.
* **Pros:** Reduces database read load significantly and reduces feed latency to sub-10 milliseconds.
* **Cons:** Increases system complexity, requires cache invalidation logic on new posts, and risks brief stale reads if cache updating mechanisms fail.