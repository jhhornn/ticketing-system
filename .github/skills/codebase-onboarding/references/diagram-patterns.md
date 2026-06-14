# Architecture Diagram Patterns

Use these Mermaid templates as starting points. Always adapt to what you actually find in the codebase.

---

## Monolith with External Services

```mermaid
graph LR
  Client["Client"]
  App["Monolith\n(Rails / Django / Laravel)"]
  DB[("Primary DB\n(Postgres / MySQL)")]
  Cache[("Cache\n(Redis)")]
  Storage["File Storage\n(S3 / GCS)"]
  Email["Email\n(SendGrid / SES)"]
  Auth["Auth\n(Auth0 / Cognito)"]

  Client -->|HTTPS| App
  App -->|SQL| DB
  App -->|get/set| Cache
  App -->|upload/download| Storage
  App -->|send| Email
  Client -->|OAuth| Auth
  Auth -->|token| Client
```

---

## Microservices

```mermaid
graph LR
  GW["API Gateway\n(Kong / nginx)"]
  Auth["Auth Service"]
  Users["User Service"]
  Orders["Order Service"]
  Notif["Notification Service"]
  UserDB[("Users DB")]
  OrderDB[("Orders DB")]
  Queue["Message Bus\n(Kafka / RabbitMQ)"]
  EmailAPI["Email API\n(SendGrid)"]

  Client -->|HTTPS| GW
  GW --> Auth
  GW --> Users
  GW --> Orders
  Users --> UserDB
  Orders --> OrderDB
  Orders -->|event: order.created| Queue
  Queue --> Notif
  Notif --> EmailAPI
```

---

## Next.js / Full-Stack Web App

```mermaid
graph LR
  Browser["Browser"]
  Next["Next.js\n(SSR + API Routes)"]
  DB[("Database\n(Postgres via Prisma)")]
  Auth["NextAuth / Clerk"]
  CDN["CDN\n(Vercel / Cloudflare)"]
  ExtAPI["External APIs"]

  Browser -->|page load| CDN
  CDN -->|SSR| Next
  Browser -->|API calls| Next
  Next -->|queries| DB
  Browser -->|auth flow| Auth
  Auth -->|session| Next
  Next -->|fetch| ExtAPI
```

---

## Event-Driven / Worker Architecture

```mermaid
graph LR
  Ingress["Ingress\n(HTTP / Webhook)"]
  Producer["Producer Service"]
  Queue["Queue\n(SQS / Redis Streams)"]
  Worker1["Worker: Process"]
  Worker2["Worker: Notify"]
  ResultDB[("Results DB")]
  DeadLetter["Dead Letter Queue"]

  Ingress --> Producer
  Producer -->|enqueue job| Queue
  Queue --> Worker1
  Queue --> Worker2
  Worker1 -->|write result| ResultDB
  Worker1 -->|on failure| DeadLetter
  Worker2 -->|send notification| ExtService["Notification\nService"]
```

---

## CLI Tool / Script Architecture

```mermaid
graph TD
  CLI["CLI Entrypoint\n(cli.py / main.go)"]
  Config["Config Loader\n(.env / flags)"]
  Commands["Commands\n(add / run / export)"]
  Core["Core Logic"]
  IO["I/O Layer\n(files / APIs / DB)"]

  CLI --> Config
  CLI --> Commands
  Commands --> Core
  Core --> IO
```

---

## Sequence Diagram: Typical API Request

```mermaid
sequenceDiagram
  participant C as Client
  participant GW as Gateway/Router
  participant MW as Middleware (Auth/Validate)
  participant H as Handler/Controller
  participant S as Service Layer
  participant DB as Database

  C->>GW: POST /api/resource
  GW->>MW: check auth token
  MW-->>GW: authorized
  GW->>H: route to handler
  H->>S: call service method
  S->>DB: query / write
  DB-->>S: result
  S-->>H: domain object
  H-->>C: 200 JSON response
```