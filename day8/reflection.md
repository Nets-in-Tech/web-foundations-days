# Course Reflection - Web Foundations & System Design

### Most Difficult Concept
The most challenging concept in this course was mastering concurrency control and transaction isolation levels in relational databases—specifically preventing double-booking race conditions during high-concurrency flash sales. Understanding how to combine Redis distributed locks with SQL atomic conditionally checked updates (`WHERE status = 'available'`) and row-level locks (`FOR UPDATE`) required a mental shift from sequential programming to distributed thinking. I overcame this by drawing out step-by-step request timelines and testing edge cases in database transactions locally.

### Capstone Improvements
Based on feedback from the capstone presentation, I would improve the error resilience and cache invalidation strategies in my system design. Specifically, I would detail how the system recovers when a primary database failover occurs mid-transaction during high traffic, and implement a circuit breaker pattern on application servers to prevent cascading failures if payment gateway APIs experience latency spikes.

### Next Learning Steps
Next, I plan to dive deeper into advanced backend development and cloud architecture. I will focus on building microservices with FastAPI and Node.js, implementing Docker container orchestration, and learning Kubernetes to gain hands-on experience managing autoscaling clusters for high-throughput distributed applications.