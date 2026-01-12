# Browser Screen Recorder MVP

A minimal viable product (MVP) for a browser-based screen recording application. It allows users to record their screen and microphone, trim the video purely on the client-side, and share it via a unique link.

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ installed.

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory.
2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  **Open the app**:
    Navigate to `http://localhost:3000` in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 🏗️ Architecture Decisions

### 1. Technology Stack
-   **Framework**: **Next.js 14+ (App Router)** was chosen for its robust routing, Server Components capabilities, and seamless API integration.
-   **Language**: **TypeScript** for type safety and better developer experience.
-   **Styling**: **Tailwind CSS** for rapid UI development and consistent design system.

### 2. Video Processing (The "Secret Sauce")
-   **Client-Side Trimming**: Instead of uploading huge raw video files to a server for processing, we use **FFmpeg.wasm**. This allows the browser to trim the video locally.
    -   *Decision*: This drastically reduces server bandwidth costs and upload times, as only the final trimmed video is uploaded.
    -   *Challenge*: FFmpeg.wasm requires `SharedArrayBuffer`, which necessitates specific security headers (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`). These are configured in `next.config.ts`.

### 3. State Management
-   **React Hooks**: `useScreenRecorder` encapsulates the complex logic of `MediaRecorder`, `AudioContext` mixing (for merging system audio + mic), and stream management.
-   **Local State**: Simple `useState` is used for UI state (recording, trimming, uploading) as the app scope is small.

### 4. Storage & Persistence (MVP)
-   **Database**: A simple JSON file (`data/db.json`) acts as the database.
    -   *Decision*: For an MVP, setting up a full SQL/NoSQL database introduces unnecessary complexity. A secure JSON file handled by a server-side helper (`src/lib/storage.ts`) is sufficient for demonstration.
-   **File Storage**: Videos are saved directly to the local filesystem (`public/uploads`).
    -   *Decision*: Avoids external cloud storage dependencies (S3) for this demo, making the project strictly self-contained.

## 🔮 Improvements for Production

If scaling this to a real-world product, here is what I would improve:

### 1. Robust Storage
-   **Cloud Storage**: Move video storage to **AWS S3** or **Cloudflare R2**. Serving videos from the local `public` folder is not scalable and won't work in serverless environments (like Vercel).
-   **Database**: Migrate `db.json` to a real database like **PostgreSQL** (via Prisma or Drizzle) or **MongoDB** to handle concurrent writes and scale.

### 2. Enhanced Video Processing
-   **Server-Side Fallback**: While client-side processing is great, some low-end devices might struggle. A server-side FFmpeg worker queue (using BullMQ + Redis) could handle heavy lifting if the client fails.
-   **Transcoding**: Convert uploads to HLS/DASH streams for better playback buffering on varying network speeds.

### 3. UX & Performance
-   **Optimistic UI**: instantly show the "Share" interface while the video uploads in the background.
-   **Authentication**: Add user accounts (Clerk/NextAuth) so users can manage their library of recordings.
-   **Edge CDN**: Serve the public watch pages via a CDN for global low-latency access.

### 4. Testing
-   **E2E Testing**: Add Playwright tests to automate the recording flow (mocking media devices) to ensure stability.
