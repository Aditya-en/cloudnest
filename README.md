# CloudNest

CloudNest is an affordable cloud storage platform that allows users to securely upload, manage, and access their files. It leverages AWS S3 for storage, presigned URLs for secure uploads and downloads, and provides a user-friendly frontend built with React and Clerk authentication.

## Features

### Frontend
- **User Authentication**: Implemented using Clerk for seamless sign-in and sign-out.
- **File & Folder Management**:
  - Create folders and upload files.
  - Navigate through directories.
  - Delete files and folders.
  - Download files securely.
- **Dark Mode Support**: Toggle between light and dark themes.
- **Real-time Updates**: Files are fetched dynamically based on the current folder.

### Backend
- **Presigned URLs**: Securely upload and download files using AWS S3 presigned URLs.
- **File Operations**:
  - Fetch directory contents.
  - Create folders.
  - Delete files and folders.
- **Authentication**: Protect API endpoints using Clerk-authenticated tokens.

## Tech Stack

### Frontend
- **React (TypeScript)**: UI built using React with TypeScript for type safety.
- **Tailwind CSS**: Responsive and customizable UI styling.
- **Clerk**: Authentication provider for managing user sessions.
- **Heroicons**: Modern icons for file and folder representations.

### Backend
- **Node.js & Express**: REST API for handling cloud storage operations.
- **AWS S3**: Cloud storage solution for secure file management.
- **JWT Authentication**: Protect API endpoints using Clerk-authenticated JWTs.
- **Docker**: Backend can be containerized for easy deployment.

## Setup Instructions

### Prerequisites
- Node.js (>=16.x)
- AWS Account with S3 setup
- Clerk account for authentication

### Installation
#### Clone the Repository
```sh
git clone https://github.com/your-username/cloudnest.git
cd cloudnest
```

#### Frontend Setup
```sh
cd frontend
npm install
```

Create a `.env` file in `frontend` with the following:
```
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
VITE_BACKEND_URL=http://localhost:3000
```

Run the frontend:
```sh
npm run dev
```

#### Backend Setup
```sh
cd ../backend
npm install
```

Create a `.env` file in `backend` with the following:
```
PORT=3000
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_BUCKET_NAME=your-bucket-name
CLERK_SECRET_KEY=your-clerk-secret-key
```

Run the backend:
```sh
npm start
```

## Usage
1. Open the frontend at `http://localhost:5173`.
2. Sign in using Clerk authentication.
3. Create folders and upload files.
4. Navigate, delete, and download files as needed.

## Deployment
You can deploy the frontend using Vercel/Netlify and the backend using AWS Lambda, Heroku, or any Node.js-compatible cloud provider.

## Contributing
Pull requests are welcome! Please ensure your code follows best practices and includes necessary tests.

## License
[MIT](LICENSE)

