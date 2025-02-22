# System

- The App is comprised of various components
  - **Frontend** - Next.JS 
  - **Database** - Supabase (PostgreSQL)
  - **Auth** - Supabase
  - **Caching / Queues** - Redis
  - **Backend** - Go
- The core component is the ability to scrape spotify using a distributed architecture of worker nodes that communicate via Redis.
  1. The user inputs a *seed* and a specified *depth* and then the API will crawl the spotify API from that point and retrieve data similar to the seed. For example this would be some *artist* and *depth* and it uses the related artists API to collect a pool of artists.
  2. To enable this scrape we simply utilise a queueing system via Redis, where the user submits a request to `/api/scrape` and this pushes a scrape task to the backend workers.
  3. The workers which are little Golang image can be deployed in various places and can read this global queue to process the scrape and then return the response to the user.
  4. The main backend app will be listening to the workers response and will write the results to Supabase & submit a Websocket response to the frontend to signal the operation was complete.

```mermaid
flowchart TD
    Next[Next.js]
    DB[(Database)]
    Redis[(Redis)]:::redis
    Spotify((Spotify)):::spotify
    Go1[Go Service 1]:::go
    Go2[Go Service 2]:::go
    Go3[Go Service 3]:::go
    GoMain[Go Main Service]:::go
    Auth[Authentication]:::auth

    Auth --> Next
    Next --> GoMain
    GoMain --> DB
    DB --> Auth
    
    GoMain --> Redis
    Redis --> GoMain
    
    Redis --> Go1
    Redis --> Go2
    Redis --> Go3
    
    Go1 --> Spotify
    Go2 --> Spotify
    Go3 --> Spotify

    Next -.->|Websocket Scrape Response| GoMain
    GoMain -.->|Receive Scrape Responses| Redis
    GoMain -.->|Post Scrapes| Redis

    classDef default fill:#fff,stroke:#333
    classDef go fill:#7FD4E4,stroke:#333,color:#000
    classDef auth fill:#50FA7B,stroke:#333,color:#000
    classDef redis fill:#D42A2A,stroke:#333,color:#fff
    classDef spotify fill:#1DB954,stroke:#333,color:#fff
```

