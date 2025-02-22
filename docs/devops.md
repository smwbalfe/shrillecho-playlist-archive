# Devops

- Hosting: VPS
- Infrastructure: Terraform
- Terraform state: AWS S3
- Pipeline: Github Actions


1. `backend` builds and deploys an image to the Github registry
2. `frontend` builds and deploys an image to the Github registry
3. `infra` setups digital ocean VPS using terraform. It will SSH into this and setup Docker, SSH, clone the repo and start docker compose. It will use watchtower to poll for `frontend` and `backend` images as they are released.

```mermaid
flowchart TD
    %% Styling
    classDef infrastructure fill:#f96,stroke:#333,color:#000
    classDef backend fill:#9cf,stroke:#333,color:#000
    classDef frontend fill:#9f9,stroke:#333,color:#000
    classDef deploy fill:#f9f,stroke:#333,color:#000
    classDef storage fill:#fc9,stroke:#333,color:#000

    %% Infrastructure Pipeline
    subgraph infra[Infrastructure Pipeline]
        direction TB
        A[Create State Bucket]:::infrastructure
        B[Terraform Init/Plan/Apply]:::infrastructure
        C[Configure VPS]:::infrastructure
        D[Setup SSL & ENV]:::infrastructure
        E[Deploy Application]:::infrastructure
        A --> B --> C --> D --> E
    end

    %% Backend Pipeline
    subgraph backend[Backend Pipeline]
        direction TB
        F[Setup Go]:::backend
        G[Build Binary]:::backend
        H[Build Docker Image]:::backend
        I[Push to GHCR]:::backend
        F --> G --> H --> I
    end

    %% Frontend Pipeline
    subgraph frontend[Frontend Pipeline]
        direction TB
        J[Setup Node]:::frontend
        K[Install Dependencies]:::frontend
        L[Build Docker Image]:::frontend
        M[Push to GHCR]:::frontend
        J --> K --> L --> M
    end

    %% External Services
    S3[(AWS S3)]:::storage
    GHCR[(GitHub Container Registry)]:::storage
    VPS[Digital Ocean VPS]:::deploy

    %% Connections
    A --> S3
    B --> VPS
    I --> GHCR
    M --> GHCR
    GHCR --> E
    E --> VPS
```

